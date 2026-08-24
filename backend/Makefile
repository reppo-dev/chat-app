createmigrate:
	migrate create -ext sql -dir internal/db/migrations -seq init_schema

migrateup:
	migrate -path internal/db/migrations -database "postgres://postgres:13802002@localhost:5432/chat-app?sslmode=disable" -verbose up

migratedown:
	migrate -path internal/db/migrations -database "postgres://postgres:13802002@localhost:5432/chat-app?sslmode=disable" -verbose down

sqlc:
	sqlc generate


.PHONY: createmigrate migrateup migratedown