package routes

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	db "github.com/reppo-dev/chat-app/internal/db/sqlc"
	"github.com/reppo-dev/chat-app/internal/realtime"
	"github.com/reppo-dev/chat-app/internal/utils"
)

func (server *Server) handleSendMessage(c *gin.Context) {
	ctx,cancle:= context.WithTimeout(c.Request.Context(),5 *time.Second)
	defer cancle()

	userID,ok := getUserIDFromContext(c)
	if !ok {
		return
	}

	convID, ok := parseConversationID(c)
	if !ok {
		return
	}

	if !server.isMemberOfConversation(ctx, convID, userID) {
		utils.JSON(c, http.StatusForbidden, false, "You are not a member of this conversation", nil)
		return
	}

	var req struct {
		Text       *string `json:"text"`
		MediaFiles any     `json:"media_files"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.JSON(c, http.StatusBadRequest, false, "Invalid request body", nil)
		return
	}

	textStr := ""
	if req.Text != nil {
		textStr = strings.TrimSpace(*req.Text)
	}

	var mediaRaw json.RawMessage = []byte("[]")
	if req.MediaFiles != nil {
		b, err := json.Marshal(req.MediaFiles)
		if err == nil && len(b) > 0 {
			mediaRaw = b
		}
	}

	if textStr == "" && string(mediaRaw) == "[]" {
		utils.JSON(c, http.StatusBadRequest, false, "Message cannot be empty", nil)
		return
	}

	var nullText sql.NullString
	if textStr != "" {
		nullText = sql.NullString{Valid: true, String: textStr}
	}

	message, err := server.queries.CreateMessage(ctx, db.CreateMessageParams{
		ConversationID: convID,
		SenderID:       userID,
		Text:           nullText,
		MediaFiles:     mediaRaw,
	})
	if err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to send message", nil)
		return
	}

	_ = server.queries.UpdateConversationLastMessage(ctx, db.UpdateConversationLastMessageParams{
		ID:            convID,
		LastMessageID: sql.NullInt64{Valid: true, Int64: message.ID},
		LastMessageAt: sql.NullTime{Valid: true, Time: message.CreatedAt},
	})

	// Mark as seen for sender
	_ = server.queries.MarkMessageAsSeen(ctx, db.MarkMessageAsSeenParams{
		MessageID: message.ID,
		UserID:    userID,
	})

	// Broadcast message to other conversation members via WebSocket
	server.hub.SendEventToConversation(ctx, convID, userID, realtime.Event{
		EventType: string(realtime.EventMessage),
		Payload: gin.H{
			"message": message,
		},
	})

	utils.JSON(c, http.StatusCreated, true, "Message sent successfully", gin.H{
		"message": message,
	})
}


func (server *Server) handleGetConversationMessages(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	userID, ok := getUserIDFromContext(c)
	if !ok {
		return
	}

	convID, ok := parseConversationID(c)
	if !ok {
		return
	}

	if !server.isMemberOfConversation(ctx, convID, userID) {
		utils.JSON(c, http.StatusForbidden, false, "You are not a member of this conversation", nil)
		return
	}

	limit := int32(50)
	if l := c.Query("limit"); l != ""{
		if parsed,err := strconv.ParseInt(l,10,32);err == nil && parsed > 0 && parsed <= 100 {
			limit = int32(parsed)
		}
	}

	messages,err := server.queries.GetConversationMessages(ctx,db.GetConversationMessagesParams{
		ConversationID: convID,
		Limit: limit,
	})

	if err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch messages", nil)
		return
	}

	utils.JSON(c, http.StatusOK, true, "Messages fetched", gin.H{
		"messages": messages,
	})
}

