-- name: CreateNotification :one
INSERT INTO notifications (
    sender_id,
    receiver_id,
    type,
    content,
    link_to_id
)
VALUES (
    $1,
    $2,
    $3,
    $4,
    $5
)
RETURNING *;


-- name: GetUserNotifications :many
SELECT *
FROM notifications
WHERE receiver_id = $1
ORDER BY created_at DESC
LIMIT $2;


-- name: MarkNotificationAsRead :exec
UPDATE notifications
SET
    is_read = TRUE,
    updated_at = NOW()
WHERE id = $1;


-- name: MarkAllNotificationsAsRead :exec
UPDATE notifications
SET
    is_read = TRUE,
    updated_at = NOW()
WHERE receiver_id = $1
  AND is_read = FALSE;