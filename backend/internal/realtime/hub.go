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
	mu      sync.RWMutex
	queries *db.Queries
}

func NewHub(queries *db.Queries) *Hub {
	return &Hub{
		Clients: make(map[int64]map[*Client]struct{}),
		queries: queries,
	}
}

func (h *Hub) BroadcastToAll(event Event) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for _, conns := range h.Clients{
		for c := range conns {
			c.SendEvent(event)
		}
	}
}

func (h *Hub) GetOnlineUserIDs() []int64 {
	h.mu.RLock()
	defer h.mu.RUnlock()

	ids := make([]int64,0,len(h.Clients))
	for id , conns := range h.Clients{
		if len(conns) > 0 {
			ids = append(ids, id)
		}
	}
	return ids
}

func (h *Hub) IsUserOnline(userID int64) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()

	conns , ok := h.Clients[userID]
	return ok && len(conns) > 0
}

func (h *Hub) SendEventToUser(userID int64,event Event) {
	h.mu.RLock()
	conns ,ok := h.Clients[userID]
	if !ok || len(conns) == 0 {
		h.mu.RUnlock()
		return
	}

	targetgroup := make([]*Client,0,len(conns))
	for c := range conns{
		targetgroup = append(targetgroup, c)
	}
	h.mu.RUnlock()

	for _ , c := range targetgroup {
		c.SendEvent(event)
	}
}


func (h *Hub) SendEventToUserIds(userIds []int64,sendId int64,event Event) {
	for _, id := range userIds{
		h.SendEventToUser(id,event)
	}
}


func (h *Hub) SendEventToConversation(ctx context.Context,conversationID int64,excludeUserID int64,event Event) {
	members,err := h.queries.GetConversationMembers(ctx,conversationID)
	if err != nil {
		log.Printf("error fetching conversation members for conv %d: %v",conversationID,err)
		return
	}

	for _,member := range members {
		if member.ID == excludeUserID {
			continue
		}
		h.SendEventToUser(member.ID,event)
	}
}

func (h *Hub) RegisterClientConnection(client *Client) {
	h.mu.Lock()
	conns,ok := h.Clients[client.User.ID]
	if !ok {
		conns = make(map[*Client]struct{})
		h.Clients[client.User.ID] = conns
	}
	
	conns[client] = struct{}{}
	firstConnection := len(conns) == 1
	h.mu.Unlock()

	onlineIDs := h.GetOnlineUserIDs()
	client.SendEvent(Event{
		EventType: string(EventCurrentUsers),
		Payload: map[string]any{
			"online_user_ids": onlineIDs,
		},
	})

	if firstConnection {
		userMap := models.UserToMap(client.User)
		h.BroadcastToAll(Event{
			EventType: string(EventCurrentUsers),
			Payload: userMap,
		})
	}
}

