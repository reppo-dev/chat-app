-- name: CreateConversation :one
INSERT INTO conversations (
    is_group,
    group_owner_id,
    group_name
)
VALUES (
    $1,
    $2,
    $3
)
RETURNING *;


-- name: AddConversationMember :exec
INSERT INTO conversation_members (
    conversation_id,
    user_id
)
VALUES ($1, $2);


-- name: RemoveConversationMember :exec
DELETE FROM conversation_members
WHERE conversation_id = $1
  AND user_id = $2;


-- name: GetConversationMembers :many
SELECT u.*
FROM users u
JOIN conversation_members cm
    ON cm.user_id = u.id
WHERE cm.conversation_id = $1
ORDER BY u.name;


-- name: GetUserConversations :many
SELECT c.*
FROM conversations c
JOIN conversation_members cm
    ON cm.conversation_id = c.id
WHERE cm.user_id = $1
ORDER BY c.last_message_at DESC NULLS LAST;