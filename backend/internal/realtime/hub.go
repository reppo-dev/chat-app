package realtime

import (
	"sync"

	db "github.com/reppo-dev/chat-app/internal/db/sqlc"
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


func (h *Hub) GetClients(userId int64) ([]*Client,bool) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	conns , ok := h.Clients[userId]
	if !ok || len(conns) == 0 {
		return nil,false
	}

	clients := make([]*Client,0,len(conns))
	for c := range conns{
		clients = append(clients,c)
	}

	return clients,true
}


func (h *Hub) SendEventToUserIds(userIds []int64,sendId int64,eventType EventType,payload map[string]any) {
	for _, id := range userIds{
		h.mu.RLock()
		conns,ok := h.Clients[id]
		h.mu.RUnlock()
		if !ok {
			continue
		}

		for c:= range conns{
			c.SendEvent(Event{
				EventType: string(eventType),
				Payload: payload,
			})
		}
	}
}


