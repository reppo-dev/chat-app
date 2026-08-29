package realtime

import (
	"sync"
	"time"

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

func (c *Client) SendEvent(event Event) {
	select{
	case c.Send <- event:
	default:
	}
}

func (c *Client) Close() {
	c.once.Do(func() {
		if c.Conn != nil {
			_ = c.Conn.WriteControl(websocket.CloseMessage,websocket.FormatCloseMessage(websocket.CloseNormalClosure,"Closing connection"),time.Now().Add(time.Second))
			_ = c.Conn.Close()
		}
		close(c.Send)
	})
}