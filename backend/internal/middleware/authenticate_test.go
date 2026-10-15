package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/reppo-dev/chat-app/internal/utils"
)

func TestAuthenticateMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)
	utils.InitJWT("test-jwt-secret-key-1234567890")

	validToken, err := utils.GenerateJWT(100, "TestUser")
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	router := gin.New()
	router.GET("/protected", Authenticate(), func(c *gin.Context) {
		userID, _ := c.Get(CtxUserID)
		userName, _ := c.Get(CtxUserDisplayName)
		c.JSON(http.StatusOK, gin.H{
			"user_id": userID,
			"name":    userName,
		})
	})

	// Case 1: No Authorization header
	reqNoAuth, _ := http.NewRequest(http.MethodGet, "/protected", nil)
	wNoAuth := httptest.NewRecorder()
	router.ServeHTTP(wNoAuth, reqNoAuth)
	if wNoAuth.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 for no auth header, got %d", wNoAuth.Code)
	}

	// Case 2: Invalid Bearer token
	reqBadToken, _ := http.NewRequest(http.MethodGet, "/protected", nil)
	reqBadToken.Header.Set(CtxAuthorization, "Bearer invalid.jwt.token")
	wBadToken := httptest.NewRecorder()
	router.ServeHTTP(wBadToken, reqBadToken)
	if wBadToken.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 for invalid token, got %d", wBadToken.Code)
	}

	// Case 3: Valid Bearer token
	reqValid, _ := http.NewRequest(http.MethodGet, "/protected", nil)
	reqValid.Header.Set(CtxAuthorization, "Bearer "+validToken)
	wValid := httptest.NewRecorder()
	router.ServeHTTP(wValid, reqValid)
	if wValid.Code != http.StatusOK {
		t.Errorf("expected 200 for valid token, got %d", wValid.Code)
	}
}
