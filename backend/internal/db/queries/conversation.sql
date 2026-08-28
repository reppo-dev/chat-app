-- name: CreateConversation :one
INSERT INTO conversations (
    conversation_type,
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


-- name: RemoveConversationMember :execrows
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


-- name: GetConversationByMembers :one
SELECT c.*
FROM conversations c
JOIN conversation_members cm1
    ON cm1.conversation_id = c.id
JOIN conversation_members cm2
    ON cm2.conversation_id = c.id
WHERE cm1.user_id = $1
  AND cm2.user_id = $2
  AND c.conversation_type = 'direct'
LIMIT 1;


-- name: UpdateConversationLastMessage :exec
UPDATE conversations
SET
    last_message_id = $2,
    last_message_at = $3,
    updated_at = NOW()
WHERE id = $1;


-- name: GetConversationByID :one
SELECT *
FROM conversations
WHERE id = $1
LIMIT 1;

-- name: DeleteConversation :exec
DELETE FROM conversations
WHERE id = $1;