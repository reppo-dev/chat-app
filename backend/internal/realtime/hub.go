package realtime

import (
	"log"
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
		queries: queries,
	}
}

func (h *Hub) broadcastToAll(event Event) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for _, conns := range h.Clients{
		for c := range conns {
			select{
			case c.Send <- event:
			default:
				log.Printf("waring: dropped event for client %d, channel full",c.User.ID)
			}
		}
	}
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
