package routes

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	db "github.com/reppo-dev/chat-app/internal/db/sqlc"
	"github.com/reppo-dev/chat-app/internal/realtime"
	"github.com/reppo-dev/chat-app/internal/utils"
)

func (server *Server) handleSendFriendRequest(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	userID, ok := getUserIDFromContext(c)
	if !ok {
		return
	}

	var receiverID int64
	if param := c.Param("receiver_id"); param != "" {
		parsed, err := strconv.ParseInt(param, 10, 64)
		if err != nil {
			utils.JSON(c, http.StatusBadRequest, false, "Invalid receiver ID", nil)
			return
		}
		receiverID = parsed
	} else {
		var req struct {
			ReceiverID int64 `json:"receiver_id"`
		}
		if err := c.ShouldBindJSON(&req); err != nil || req.ReceiverID == 0 {
			utils.JSON(c, http.StatusBadRequest, false, "receiver_id is required", nil)
			return
		}
		receiverID = req.ReceiverID
	}

	if userID == receiverID {
		utils.JSON(c, http.StatusBadRequest, false, "You cannot send a friend request to yourself", nil)
		return
	}

	_, err := server.queries.GetUserByID(ctx, receiverID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			utils.JSON(c, http.StatusNotFound, false, "User not found", nil)
			return
		}
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to verify user", nil)
		return
	}

	isFriend, err := server.queries.IsFriend(ctx, db.IsFriendParams{
		UserID:   userID,
		FriendID: receiverID,
	})
	if err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to check friendship", nil)
		return
	}
	if isFriend {
		utils.JSON(c, http.StatusBadRequest, false, "You are already friends with this user", nil)
		return
	}

	// Check if a pending request already exists in either direction
	_, err = server.queries.GetPendingFriendRequest(ctx, db.GetPendingFriendRequestParams{
		SenderID:   userID,
		ReceiverID: receiverID,
	})
	if err == nil {
		utils.JSON(c, http.StatusConflict, false, "Friend request already sent", nil)
		return
	}

	_, err = server.queries.GetPendingFriendRequest(ctx, db.GetPendingFriendRequestParams{
		SenderID:   receiverID,
		ReceiverID: userID,
	})
	if err == nil {
		utils.JSON(c, http.StatusConflict, false, "This user already sent you a friend request. Please accept it instead.", nil)
		return
	}

	request, err := server.queries.CreateFriendRequest(ctx, db.CreateFriendRequestParams{
		SenderID:   userID,
		ReceiverID: receiverID,
	})
	if err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to send friend request", nil)
		return
	}

	// Create notification and emit realtime event
	notif, nErr := server.queries.CreateNotification(ctx, db.CreateNotificationParams{
		SenderID:   userID,
		ReceiverID: receiverID,
		Type:       db.NotificationTypeFriendRequest,
		Content:    "sent you a friend request",
		LinkToID:   sql.NullInt64{Valid: true, Int64: request.ID},
	})
	if nErr == nil {
		server.hub.SendEventToUser(receiverID, realtime.Event{
			EventType: string(realtime.EventFriendRequest),
			Payload: gin.H{
				"notification":   notif,
				"friend_request": request,
			},
		})
	}

	utils.JSON(c, http.StatusCreated, true, "Friend request sent successfully", gin.H{
		"friend_request": request,
	})
}

func (server *Server) handleGetReceivedFriendRequests(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	userID, ok := getUserIDFromContext(c)
	if !ok {
		return
	}

	requests, err := server.queries.GetReceivedFriendRequests(ctx, userID)
	if err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch friend requests", nil)
		return
	}

	utils.JSON(c, http.StatusOK, true, "Friend requests fetched", gin.H{
		"friend_requests": requests,
	})
}

func (server *Server) handleGetSentFriendRequests(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	userID, ok := getUserIDFromContext(c)
	if !ok {
		return
	}

	requests, err := server.queries.GetSentFriendRequests(ctx, userID)
	if err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch sent friend requests", nil)
		return
	}

	utils.JSON(c, http.StatusOK, true, "Sent friend requests fetched", gin.H{
		"friend_requests": requests,
	})
}

