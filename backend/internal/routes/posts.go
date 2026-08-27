package routes

import (
	"context"
	"encoding/json"
	"net/http"
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

	privacy := db.PostPrivacyPublic
	if req.Privacy != ""{
		privacy = db.PostPrivacy(req.Privacy)
	}

	mediaJSON,err := json.Marshal(req.MediaFiles)

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

	utils.JSON(c,http.StatusCreated,true,"Post created successfully",post)
}