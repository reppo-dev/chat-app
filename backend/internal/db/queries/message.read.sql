-- name: MarkMessageAsSeen :exec
INSERT INTO message_reads (
    message_id,
    user_id
)
VALUES ($1, $2)
ON CONFLICT (message_id, user_id)
DO NOTHING;


-- name: HasUserSeenMessage :one
SELECT EXISTS (
    SELECT 1
    FROM message_reads
    WHERE message_id = $1
      AND user_id = $2
) AS seen;