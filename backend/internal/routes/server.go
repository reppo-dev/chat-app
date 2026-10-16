package routes

import (
	"database/sql"
	"os"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	db "github.com/reppo-dev/chat-app/internal/db/sqlc"
	"github.com/reppo-dev/chat-app/internal/realtime"
)

type Server struct {
	queries *db.Queries
	router  *gin.Engine
	db      *sql.DB
	hub     *realtime.Hub
}

func (server *Server) StartServer(address string) error {
	return server.router.Run(address)
}

func NewServer(queries *db.Queries, dbconn *sql.DB) *Server {
	router := gin.Default()

	clientURLsEnv := os.Getenv("CLIENT_URL")
	if clientURLsEnv == "" {
		clientURLsEnv = os.Getenv("FRONTEND_URL")
	}
	var allowedCustomOrigins []string
	if clientURLsEnv != "" {
		for _, u := range strings.Split(clientURLsEnv, ",") {
			cleaned := strings.TrimRight(strings.TrimSpace(u), "/")
			if cleaned != "" {
				allowedCustomOrigins = append(allowedCustomOrigins, cleaned)
			}
		}
	}

	router.Use(cors.New(cors.Config{
		AllowOriginFunc: func(origin string) bool {
			// Allow local development
			if strings.HasPrefix(origin, "http://localhost:") ||
				strings.HasPrefix(origin, "http://127.0.0.1:") ||
				origin == "http://localhost" ||
				origin == "http://127.0.0.1" {
				return true
			}
			// Allow Vercel deployments (production and preview branches)
			if strings.HasSuffix(origin, ".vercel.app") {
				return true
			}
			// Allow custom frontend URLs specified in environment
			for _, allowed := range allowedCustomOrigins {
				if origin == allowed {
					return true
				}
			}
			return false
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-Platform", "Upgrade", "Connection"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	hub := realtime.NewHub(queries)

	server := &Server{
		queries: queries,
		router:  router,
		db:      dbconn,
		hub:     hub,
	}

	SetUpRouter(router, server)

	return server
}