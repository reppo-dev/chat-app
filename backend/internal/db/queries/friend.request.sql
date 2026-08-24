-- name: CreateFriendRequest :one
INSERT INTO friend_requests (
    sender_id,
    receiver_id
)
VALUES (
    $1,
    $2
)
RETURNING *;


-- name: GetPendingFriendRequest :one
SELECT *
FROM friend_requests
WHERE sender_id = $1
  AND receiver_id = $2
  AND status = 'pending'
LIMIT 1;


-- name: GetFriendRequestByID :one
SELECT *
FROM friend_requests
WHERE id = $1
LIMIT 1;


-- name: AcceptFriendRequest :one
UPDATE friend_requests
SET
    status = 'accept',
    updated_at = NOW()
WHERE id = $1
RETURNING *;


-- name: RejectFriendRequest :one
UPDATE friend_requests
SET
    status = 'reject',
    updated_at = NOW()
WHERE id = $1
RETURNING *;


-- name: DeleteFriendRequest :exec
DELETE FROM friend_requests
WHERE id = $1;