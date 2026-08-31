package routes

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	db "github.com/reppo-dev/chat-app/internal/db/sqlc"
	"github.com/reppo-dev/chat-app/internal/realtime"
	"github.com/reppo-dev/chat-app/internal/utils"
)

func (server *Server) checkPostAccess(ctx context.Context,post db.Posts,userID int64) bool {
	if post.AuthorID == userID {
		return true
	}

	switch post.Privacy{
	case db.PostPrivacyPublic:
		return true
	case db.PostPrivacyFriends:
		isFrend,err := server.queries.IsFriend(ctx, db.IsFriendParams{
			UserID: userID,
			FriendID: post.AuthorID,
		})

		return err == nil && isFrend
	case db.PostPrivacyPrivate:
		return false
	default:
		return false
	}
}

func (server *Server) handleCreateComment(c *gin.Context) {
	ctx,cancel := context.WithTimeout(c.Request.Context(),5 * time.Second)
	defer cancel()

	userID,ok := getUserIDFromContext(c)
	if !ok {
		return
	}

	postID,err := strconv.ParseInt(c.Param("post_id"),10,64)
	if err != nil {
		utils.JSON(c, http.StatusBadRequest, false, "Invalid post ID", nil)
		return
	}

	post,err := server.queries.GetPostByID(ctx,postID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			utils.JSON(c, http.StatusNotFound, false, "Post not found", nil)
			return
		}
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch post", nil)
		return
	}

	if !server.checkPostAccess(ctx, post, userID) {
		utils.JSON(c, http.StatusForbidden, false, "You do not have permission to view or comment on this post", nil)
		return
	}

	var req struct {
		Content       string `json:"content"`
		ParentID      *int64 `json:"parent_id"`
		ReplyToUserID *int64 `json:"reply_to_user_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.JSON(c, http.StatusBadRequest, false, "Invalid request body", nil)
		return
	}

	req.Content = strings.TrimSpace(req.Content)
	if req.Content == "" {
		utils.JSON(c, http.StatusBadRequest, false, "Comment content cannot be empty", nil)
		return
	}

	var parentID sql.NullInt64
	if req.ParentID != nil && *req.ParentID > 0 {
		parentID = sql.NullInt64{Valid: true, Int64: *req.ParentID}
	}

	var replyToUserID sql.NullInt64
	if req.ReplyToUserID != nil && *req.ReplyToUserID > 0 {
		replyToUserID = sql.NullInt64{Valid: true, Int64: *req.ReplyToUserID}
	}

	comment, err := server.queries.CreateComment(ctx, db.CreateCommentParams{
		PostID:        postID,
		ParentID:      parentID,
		UserID:        userID,
		ReplyToUserID: replyToUserID,
		Content:       req.Content,
	})
	if err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to create comment", nil)
		return
	}

	// Send notification to post author if not commenter
	if post.AuthorID != userID {
		notif, nErr := server.queries.CreateNotification(ctx, db.CreateNotificationParams{
			SenderID:   userID,
			ReceiverID: post.AuthorID,
			Type:       db.NotificationTypeComment,
			Content:    "commented on your post",
			LinkToID:   sql.NullInt64{Valid: true, Int64: postID},
		})
		if nErr == nil {
			server.hub.SendEventToUser(post.AuthorID, realtime.Event{
				EventType: string(realtime.EventNotification),
				Payload: gin.H{
					"notification": notif,
				},
			})
		}
	}

	// If reply to another user and not post author or self, notify that user
	if replyToUserID.Valid && replyToUserID.Int64 != userID && replyToUserID.Int64 != post.AuthorID {
		notif, nErr := server.queries.CreateNotification(ctx, db.CreateNotificationParams{
			SenderID:   userID,
			ReceiverID: replyToUserID.Int64,
			Type:       db.NotificationTypeComment,
			Content:    "replied to your comment",
			LinkToID:   sql.NullInt64{Valid: true, Int64: postID},
		})
		if nErr == nil {
			server.hub.SendEventToUser(replyToUserID.Int64, realtime.Event{
				EventType: string(realtime.EventNotification),
				Payload: gin.H{
					"notification": notif,
				},
			})
		}
	}

	utils.JSON(c, http.StatusCreated, true, "Comment created successfully", gin.H{
		"comment": comment,
	})
}

func (server *Server) handleGetPostComments(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	userID, ok := getUserIDFromContext(c)
	if !ok {
		return
	}

	postID, err := strconv.ParseInt(c.Param("post_id"), 10, 64)
	if err != nil {
		utils.JSON(c, http.StatusBadRequest, false, "Invalid post ID", nil)
		return
	}

	post, err := server.queries.GetPostByID(ctx, postID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			utils.JSON(c, http.StatusNotFound, false, "Post not found", nil)
			return
		}
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch post", nil)
		return
	}

	if !server.checkPostAccess(ctx, post, userID) {
		utils.JSON(c, http.StatusForbidden, false, "You do not have permission to view this post", nil)
		return
	}

	comments, err := server.queries.GetCommentsByPost(ctx, postID)
	if err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch comments", nil)
		return
	}

	utils.JSON(c, http.StatusOK, true, "Comments fetched", gin.H{
		"comments": comments,
	})
}

func (server *Server) handleUpdateComment(c *gin.Context) {
	ctx,cancel := context.WithTimeout(c.Request.Context(),5 * time.Second)
	defer cancel()

	userID,ok := getUserIDFromContext(c)
	if !ok {
		return
	}

	commentID,err := strconv.ParseInt(c.Param("comment_id"),10,64)
	if err != nil {
		utils.JSON(c, http.StatusBadRequest, false, "Invalid comment ID", nil)
		return
	}

	comment,err := server.queries.GetCommentByID(ctx,commentID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			utils.JSON(c, http.StatusNotFound, false, "Comment not found", nil)
			return
		}
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch comment", nil)
		return
	}

	if comment.UserID != userID {
		utils.JSON(c, http.StatusForbidden, false, "You can only edit your own comments", nil)
		return
	}

	var req struct {
		Content string `json:"content"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.JSON(c, http.StatusBadRequest, false, "Invalid request body", nil)
		return
	}

	req.Content = strings.TrimSpace(req.Content)
	if req.Content == "" {
		utils.JSON(c, http.StatusBadRequest, false, "Comment content cannot be empty", nil)
		return
	}

	updated , err := server.queries.UpdateComment(ctx,db.UpdateCommentParams{
		ID: commentID,
		Content: req.Content,
	})
	if err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to update comment", nil)
		return
	}

	utils.JSON(c, http.StatusOK, true, "Comment updated successfully", gin.H{
		"comment": updated,
	})
}


func (server *Server) handleDeleteComment(c *gin.Context) {
	ctx,cancel := context.WithTimeout(c.Request.Context(),5 *time.Second)
	defer cancel()

	userID , ok := getUserIDFromContext(c)
	if!ok {
		return
	}

	commentID,err := strconv.ParseInt(c.Param("comment_id"),10,64)
	if err != nil {
		utils.JSON(c, http.StatusBadRequest, false, "Invalid comment ID", nil)
		return
	}

	comment,err:= server.queries.GetCommentByID(ctx,commentID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			utils.JSON(c, http.StatusNotFound, false, "Comment not found", nil)
			return
		}
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch comment", nil)
		return
	}

	post, err := server.queries.GetPostByID(ctx, comment.PostID)
	if err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to verify post ownership", nil)
		return
	}

	if comment.UserID != userID && post.AuthorID != userID {
		utils.JSON(c, http.StatusForbidden, false, "You do not have permission to delete this comment", nil)
		return
	}

	if err := server.queries.DeleteComment(ctx, commentID); err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to delete comment", nil)
		return
	}

	utils.JSON(c, http.StatusOK, true, fmt.Sprintf("Comment %d deleted successfully", commentID), nil)
}