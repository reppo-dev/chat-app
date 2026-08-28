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

func parseConversationType(s string) (db.ConversationType, bool) {
	switch strings.ToLower(s) {
	case "direct":
		return db.ConversationTypeDirect, true
	case "group":
		return db.ConversationTypeGroup, true
	case "channel":
		return db.ConversationTypeChannel, true
	default:
		return "", false
	}
}


func (server *Server) handleCreateConversation(c *gin.Context) {
	ctx,cancel := context.WithTimeout(c.Request.Context(),5 *time.Second)
	defer cancel()

	userID, ok:= getUserIDFromContext(c)
	if !ok {
		utils.JSON(c,http.StatusBadRequest,false,"Invalid request",nil)
		return
	}

	var req struct{
		ConversationType string  `json:"conversation_type"`
		MemberIDs        []int64 `json:"member_ids"`
		GroupName        *string `json:"group_name"`
	}

	if err := c.ShouldBindJSON(&req);err != nil {
		utils.JSON(c,http.StatusBadRequest,false,"Invalid request body",nil)
		return
	}

	convType,valid := parseConversationType(req.ConversationType)

	if !valid {
		utils.JSON(c,http.StatusBadRequest,false,"Invalid conversation",nil)
		return
	}

	if len(req.MemberIDs) == 0 {
		utils.JSON(c, http.StatusBadRequest, false, "At least one member is required", nil)
		return
	}

	for _,id := range req.MemberIDs{
		if id == userID{
			utils.JSON(c, http.StatusBadRequest, false, "You cannot add yourself as a member", nil)
			return
		}
	}

	switch convType {
	case db.ConversationTypeDirect:
		if len(req.MemberIDs) != 1 {
		    utils.JSON(c, http.StatusBadRequest, false, "Direct conversation requires exactly one member", nil)
		    return
		}

		existingConv , err := server.queries.GetConversationByMembers(ctx,db.GetConversationByMembersParams{
			UserID: userID,
			UserID_2: req.MemberIDs[0],
		})

		if err == nil {
			utils.JSON(c, http.StatusOK, true, "Conversation already exists", gin.H{
				"conversation": existingConv,
			})
			return
		}

	case db.ConversationTypeGroup,db.ConversationTypeChannel:
		if req.GroupName == nil || strings.TrimSpace(*req.GroupName) == "" {
			utils.JSON(c, http.StatusBadRequest, false, "Group/channel conversation requires a group_name", nil)
			return
		}
	}

	var groupName sql.NullString
	if req.GroupName != nil && strings.TrimSpace(*req.GroupName) != "" {
		groupName = sql.NullString{Valid: true,String: *req.GroupName}
	}

	var groupOwnerID sql.NullInt64
	if convType == db.ConversationTypeGroup || convType == db.ConversationTypeChannel {
		groupOwnerID = sql.NullInt64{Valid: true,Int64: userID}
	}

	tx ,err := server.db.BeginTx(ctx,nil)
	if err != nil {
		utils.JSON(c,http.StatusInternalServerError,false,"Failed to start transaction",nil)
		return
	}

	defer tx.Rollback()

	qtx:= server.queries.WithTx(tx)

	conversation, err := qtx.CreateConversation(ctx,db.CreateConversationParams{
		GroupOwnerID: groupOwnerID,
		ConversationType: convType,
		GroupName: groupName,
	})

	if err != nil {
		utils.JSON(c,http.StatusInternalServerError,false,"Failed to create conversation",nil)
		return
	}

	err = qtx.AddConversationMember(ctx,db.AddConversationMemberParams{
		ConversationID: conversation.ID,
		UserID: userID,
	})
	if err != nil {
		utils.JSON(c,http.StatusInternalServerError,false,"Failed to add member",nil)
		return
	}

	for _,memberID := range req.MemberIDs{
		err = qtx.AddConversationMember(ctx,db.AddConversationMemberParams{
			ConversationID: conversation.ID,
			UserID: memberID,
		})
		if err != nil {
			utils.JSON(c,http.StatusInternalServerError,false,"Failed to add member",nil,)
			return
		}
	}

	if err := tx.Commit();err != nil{
		utils.JSON(c,http.StatusInternalServerError,false,"Failed to save conversation",nil)
		return
	}

	utils.JSON(c, http.StatusCreated, true, "Conversation created successfully", gin.H{
		"conversation": conversation,
	})

}

func (server *Server) handleGetUserConversations(c *gin.Context) {
	ctx,cancel:= context.WithTimeout(c.Request.Context(),5 *time.Second)
	defer cancel()

	userID,ok := getUserIDFromContext(c)
	if !ok {
		utils.JSON(c,http.StatusBadRequest,false,"Invalid request",nil)
		return
	}

	conversations,err := server.queries.GetUserConversations(ctx,userID)
	if err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch conversations", nil)
		return
	}
	
	utils.JSON(c, http.StatusOK, true, "Conversations fetched", gin.H{
		"conversations": conversations,
	})
}

func (server *Server) handleGetConversationByID(c *gin.Context) {
	ctx,cancel := context.WithTimeout(c.Request.Context(),5 *time.Second)
	defer cancel()

	userID,ok := getUserIDFromContext(c)
	if !ok {
		utils.JSON(c,http.StatusBadRequest,false,"Invalid request",nil)
		return
	}

	conversationID,ok := parseConversationID(c)
	if !ok {
		utils.JSON(c,http.StatusBadRequest,false,"Invalid request body",nil)
		return
	}
	if !server.isMemberOfConversation(ctx,conversationID,userID) {
		utils.JSON(c, http.StatusForbidden, false, "You are not a member of this conversation", nil)
		return
	}

	conversation, err := server.queries.GetConversationByID(ctx, conversationID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			utils.JSON(c, http.StatusNotFound, false, "Conversation not found", nil)
			return
		}
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch conversation", nil)
		return
	}

	utils.JSON(c, http.StatusOK, true, "Conversation fetched", gin.H{
		"conversation": conversation,
	})

}