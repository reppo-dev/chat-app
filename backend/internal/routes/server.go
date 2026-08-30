package routes

import (
	"database/sql"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	db "github.com/reppo-dev/chat-app/internal/db/sqlc"
	"github.com/reppo-dev/chat-app/internal/realtime"
)

type Server struct {
	queries *db.Queries
	router  *gin.Engine
	db      *sql.DB
	hub		*realtime.Hub
}

func (server *Server) StartServer(address string) error {
	return server.router.Run(address)
}

func NewServer(queries *db.Queries,dbconn *sql.DB) *Server {
	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-Platform"},
		AllowCredentials: true,
	}))

	hub := realtime.NewHub(queries)

	server:= &Server{
		queries: queries,
		router: router,
		db: dbconn,
		hub: hub,
	}

	SetUpRouter(router,server)

	return server
}