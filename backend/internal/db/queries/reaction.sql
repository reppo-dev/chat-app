-- name: GetReaction :one
SELECT *
FROM reactions
WHERE user_id = $1
  AND post_id = $2
LIMIT 1;


-- name: CreateReaction :one
INSERT INTO reactions (
    user_id,
    post_id,
    type
)
VALUES (
    $1,
    $2,
    $3
)
RETURNING *;


-- name: UpdateReaction :one
UPDATE reactions
SET
    type = $3,
    updated_at = NOW()
WHERE user_id = $1
  AND post_id = $2
RETURNING *;


-- name: DeleteReaction :exec
DELETE FROM reactions
WHERE user_id = $1
  AND post_id = $2;