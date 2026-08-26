package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/reppo-dev/chat-app/internal/utils"
)

const (
	CtxUserID          string = "userId"
	CtxUserDisplayName string = "name"
	CtxAuthorization   string = "Authorization"
)

func Authenticate() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := strings.TrimSpace(c.GetHeader(CtxAuthorization))
		if authHeader== "" || !strings.HasPrefix(strings.ToLower(authHeader),"bearer ") {
			utils.JSON(c,http.StatusUnauthorized,false,"Unauthorized",nil)
			c.Abort()
			return
		}

		accessToken := strings.TrimSpace(authHeader[7:])

		userId,name,err:= utils.ParsJWT(accessToken)
		if err != nil {
			utils.JSON(c,http.StatusUnauthorized,false,"Unauthorized",nil)
			c.Abort()
			return
		}

		c.Set(CtxUserID,userId)
		c.Set(CtxUserDisplayName,name)

		c.Next()
	}
}