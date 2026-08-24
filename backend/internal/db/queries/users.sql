-- name: CreateUser :one
INSERT INTO users (
    email,
    name,
    password_hash
)
VALUES (
    $1,
    $2,
    $3
)
RETURNING *;


-- name: GetUserByID :one
SELECT *
FROM users
WHERE id = $1
LIMIT 1;


-- name: GetUserByEmail :one
SELECT *
FROM users
WHERE email = $1
LIMIT 1;


-- name: ListUsers :many
SELECT *
FROM users
WHERE is_active = TRUE
ORDER BY id
LIMIT $1
OFFSET $2;


-- name: UpdateUser :one
UPDATE users
SET
    name = $2,
    bio = $3,
    birthdate = $4,
    phone_number = $5,
    updated_at = NOW()
WHERE id = $1
RETURNING *;


-- name: SoftDeleteUser :exec
UPDATE users
SET
    is_active = FALSE,
    updated_at = NOW()
WHERE id = $1;