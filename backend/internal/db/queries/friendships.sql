-- name: CreateFriendship :exec
INSERT INTO friendships (
    user_id,
    friend_id
)
VALUES ($1, $2);


-- name: DeleteFriendship :exec
DELETE FROM friendships
WHERE user_id = $1
  AND friend_id = $2;


-- name: GetFriends :many
SELECT u.*
FROM users u
JOIN friendships f
    ON f.friend_id = u.id
WHERE f.user_id = $1
  AND u.is_active = TRUE
ORDER BY u.name;


-- name: IsFriend :one
SELECT EXISTS (
    SELECT 1
    FROM friendships
    WHERE user_id = $1
      AND friend_id = $2
) AS is_friend;