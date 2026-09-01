package routes

import (
	"strings"

	db "github.com/reppo-dev/chat-app/internal/db/sqlc"
)

func parseReactionType(s string) (db.ReactionType, bool) {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "like":
		return db.ReactionTypeLike, true
	case "wow":
		return db.ReactionTypeWow, true
	case "love":
		return db.ReactionTypeLove, true
	case "angry":
		return db.ReactionTypeAngry, true
	case "haha":
		return db.ReactionTypeHaha, true
	case "sad":
		return db.ReactionTypeSad, true
	default:
		return "", false
	}
}