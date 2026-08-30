package realtime

type EventType string

const (
	EventCurrentUsers      EventType = "current_users"
	EventUserOnline        EventType = "online"
	EventUserOffline       EventType = "offline"
	EventNewPrivate        EventType = "new_private"
	EventMessage           EventType = "message"
	EventMessageUpdated    EventType = "message_updated"
	EventMessageDeleted    EventType = "message_deleted"
	EventDelivered         EventType = "delivered"
	EventRead              EventType = "read"
	EventTyping            EventType = "typing"
	EventError             EventType = "error"
	EventHeartbeat         EventType = "heartbeat"
	EventServerShutdown    EventType = "shutdown"
	EventNotification      EventType = "notification"
	EventFriendRequest     EventType = "friend_request"
	EventFriendshipCreated EventType = "friendship_created"
	EventComment           EventType = "comment"
	EventReaction          EventType = "reaction"
)

type Event struct {
	EventType string `json:"event_type"`
	Payload   any    `json:"payload"`
}