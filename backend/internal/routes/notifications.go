package routes

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	db "github.com/reppo-dev/chat-app/internal/db/sqlc"
	"github.com/reppo-dev/chat-app/internal/utils"
)

func (server *Server) handleGetUserNotifications(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	userID, ok := getUserIDFromContext(c)
	if !ok {
		return
	}

	limit := int32(userID)
	if l := c.Query("limit"); l != ""{
		if parsed,err := strconv.ParseInt(l,10,32);err != nil && parsed >0 && parsed<= 100{
			limit = int32(parsed)
		}
	}

	notifications,err := server.queries.GetUserNotifications(ctx,db.GetUserNotificationsParams{
		ReceiverID: userID,
		Limit: limit,
	})
	if err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch notifications", nil)
		return
	}

	utils.JSON(c, http.StatusOK, true, "Notifications fetched", gin.H{
		"notifications": notifications,
	})
}

func (server *Server) handleMarkNotificationRead(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	_, ok := getUserIDFromContext(c)
	if !ok {
		return
	}

	notifID, err := strconv.ParseInt(c.Param("notification_id"), 10, 64)
	if err != nil {
		utils.JSON(c, http.StatusBadRequest, false, "Invalid notification ID", nil)
		return
	}

	if err := server.queries.MarkNotificationAsRead(ctx, notifID); err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to mark notification as read", nil)
		return
	}

	utils.JSON(c, http.StatusOK, true, "Notification marked as read", nil)
}