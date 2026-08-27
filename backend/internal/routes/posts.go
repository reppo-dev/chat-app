package routes

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	db "github.com/reppo-dev/chat-app/internal/db/sqlc"
	"github.com/reppo-dev/chat-app/internal/middleware"
	"github.com/reppo-dev/chat-app/internal/utils"
)

func (server *Server) handleCreatePost(c *gin.Context) {
	ctx,cancel:= context.WithTimeout(c.Request.Context(),time.Second *5)
	defer cancel()

	userIDAny,exists:= c.Get(middleware.CtxUserID)
	if !exists {
		utils.JSON(c,http.StatusUnauthorized,false,"Unauthorized",nil)
		return
	}

	userID,ok := userIDAny.(int64)
	if !ok {
		utils.JSON(c,http.StatusUnauthorized,false,"Unauthorized",nil)
		return
	}

	var req struct{
		Content			string	`json:"content"`
		BackhroundColor string 	`json:"background_color"`
		MediaFiles		string	`json:"media_files"`
		Privacy			string	`json:"privacy"`
	}

	if err:= c.ShouldBindJSON(&req); err!=nil{
		utils.JSON(c,http.StatusBadRequest,false,"Invalid request body",nil)
		return
	}

	if req.Content == "" {
		utils.JSON(c,http.StatusBadRequest,false,"Content is required",nil)
		return
	}

	bgColor := "#ffffff"
	if req.BackhroundColor != "" {
		bgColor = req.BackhroundColor
	}
	if req.Privacy == "" && req.Privacy != "public" && req.Privacy != "private" && req.Privacy != "friends" {
		utils.JSON(c,http.StatusBadRequest,false,"Invalid request privacy",nil)
		return
	}

	privacy := db.PostPrivacyPublic
	if req.Privacy != ""{
		privacy = db.PostPrivacy(req.Privacy)
	}

	mediaJSON,err := json.Marshal(req.MediaFiles)
	if err != nil {
	    utils.JSON(c, http.StatusBadRequest, false, "Invalid media files", nil)
    	return
	}

	post,err := server.queries.CreatePost(ctx,db.CreatePostParams{
		AuthorID: userID,
		BackgroundColor: bgColor,
		Content: req.Content,
		MediaFiles: mediaJSON,
		Privacy: privacy,
	})

	if err!= nil {
		utils.JSON(c,http.StatusInternalServerError,false,"",nil)
		return
	}

	utils.JSON(c,http.StatusCreated,true,"Post created successfully",gin.H{
		"post":post,
	})
}


func (server *Server) handleGetPost(c *gin.Context) {
	ctx,cancel:= context.WithTimeout(c.Request.Context(),5*time.Second)
	defer cancel()

	userIDAny ,exists:= c.Get(middleware.CtxUserID)
	if !exists {
		utils.JSON(c,http.StatusUnauthorized,false,"Unauthorized",nil)
		return
	}

	userID,ok := userIDAny.(int64)
	if !ok {
		utils.JSON(c,http.StatusUnauthorized,false,"Unauthorized",nil)
		return
	}

	postId,err:= strconv.ParseInt(c.Param("post_id"),10,64)
	if err!=nil {
		utils.JSON(c,http.StatusBadRequest,false,"Invalid post id",nil)
		return
	}

	post,err := server.queries.GetPostByID(ctx,postId)
	if err!= nil {
		if errors.Is(err,sql.ErrNoRows) {
			utils.JSON(c,http.StatusNotFound,false,"Post not found",nil)
			return
		}
		utils.JSON(c,http.StatusInternalServerError,false,"Failed to found post",nil)
		return
	}

	if post.AuthorID == userID {
   		// صاحب پست است؛ همیشه اجازه دارد
	} else {
    	// حالا privacy را بررسی کن
    	switch post.Privacy {
    	case db.PostPrivacyPublic:
        	// اجازه دارد

	    case db.PostPrivacyFriends:
    	    isFriend, err := server.queries.IsFriend(ctx, db.IsFriendParams{
        	    UserID:   userID,
        	    FriendID: post.AuthorID,
        	})
        	if err != nil {
        	    utils.JSON(c, http.StatusInternalServerError, false, "Failed to check friendship", nil)
        	    return
        	}

        	if !isFriend {
        		utils.JSON(c, http.StatusForbidden, false, "You do not have permission to view this post", nil)
        	    return
        	}

	    case db.PostPrivacyPrivate:
    		utils.JSON(c, http.StatusForbidden, false, "You do not have permission to view this post", nil)
        	return

    	default:
        	utils.JSON(c, http.StatusForbidden, false, "Invalid post privacy", nil)
        	return
    	}
	}

	utils.JSON(c,http.StatusOK,true,"Post fetched",gin.H{
		"post":post,
	})
}

