package realtime

import (
	"testing"

	db "github.com/reppo-dev/chat-app/internal/db/sqlc"
)

func TestHubOnlineTracking(t *testing.T) {
	hub := NewHub(nil)

	user1 := &db.Users{ID: 1, Name: "User 1", Email: "user1@example.com"}
	user2 := &db.Users{ID: 2, Name: "User 2", Email: "user2@example.com"}

	client1 := NewClient(user1, nil)
	client2 := NewClient(user2, nil)

	hub.RegisterClientConnection(client1)
	hub.RegisterClientConnection(client2)

	if !hub.IsUserOnline(1) {
		t.Errorf("expected user 1 to be online")
	}
	if !hub.IsUserOnline(2) {
		t.Errorf("expected user 2 to be online")
	}
	if hub.IsUserOnline(3) {
		t.Errorf("expected user 3 to be offline")
	}

	onlineIDs := hub.GetOnlineUserIDs()
	if len(onlineIDs) != 2 {
		t.Errorf("expected 2 online users, got %d", len(onlineIDs))
	}

	hub.UnregisterClientConnection(client1)

	if hub.IsUserOnline(1) {
		t.Errorf("expected user 1 to be offline after unregister")
	}
	if !hub.IsUserOnline(2) {
		t.Errorf("expected user 2 to remain online")
	}

	hub.UnregisterClientConnection(client2)

	if hub.IsUserOnline(2) {
		t.Errorf("expected user 2 to be offline after unregister")
	}
}
