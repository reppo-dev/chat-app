package realtime

import (
	"context"
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	db "github.com/reppo-dev/chat-app/internal/db/sqlc"
)

const(
	writeWait			= 10 * time.Second
	pongWait			= 60 * time.Second
	pingPeriod			= (pongWait * 9) / 10
	maxMessageSiz		= 512 * 1024
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
		log.Printf("warning: dropped event for client %d, channel full",c.User.ID)
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


func (c *Client) ReadPump(hub *Hub) {
	defer func()  {
		hub.UnrefisterClientConnection(c)
		c.Close()
	}()

	c.Conn.SetReadLimit(maxMessageSiz)
	_ = c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(appData string) error {
		_ = c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for{
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err,websocket.CloseGoingAway,websocket.CloseAbnormalClosure,websocket.CloseNormalClosure) {
				log.Printf("websocket read error for user %d: %v",c.User.ID,err)
			}
		break
		}
	
		var event Event
		if err := json.Unmarshal(message,&event); err != nil{
			continue
		}

		switch EventType(event.EventType){
		case EventTyping:
			if payload ,ok := event.Payload.(map[string]any);ok {
				if convIDVal,exists := payload["conversation_id"]; exists {
					var convID int64
					switch v := convIDVal.(type){
					case float64:
						convID = int64(v)
					case int64:
						convID = v
					}
					if convID > 0 {
						hub.SendEventToConversation(context.Background(),convID,c.User.ID,Event{
							EventType: string(EventTyping),
							Payload: map[string]any{
								"conversation_id":convID,
								"user_id": c.User.ID,
								"user_name": c.User.Name,
								"is_typing": payload["is_typing"],
							},
						})
					}
				}
			}
		case EventHeartbeat:
			c.SendEvent(Event{
				EventType: string(EventHeartbeat),
				Payload: map[string]any{
					"timestamp": time.Now().UnixMilli(),
				},
			})
		}
	}

}



func (c *Client) WritePump() {
	ticker := time.NewTicker(pongWait)
	defer func()  {
		ticker.Stop()
		c.Close()
	}()

	for{
		select{
		case event , ok := <- c.Send:
			_ = c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				_ = c.Conn.WriteMessage(websocket.CloseMessage,[]byte{})
				return
			}

			w,err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}

			if err := json.NewEncoder(w).Encode(event); err != nil{
				_ = w.Close()
				return
			}
			if err := w.Close(); err != nil{
				return
			}
		case <- ticker.C:
			_ = c.Conn.SetWriteDeadline(time.Now().Add(pongWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage,nil); err != nil{
				return
			}
		}
	}
}