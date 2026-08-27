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
		
	} else {
		
    	switch post.Privacy {
    	case db.PostPrivacyPublic:
			

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


func (server *Server) handleUpdatePost(c *gin.Context) {
	ctx,cancel:= context.WithTimeout(c.Request.Context(),5 *time.Second)
	defer cancel()

	userIDAny ,exists:= c.Get(middleware.CtxUserID)
	if !exists {
		utils.JSON(c, http.StatusUnauthorized, false, "Unauthorized", nil)
		return
	}

	userID,ok:= userIDAny.(int64)
	if !ok {
		utils.JSON(c, http.StatusUnauthorized, false, "Unauthorized", nil)
		return
	}

	postID,err := strconv.ParseInt(c.Param("post_id"),10,64)
	if err!= nil {
		utils.JSON(c,http.StatusBadRequest,false,"Invalid post ID",nil)
		return
	}

	post,err := server.queries.GetPostByID(ctx,postID)
	if err != nil {
		if errors.Is(err,sql.ErrNoRows) {
			utils.JSON(c,http.StatusNotFound,false,"post not found",nil)
			return
		}
		utils.JSON(c,http.StatusInternalServerError,false,"Failed to fetch post",nil)
		return
	}

	if post.AuthorID != userID {
		utils.JSON(c,http.StatusForbidden,false,"You can only edit your own posts",nil)
		return
	}

	var req struct{
		Content         string `json:"content"`
		BackgroundColor string `json:"background_color"`
		Privacy         string `json:"privacy"`
	}

	if err := c.ShouldBindJSON(&req);err != nil {
		utils.JSON(c, http.StatusBadRequest, false, "Invalid request body", nil)
		return
	}

	bgColor := post.BackgroundColor
	if req.BackgroundColor != "" {
		bgColor = req.BackgroundColor
	}

	if req.Privacy == "" && req.Privacy != "public" && req.Privacy != "private" && req.Privacy != "friends" {
		utils.JSON(c,http.StatusBadRequest,false,"Invalid request privacy",nil)
		return
	}

	privacy := post.Privacy
	if req.Privacy != "" {
		privacy = db.PostPrivacy(req.Privacy)
	}

	content := post.Content
	if req.Content != "" {
		content = req.Content
	}

	updatedPost,err := server.queries.UpdatePost(ctx,db.UpdatePostParams{
		ID: postID,
		Content: content,
		BackgroundColor: bgColor,
		Privacy: privacy,
	})

	if err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to update post", nil)
		return
	}

	utils.JSON(c, http.StatusOK, true, "Post updated successfully", gin.H{
		"post": updatedPost,
	})
	
}


func (server *Server) handleDeletePost(c *gin.Context) {
	ctx,cancel:= context.WithTimeout(c.Request.Context(),5*time.Second)
	defer cancel()

	userIDAny, exists := c.Get(middleware.CtxUserID)
	if !exists {
		utils.JSON(c, http.StatusUnauthorized, false, "Unauthorized", nil)
		return
	}
	userID, ok := userIDAny.(int64)
	if !ok {
		utils.JSON(c, http.StatusUnauthorized, false, "Unauthorized", nil)
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

	if post.AuthorID != userID {
		utils.JSON(c, http.StatusForbidden, false, "You can only delete your own posts", nil)
		return
	}

	err = server.queries.DeletePost(ctx, postID)
	if err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to delete post", nil)
		return
	}

	utils.JSON(c, http.StatusOK, true, "Post deleted successfully", nil)
}


func (server *Server) handleGetUserPosts(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	userIDAny, exists := c.Get(middleware.CtxUserID)
	if !exists {
		utils.JSON(c, http.StatusUnauthorized, false, "Unauthorized", nil)
		return
	}
	userID, ok := userIDAny.(int64)
	if !ok {
		utils.JSON(c, http.StatusUnauthorized, false, "Unauthorized", nil)
		return
	}

	userId, err := strconv.ParseInt(c.Param("user_id"), 10, 64)
	if err != nil {
		utils.JSON(c, http.StatusBadRequest, false, "Invalid user ID", nil)
		return
	}

	limit := int32(20)
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.ParseInt(l, 10, 32); err == nil && parsed > 0 && parsed <= 100 {
			limit = int32(parsed)
		}
	}

	posts, err := server.queries.GetPostsByUser(ctx, db.GetPostsByUserParams{
		AuthorID: userId,
		Limit:    limit,
	})

	
	if err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch posts", nil)
		return
	}

	filteredPosts := make([]db.Posts, 0, len(posts))

	for _, post := range posts {
	    switch post.Privacy {
	    case db.PostPrivacyPublic:	
	        filteredPosts = append(filteredPosts, post)

	    case db.PostPrivacyPrivate:	
	        if post.AuthorID == userID {
	            filteredPosts = append(filteredPosts, post)
	        }

    	case db.PostPrivacyFriends:
    	    if post.AuthorID == userID {
    	        filteredPosts = append(filteredPosts, post)
    	        continue
    	    }

    	    isFriend, err := server.queries.IsFriend(ctx, db.IsFriendParams{
    	        UserID:   userID,
    	        FriendID: post.AuthorID,
    	    })
    	    if err != nil {
    	        utils.JSON(c, http.StatusInternalServerError, false, "Failed to check friendship", nil)
    	        return
    	    }

    	    if isFriend {
    	        filteredPosts = append(filteredPosts, post)
    	    }
    	}
	}

	utils.JSON(c, http.StatusOK, true, "Posts fetched", gin.H{
		"posts": filteredPosts,
	})
}


func (server *Server) handleGetFeed(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	userIDAny, exists := c.Get(middleware.CtxUserID)
	if !exists {
		utils.JSON(c, http.StatusUnauthorized, false, "Unauthorized", nil)
		return
	}
	userID, ok := userIDAny.(int64)
	if !ok {
		utils.JSON(c, http.StatusUnauthorized, false, "Unauthorized", nil)
		return
	}

	limit := int32(20)
	offset := int32(0)

	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.ParseInt(l, 10, 32); err == nil && parsed > 0 && parsed <= 100 {
			limit = int32(parsed)
		}
	}
	if o := c.Query("offset"); o != "" {
		if parsed, err := strconv.ParseInt(o, 10, 32); err == nil && parsed >= 0 {
			offset = int32(parsed)
		}
	}

	posts, err := server.queries.GetFeedPosts(ctx, db.GetFeedPostsParams{
		UserID: userID,
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		utils.JSON(c, http.StatusInternalServerError, false, "Failed to fetch feed", nil)
		return
	}

	filteredPosts := make([]db.Posts, 0, len(posts))

	for _, post := range posts {
	    switch post.Privacy {
	    case db.PostPrivacyPublic:	
	        filteredPosts = append(filteredPosts, post)

	    case db.PostPrivacyPrivate:	
	        if post.AuthorID == userID {
	            filteredPosts = append(filteredPosts, post)
	        }

    	case db.PostPrivacyFriends:
    	    if post.AuthorID == userID {
    	        filteredPosts = append(filteredPosts, post)
    	        continue
    	    }

    	    isFriend, err := server.queries.IsFriend(ctx, db.IsFriendParams{
    	        UserID:   userID,
    	        FriendID: post.AuthorID,
    	    })
    	    if err != nil {
    	        utils.JSON(c, http.StatusInternalServerError, false, "Failed to check friendship", nil)
    	        return
    	    }

    	    if isFriend {
    	        filteredPosts = append(filteredPosts, post)
    	    }
    	}
	}

	utils.JSON(c, http.StatusOK, true, "Feed fetched", gin.H{
		"posts": filteredPosts,
	})
}