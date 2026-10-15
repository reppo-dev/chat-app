package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/reppo-dev/chat-app/internal/middleware"
)

func SetUpRouter(router *gin.Engine, server *Server) {

	// Static file serving for uploads
	router.Static("/uploads", "./uploads")

	// Upload routes
	router.POST("/api/upload", middleware.Authenticate(), server.handleUploadFile)
	router.POST("/api/upload/multiple", middleware.Authenticate(), server.handleUploadMultipleFiles)

	// WebSocket routes (token passed in query string or header)
	router.GET("/ws", server.handleWebSocket)
	router.GET("/api/ws", server.handleWebSocket)

	// Auth routes
	router.POST("/api/auth/register-email", server.handleEmailRegister)
	router.POST("/api/auth/login-email", server.handleEmailLogin)
	router.POST("/api/auth/logout", middleware.Authenticate(), server.handleLogout)
	router.POST("/api/auth/refresh-session", server.handleRefreshSession)
	router.POST("/api/auth/current-user", middleware.Authenticate(), server.handleGetCurrentUser)

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

	// Comment routes
	router.POST("/api/posts/:post_id/comments", middleware.Authenticate(), server.handleCreateComment)
	router.GET("/api/posts/:post_id/comments", middleware.Authenticate(), server.handleGetPostComments)
	router.PUT("/api/comments/:comment_id", middleware.Authenticate(), server.handleUpdateComment)
	router.DELETE("/api/comments/:comment_id", middleware.Authenticate(), server.handleDeleteComment)

	// Reaction routes
	router.POST("/api/posts/:post_id/reactions", middleware.Authenticate(), server.handleCreateOrUpdateReaction)
	router.GET("/api/posts/:post_id/reactions", middleware.Authenticate(), server.handleGetReaction)
	router.DELETE("/api/posts/:post_id/reactions", middleware.Authenticate(), server.handleDeleteReaction)

	// Conversation routes
	router.POST("/api/conversations", middleware.Authenticate(), server.handleCreateConversation)
	router.GET("/api/conversations", middleware.Authenticate(), server.handleGetUserConversations)
	router.GET("/api/conversations/:conversation_id", middleware.Authenticate(), server.handleGetConversationByID)
	router.GET("/api/conversations/:conversation_id/members", middleware.Authenticate(), server.handleGetConversationMembers)
	router.POST("/api/conversations/:conversation_id/members", middleware.Authenticate(), server.handleAddConversationMember)
	router.DELETE("/api/conversations/:conversation_id/members/:member_id", middleware.Authenticate(), server.handleRemoveConversationMember)

	// Message routes
	router.POST("/api/conversations/:conversation_id/messages", middleware.Authenticate(), server.handleSendMessage)
	router.GET("/api/conversations/:conversation_id/messages", middleware.Authenticate(), server.handleGetConversationMessages)
	router.GET("/api/messages/:message_id", middleware.Authenticate(), server.handleGetMessageByID)
	router.PUT("/api/messages/:message_id", middleware.Authenticate(), server.handleUpdateMessage)
	router.DELETE("/api/messages/:message_id", middleware.Authenticate(), server.handleDeleteMessage)
	router.POST("/api/messages/:message_id/seen", middleware.Authenticate(), server.handleMarkMessageSeen)

	// Friend & Request routes
	router.POST("/api/friends/requests", middleware.Authenticate(), server.handleSendFriendRequest)
	router.POST("/api/friends/requests/send/:receiver_id", middleware.Authenticate(), server.handleSendFriendRequest)
	router.GET("/api/friends/requests/received", middleware.Authenticate(), server.handleGetReceivedFriendRequests)
	router.GET("/api/friends/requests/sent", middleware.Authenticate(), server.handleGetSentFriendRequests)
	router.POST("/api/friends/requests/:request_id/accept", middleware.Authenticate(), server.handleAcceptFriendRequest)
	router.POST("/api/friends/requests/:request_id/reject", middleware.Authenticate(), server.handleRejectFriendRequest)
	router.DELETE("/api/friends/requests/:request_id", middleware.Authenticate(), server.handleCancelFriendRequest)
	router.GET("/api/friends", middleware.Authenticate(), server.handleGetFriends)
	router.DELETE("/api/friends/:friend_id", middleware.Authenticate(), server.handleRemoveFriend)

	// Notification routes
	router.GET("/api/notifications", middleware.Authenticate(), server.handleGetUserNotifications)
	router.PUT("/api/notifications/:notification_id/read", middleware.Authenticate(), server.handleMarkNotificationRead)
	router.PUT("/api/notifications/read-all", middleware.Authenticate(), server.handleMarkAllNotificationsRead)
}