func (server *Server) handleAcceptFriendRequest(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	userID, ok := getUserIDFromContext(c)
	if !ok {
		return
	}

	requestID, err := strconv.ParseInt(c.Param("request_id"), 10, 64)
	if err != nil {
		utils.JSON(c, http.StatusBadRequest, false, "Invalid request ID", nil)
		return
	}

	request, err := server.queries.GetFriendRequestByID(ctx, requestID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			utils.JSON(c, http.StatusNotFound, false, "Friend request not found", nil)
			return
		}
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch friend request", nil)
		return
	}

	if request.ReceiverID != userID {
		utils.JSON(c, http.StatusForbidden, false, "You are not authorized to accept this request", nil)
		return
	}

	if request.Status != db.FriendRequestStatusPending {
		utils.JSON(c, http.StatusBadRequest, false, "Friend request is already resolved", nil)
		return
	}

	tx, err := server.db.BeginTx(ctx, nil)
	if err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to start transaction", nil)
		return
	}
	defer tx.Rollback()

	qtx := server.queries.WithTx(tx)

	acceptedReq, err := qtx.AcceptFriendRequest(ctx, requestID)
	if err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to accept friend request", nil)
		return
	}

	// Create bidirectional friendship
	if err := qtx.CreateFriendship(ctx, db.CreateFriendshipParams{
		UserID:   request.SenderID,
		FriendID: request.ReceiverID,
	}); err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to create friendship", nil)
		return
	}

	if err := qtx.CreateFriendship(ctx, db.CreateFriendshipParams{
		UserID:   request.ReceiverID,
		FriendID: request.SenderID,
	}); err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to create friendship", nil)
		return
	}

	if err := tx.Commit(); err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to commit friendship", nil)
		return
	}

	// Notify the sender that the request was accepted
	notif, nErr := server.queries.CreateNotification(ctx, db.CreateNotificationParams{
		SenderID:   userID,
		ReceiverID: request.SenderID,
		Type:       db.NotificationTypeFriendRequest,
		Content:    "accepted your friend request",
		LinkToID:   sql.NullInt64{Valid: true, Int64: userID},
	})
	if nErr == nil {
		server.hub.SendEventToUser(request.SenderID, realtime.Event{
			EventType: string(realtime.EventFriendshipCreated),
			Payload: gin.H{
				"notification": notif,
				"friend_id":    userID,
			},
		})
	}

	utils.JSON(c, http.StatusOK, true, "Friend request accepted", gin.H{
		"friend_request": acceptedReq,
	})
}

func (server *Server) handleRejectFriendRequest(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	userID, ok := getUserIDFromContext(c)
	if !ok {
		return
	}

	requestID, err := strconv.ParseInt(c.Param("request_id"), 10, 64)
	if err != nil {
		utils.JSON(c, http.StatusBadRequest, false, "Invalid request ID", nil)
		return
	}

	request, err := server.queries.GetFriendRequestByID(ctx, requestID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			utils.JSON(c, http.StatusNotFound, false, "Friend request not found", nil)
			return
		}
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch friend request", nil)
		return
	}

	if request.ReceiverID != userID {
		utils.JSON(c, http.StatusForbidden, false, "You are not authorized to reject this request", nil)
		return
	}

	if request.Status != db.FriendRequestStatusPending {
		utils.JSON(c, http.StatusBadRequest, false, "Friend request is already resolved", nil)
		return
	}

	rejectedReq, err := server.queries.RejectFriendRequest(ctx, requestID)
	if err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to reject friend request", nil)
		return
	}

	utils.JSON(c, http.StatusOK, true, "Friend request rejected", gin.H{
		"friend_request": rejectedReq,
	})
}

func (server *Server) handleCancelFriendRequest(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	userID, ok := getUserIDFromContext(c)
	if !ok {
		return
	}

	requestID, err := strconv.ParseInt(c.Param("request_id"), 10, 64)
	if err != nil {
		utils.JSON(c, http.StatusBadRequest, false, "Invalid request ID", nil)
		return
	}

	request, err := server.queries.GetFriendRequestByID(ctx, requestID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			utils.JSON(c, http.StatusNotFound, false, "Friend request not found", nil)
			return
		}
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch friend request", nil)
		return
	}

	if request.SenderID != userID {
		utils.JSON(c, http.StatusForbidden, false, "You can only cancel requests you sent", nil)
		return
	}

	if err := server.queries.DeleteFriendRequest(ctx, requestID); err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to cancel friend request", nil)
		return
	}

	utils.JSON(c, http.StatusOK, true, "Friend request cancelled", nil)
}

func (server *Server) handleGetFriends(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	userID, ok := getUserIDFromContext(c)
	if !ok {
		return
	}

	targetUserID := userID
	if targetParam := c.Query("user_id"); targetParam != "" {
		if parsed, err := strconv.ParseInt(targetParam, 10, 64); err == nil && parsed > 0 {
			targetUserID = parsed
		}
	}

	friends, err := server.queries.GetFriends(ctx, targetUserID)
	if err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch friends", nil)
		return
	}

	utils.JSON(c, http.StatusOK, true, "Friends fetched", gin.H{
		"friends": friends,
	})
}

func (server *Server) handleRemoveFriend(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	userID, ok := getUserIDFromContext(c)
	if !ok {
		return
	}

	friendID, err := strconv.ParseInt(c.Param("friend_id"), 10, 64)
	if err != nil {
		utils.JSON(c, http.StatusBadRequest, false, "Invalid friend ID", nil)
		return
	}

	tx, err := server.db.BeginTx(ctx, nil)
	if err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to start transaction", nil)
		return
	}
	defer tx.Rollback()

	qtx := server.queries.WithTx(tx)

	if err := qtx.DeleteFriendship(ctx, db.DeleteFriendshipParams{
		UserID:   userID,
		FriendID: friendID,
	}); err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to remove friendship", nil)
		return
	}

	if err := qtx.DeleteFriendship(ctx, db.DeleteFriendshipParams{
		UserID:   friendID,
		FriendID: userID,
	}); err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to remove friendship", nil)
		return
	}

	if err := tx.Commit(); err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to commit changes", nil)
		return
	}

	utils.JSON(c, http.StatusOK, true, "Friend removed successfully", nil)
}
