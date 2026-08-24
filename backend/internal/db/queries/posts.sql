-- name: CreatePost :one
INSERT INTO posts (
    author_id,
    background_color,
    content,
    media_files,
    privacy
)
VALUES (
    $1,
    $2,
    $3,
    $4,
    $5
)
RETURNING *;


-- name: GetPostByID :one
SELECT *
FROM posts
WHERE id = $1
LIMIT 1;


-- name: UpdatePost :one
UPDATE posts
SET
    content = $2,
    background_color = $3,
    privacy = $4,
    updated_at = NOW()
WHERE id = $1
RETURNING *;


-- name: DeletePost :exec
DELETE FROM posts
WHERE id = $1;


-- name: GetPostsByUser :many
SELECT *
FROM posts
WHERE author_id = $1
ORDER BY created_at DESC
LIMIT $2;