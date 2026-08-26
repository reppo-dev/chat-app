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

	
}