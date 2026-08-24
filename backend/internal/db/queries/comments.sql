-- name: CreateComment :one
INSERT INTO comments (
    post_id,
    parent_id,
    user_id,
    reply_to_user_id,
    content
)
VALUES (
    $1,
    $2,
    $3,
    $4,
    $5
)
RETURNING *;


-- name: GetCommentsByPost :many
SELECT *
FROM comments
WHERE post_id = $1
ORDER BY created_at ASC;


-- name: GetCommentByID :one
SELECT *
FROM comments
WHERE id = $1
LIMIT 1;


-- name: UpdateComment :one
UPDATE comments
SET
    content = $2,
    updated_at = NOW()
WHERE id = $1
RETURNING *;


-- name: DeleteComment :exec
DELETE FROM comments
WHERE id = $1;