-- name: CreateMessage :one
INSERT INTO messages (
    conversation_id,
    sender_id,
    text,
    media_files
)
VALUES (
    $1,
    $2,
    $3,
    $4
)
RETURNING *;


-- name: GetMessageByID :one
SELECT *
FROM messages
WHERE id = $1
LIMIT 1;


-- name: GetConversationMessages :many
SELECT *
FROM messages
WHERE conversation_id = $1
  AND is_deleted = FALSE
ORDER BY created_at DESC
LIMIT $2;


-- name: SoftDeleteMessage :exec
UPDATE messages
SET
    is_deleted = TRUE,
    updated_at = NOW()
WHERE id = $1;


-- name: UpdateMessage :one
UPDATE messages
SET
    text = $2,
    updated_at = NOW()
WHERE id = $1
RETURNING *;