package realtime

import (
	"context"
	"log"
	"sync"

	db "github.com/reppo-dev/chat-app/internal/db/sqlc"
	"github.com/reppo-dev/chat-app/internal/models"
)

type Hub struct {
	Clients map[int64]map[*Client]struct{}
	queries *db.Queries
	mu      sync.RWMutex
}

func NewHub(queries *db.Queries) *Hub {
	return &Hub{
		Clients: make(map[int64]map[*Client]struct{}),
		queries: queries,
	}
}

// BroadcastToAll sends an event to every connected client
func (h *Hub) BroadcastToAll(event Event) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for _, conns := range h.Clients {
		for c := range conns {
			c.SendEvent(event)
		}
	}
}

// GetOnlineUserIDs returns a slice of user IDs that currently have at least one active connection
func (h *Hub) GetOnlineUserIDs() []int64 {
	h.mu.RLock()
	defer h.mu.RUnlock()

	ids := make([]int64, 0, len(h.Clients))
	for id, conns := range h.Clients {
		if len(conns) > 0 {
			ids = append(ids, id)
		}
	}
	return ids
}

// IsUserOnline checks if a user has active WebSocket connections
func (h *Hub) IsUserOnline(userID int64) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()

	conns, ok := h.Clients[userID]
	return ok && len(conns) > 0
}

// SendEventToUser sends an event to all active connections belonging to a specific user
func (h *Hub) SendEventToUser(userID int64, event Event) {
	h.mu.RLock()
	conns, ok := h.Clients[userID]
	if !ok || len(conns) <= 0 {
		h.mu.RUnlock()
		return
	}

	// Copy pointers while holding lock
	targetClients := make([]*Client, 0, len(conns))
	for c := range conns {
		targetClients = append(targetClients, c)
	}
	h.mu.RUnlock()

	for _, c := range targetClients {
		c.SendEvent(event)
	}
}


// SendEventToUserIds sends an event to a list of user IDs
func (h *Hub) SendEventToUserIds(userIds []int64, event Event) {
	for _, id := range userIds {
		h.SendEventToUser(id, event)
	}
}

// SendEventToConversation finds all members of a conversation and sends them the event
func (h *Hub) SendEventToConversation(ctx context.Context, conversationID int64, excludeUserID int64, event Event) {
	members, err := h.queries.GetConversationMembers(ctx, conversationID)
	if err != nil {
		log.Printf("error fetching conversation members for conv %d: %v", conversationID, err)
		return
	}

	for _, member := range members {
		if member.ID == excludeUserID {
			continue
		}
		h.SendEventToUser(member.ID, event)
	}
}

// RegisterClientConnection registers a new client connection
func (h *Hub) RegisterClientConnection(client *Client) {
	h.mu.Lock()
	conns, ok := h.Clients[client.User.ID]
	if !ok {
		conns = make(map[*Client]struct{})
		h.Clients[client.User.ID] = conns
	}
	conns[client] = struct{}{}
	firstConnection := len(conns) == 1
	h.mu.Unlock()

	// Send list of currently online users to the newly connected client
	onlineIDs := h.GetOnlineUserIDs()
	client.SendEvent(Event{
		EventType: string(EventCurrentUsers),
		Payload: map[string]any{
			"online_user_ids": onlineIDs,
		},
	})

	// If this is the user's first active connection, broadcast online event
	if firstConnection {
		userMap := models.UserToMap(client.User)
		h.BroadcastToAll(Event{
			EventType: string(EventUserOnline),
			Payload:   userMap,
		})
	}
}

// UnregisterClientConnection removes a client connection
func (h *Hub) UnregisterClientConnection(client *Client) {
	h.mu.Lock()
	conns, ok := h.Clients[client.User.ID]
	if !ok {
		h.mu.Unlock()
		return
	}

	delete(conns, client)
	lastConnection := len(conns) == 0
	if lastConnection {
		delete(h.Clients, client.User.ID)
	}
	h.mu.Unlock()

	// If user has no more active connections, broadcast offline event
	if lastConnection {
		userMap := models.UserToMap(client.User)
		h.BroadcastToAll(Event{
			EventType: string(EventUserOffline),
			Payload:   userMap,
		})
	}
}