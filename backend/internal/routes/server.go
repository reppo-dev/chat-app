package routes

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	db "github.com/reppo-dev/chat-app/internal/db/sqlc"
)

type Server struct {
	queries *db.Queries
	router *gin.Engine
}

func (server *Server) StartServer(address string) error {
	return server.router.Run(address)
}

func NewServer(queries *db.Queries) *Server {
	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-Platform"},
		AllowCredentials: true,
	}))

	server:= &Server{
		queries: queries,
		router: router,
	}

	SetUpRouter(router,server)

	return server
}