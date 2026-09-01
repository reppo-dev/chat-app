package routes

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	db "github.com/reppo-dev/chat-app/internal/db/sqlc"
	"github.com/reppo-dev/chat-app/internal/realtime"
	"github.com/reppo-dev/chat-app/internal/utils"
)

func parseReactionType(s string) (db.ReactionType, bool) {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "like":
		return db.ReactionTypeLike, true
	case "wow":
		return db.ReactionTypeWow, true
	case "love":
		return db.ReactionTypeLove, true
	case "angry":
		return db.ReactionTypeAngry, true
	case "haha":
		return db.ReactionTypeHaha, true
	case "sad":
		return db.ReactionTypeSad, true
	default:
		return "", false
	}
}

func (server *Server) handlerCreateOrUpdateReaction(c *gin.Context) {
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
		utils.JSON(c, http.StatusForbidden, false, "You do not have permission to react to this post", nil)
		return
	}

	var req struct {
		Type string `json:"type"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.JSON(c, http.StatusBadRequest, false, "Invalid request body", nil)
		return
	}

	reactionType, valid := parseReactionType(req.Type)
	if !valid {
		utils.JSON(c, http.StatusBadRequest, false, "Invalid reaction type (must be like, wow, love, angry, haha, sad)", nil)
		return
	}

	existingReaction, err := server.queries.GetReaction(ctx, db.GetReactionParams{
		UserID: userID,
		PostID: postID,
	})

	if err != nil{
		if errors.Is(err,sql.ErrNoRows) {
			reaction,cErr := server.queries.CreateReaction(ctx,db.CreateReactionParams{
				UserID: userID,
				PostID: postID,
				Type: reactionType,
			})
			if cErr != nil {
				utils.JSON(c, http.StatusInternalServerError, false, "Failed to create reaction", nil)
				return
			}

			if post.AuthorID != userID{
				notif,nErr := server.queries.CreateNotification(ctx,db.CreateNotificationParams{
					SenderID: userID,
					ReceiverID: post.AuthorID,
					Type: db.NotificationTypeReaction,
					Content: "reacted to your post",
					LinkToID: sql.NullInt64{Valid: true,Int64: postID},
				})
				if nErr == nil {
					server.hub.SendEventToUser(post.AuthorID,realtime.Event{
						EventType: string(realtime.EventNotification),
						Payload: gin.H{
							"notification":notif,
						},
					})
				}
			}

			utils.JSON(c, http.StatusCreated, true, "Reaction created", gin.H{
				"reaction": reaction,
			})
			return
		}

		utils.JSON(c, http.StatusInternalServerError, false, "Failed to check reaction", nil)
		return
	}

	if existingReaction.Type == reactionType {
		if err := server.queries.DeleteReaction(ctx, db.DeleteReactionParams{
			UserID: userID,
			PostID: postID,
		}); err != nil {
			utils.JSON(c, http.StatusInternalServerError, false, "Failed to remove reaction", nil)
			return
		}

		utils.JSON(c, http.StatusOK, true, "Reaction removed", gin.H{
			"reaction": nil,
		})
		return
	}

	// Update existing reaction
	updated, err := server.queries.UpdateReaction(ctx, db.UpdateReactionParams{
		UserID: userID,
		PostID: postID,
		Type:   reactionType,
	})
	if err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to update reaction", nil)
		return
	}

	utils.JSON(c, http.StatusOK, true, "Reaction updated", gin.H{
		"reaction": updated,
	})
}


