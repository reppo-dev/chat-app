package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/reppo-dev/chat-app/internal/middleware"
)

func SetUpRouter(router *gin.Engine,server *Server) {

	// Auth routes
	router.POST("/api/auth/register-email",server.handleEmailRegister)
	router.POST("/api/auth/login-email",server.handleEmailLogin)
	router.POST("/api/auth/logout",middleware.Authenticate(),server.handleLogout)
	router.POST("/api/auth/refresh-session",server.handleRefreshSession)
	router.POST("/api/auth/current-user",middleware.Authenticate(),server.handleGetCurrentUser)

	// User routes
	router.PUT("/api/users/profile", middleware.Authenticate(), server.handleUpdateProfile)
	router.GET("/api/users/profile/:user_id", middleware.Authenticate(), server.handleGetUserProfile)
	router.GET("/api/users/search", middleware.Authenticate(), server.handleSearchUsers)
	router.GET("/api/users", middleware.Authenticate(), server.handleListUsers)

	// Post routes
	router.POST("/api/posts", middleware.Authenticate(), server.handleCreatePost)
	router.GET("/api/posts/feed", middleware.Authenticate(), server.handleGetFeed)
	router.GET("/api/posts/user/:user_id", middleware.Authenticate(), server.handleGetUserPosts)
	router.GET("/api/posts/:post_id", middleware.Authenticate(), server.handleGetPost)
	router.PUT("/api/posts/:post_id", middleware.Authenticate(), server.handleUpdatePost)
	router.DELETE("/api/posts/:post_id", middleware.Authenticate(), server.handleDeletePost)

	
}