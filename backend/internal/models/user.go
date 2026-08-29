package models

import (
	"time"

	db "github.com/reppo-dev/chat-app/internal/db/sqlc"
)

type Users struct {
	ID                   int64      `json:"id"`
	Name                 string     `json:"name"`
	Email                string     `json:"email"`
	Password             string     `json:"password"`
	RefreshTokenWeb      *string    `json:"-"`
	RefreshTokenWebAt    *time.Time `json:"-"`
	RefreshTokenMobile   *string    `json:"-"`
	RefreshTokenMobileAt *time.Time `json:"-"`
	CreatedAt            time.Time  `json:"created_at"`
}

func UserToMap(u *db.Users) map[string]any {
	return map[string]any{
		"id":    u.ID,
		"name":  u.Name,
		"email": u.Email,
	}
}