package realtime

import (
	"sync"

	"github.com/gorilla/websocket"
	db "github.com/reppo-dev/chat-app/internal/db/sqlc"
)

type Client struct {
	User *db.Users		 `json:"user"`
	Conn *websocket.Conn `json:"-"`
	Send chan Event		 `json:"-"`
	once sync.Once		 `json:"-"`
}

func NewClient(user *db.Users,conn *websocket.Conn) *Client {
	return &Client{
		User: user,
		Conn: conn,
		Send: make(chan Event,512),
	}
}

