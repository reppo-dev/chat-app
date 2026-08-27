package routes

import (
	"context"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	db "github.com/reppo-dev/chat-app/internal/db/sqlc"
	"github.com/reppo-dev/chat-app/internal/middleware"
	"github.com/reppo-dev/chat-app/internal/utils"
)

func getUserIDFromContext(c *gin.Context) (int64,bool) {
	userIDAny,exists:= c.Get(middleware.CtxUserID)
	if !exists {
		utils.JSON(c, http.StatusUnauthorized, false, "Unauthorized", nil)
		return 0, false
	}

	userID,ok:= userIDAny.(int64)
	if !ok {
		utils.JSON(c, http.StatusUnauthorized, false, "Unauthorized", nil)
		return 0, false
	}

	return userID, true
}

func parseConversationID(c *gin.Context) (int64,bool) {
	id,err:= strconv.ParseInt(c.Param("conversation_id"),10,64)
	if err != nil {
		utils.JSON(c, http.StatusBadRequest, false, "Invalid conversation ID", nil)
		return 0, false
	}
	return id, true
}

func (server *Server) isMemberOfConversation(ctx context.Context,conversation ,userID int64) bool {
	members,err:= server.queries.GetConversationMembers(ctx,conversation)
	if err != nil {
		return false
	}
	for _, m := range members {
		if m.ID == userID {
			return true
		}
	}
	return false
}

func (server *Server) getConversationMember(ctx context.Context, conversationID int64) []db.Users {
	members,err := server.queries.GetConversationMembers(ctx,conversationID)
	if err != nil {
		return []db.Users{}
	}
	return members
}