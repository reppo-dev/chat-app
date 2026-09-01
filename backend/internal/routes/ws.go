package routes

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/reppo-dev/chat-app/internal/realtime"
	"github.com/reppo-dev/chat-app/internal/utils"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize: 1024 * 4,
	WriteBufferSize: 1024 * 4,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}


func (server *Server) handleWebsocket(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		authHeader := c.GetHeader("Authorization")
		if strings.HasPrefix(strings.ToLower(authHeader),"bearer ") {
			token = strings.TrimSpace(authHeader[7:])
		}
	}

	if token == "" {
		utils.JSON(c, http.StatusUnauthorized, false, "Missing token", nil)
		return
	}

	userID , _,err := utils.ParsJWT(token)
	if err != nil {
		utils.JSON(c, http.StatusUnauthorized, false, "Invalid or expired token", nil)
		return
	}

	user, err := server.queries.GetUserByID(c.Request.Context(), userID)
	if err != nil {
		utils.JSON(c, http.StatusUnauthorized, false, "User not found", nil)
		return
	}

	conn ,err := upgrader.Upgrade(c.Writer,c.Request,nil)
	if err != nil {
		var wsErr websocket.HandshakeError
		if !errors.As(err, &wsErr) {
			utils.JSON(c, http.StatusBadRequest, false, "Could not open websocket connection", nil)
		}
		return
	}

	client := realtime.NewClient(&user,conn)

	server.hub.RegisterClientConnection(client)

	go client.WritePump()
	go client.ReadPump(server.hub)

}