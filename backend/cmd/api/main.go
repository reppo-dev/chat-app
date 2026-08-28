package main

import (
	"database/sql"
	"log"

	"github.com/reppo-dev/chat-app/internal/config"
	db "github.com/reppo-dev/chat-app/internal/db/sqlc"
	"github.com/reppo-dev/chat-app/internal/routes"
	"github.com/reppo-dev/chat-app/internal/utils"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func main() {
	cfg :=config.LoadConfig()
	utils.InitJWT(cfg.JWT_KEY)

	dbconn,err := sql.Open(cfg.DB_DRIVER,cfg.DB)
	if err != nil {
		log.Fatal("Cannot open db",err)
	}

	defer dbconn.Close()

	if err := dbconn.Ping(); err!=nil{
		log.Fatal("Cannot ping db",err)
	}

	queries := db.New(dbconn)

	server := routes.NewServer(queries,dbconn)

	if err := server.StartServer(cfg.HTTP_ADDRESS); err!=nil{
		log.Fatal("cannot start server",err)
	}
}