package routes

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/reppo-dev/chat-app/internal/realtime"
	"github.com/reppo-dev/chat-app/internal/utils"
)

func TestRouterEndpointsRegistration(t *testing.T) {
	gin.SetMode(gin.TestMode)
	utils.InitJWT("test-jwt-secret-key-1234567890")

	engine := gin.New()
	hub := realtime.NewHub(nil)
	server := &Server{
		router: engine,
		hub:    hub,
	}

	SetUpRouter(engine, server)

	routes := engine.Routes()
	expectedRoutes := map[string]string{
		"POST:/api/auth/register-email":                                     "",
		"POST:/api/auth/login-email":                                        "",
		"POST:/api/auth/logout":                                             "",
		"POST:/api/auth/refresh-session":                                    "",
		"POST:/api/auth/current-user":                                       "",
		"PUT:/api/users/profile":                                            "",
		"GET:/api/users/profile/:user_id":                                   "",
		"GET:/api/users/search":                                             "",
		"GET:/api/users":                                                    "",
		"POST:/api/posts":                                                   "",
		"GET:/api/posts/feed":                                               "",
		"GET:/api/posts/user/:user_id":                                      "",
		"GET:/api/posts/:post_id":                                           "",
		"PUT:/api/posts/:post_id":                                           "",
		"DELETE:/api/posts/:post_id":                                        "",
		"POST:/api/posts/:post_id/comments":                                 "",
		"GET:/api/posts/:post_id/comments":                                  "",
		"PUT:/api/comments/:comment_id":                                     "",
		"DELETE:/api/comments/:comment_id":                                  "",
		"POST:/api/posts/:post_id/reactions":                                "",
		"GET:/api/posts/:post_id/reactions":                                 "",
		"DELETE:/api/posts/:post_id/reactions":                              "",
		"POST:/api/conversations":                                           "",
		"GET:/api/conversations":                                            "",
		"GET:/api/conversations/:conversation_id":                           "",
		"GET:/api/conversations/:conversation_id/members":                   "",
		"POST:/api/conversations/:conversation_id/members":                  "",
		"DELETE:/api/conversations/:conversation_id/members/:member_id":     "",
		"POST:/api/conversations/:conversation_id/messages":                 "",
		"GET:/api/conversations/:conversation_id/messages":                  "",
		"GET:/api/messages/:message_id":                                     "",
		"PUT:/api/messages/:message_id":                                     "",
		"DELETE:/api/messages/:message_id":                                  "",
		"POST:/api/messages/:message_id/seen":                               "",
		"POST:/api/friends/requests":                                       "",
		"POST:/api/friends/requests/send/:receiver_id":                     "",
		"GET:/api/friends/requests/received":                                "",
		"GET:/api/friends/requests/sent":                                    "",
		"POST:/api/friends/requests/:request_id/accept":                     "",
		"POST:/api/friends/requests/:request_id/reject":                     "",
		"DELETE:/api/friends/requests/:request_id":                          "",
		"GET:/api/friends":                                                  "",
		"DELETE:/api/friends/:friend_id":                                    "",
		"GET:/api/notifications":                                            "",
		"PUT:/api/notifications/:notification_id/read":                      "",
		"PUT:/api/notifications/read-all":                                   "",
		"GET:/ws":                                                           "",
		"GET:/api/ws":                                                       "",
	}

	for _, route := range routes {
		key := route.Method + ":" + route.Path
		delete(expectedRoutes, key)
	}

	if len(expectedRoutes) > 0 {
		for missing := range expectedRoutes {
			t.Errorf("missing expected route registration: %s", missing)
		}
	}

	// Test unauthenticated access to protected routes returns 401
	req, _ := http.NewRequest(http.MethodGet, "/api/notifications", nil)
	w := httptest.NewRecorder()
	engine.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected status 401 for unauthorized notifications, got %d", w.Code)
	}
}
