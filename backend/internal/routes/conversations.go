package routes

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
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