CREATE TYPE user_role AS ENUM (
    'user',
    'admin'
);

CREATE TYPE friend_request_status AS ENUM (
    'pending',
    'accept',
    'reject'
);

CREATE TYPE post_privacy AS ENUM (
    'public',
    'private',
    'friends'
);

CREATE TYPE reaction_type AS ENUM (
    'like',
    'wow',
    'love',
    'angry',
    'haha',
    'sad'
);

CREATE TYPE notification_type AS ENUM (
    'friend_request',
    'reaction',
    'comment'
);

-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL,
    name          VARCHAR(100) NOT NULL,
    password_hash TEXT NOT NULL,

    role          user_role NOT NULL DEFAULT 'user',

    bio           TEXT,
    avatar        JSONB,
    cover_photo   JSONB,

    birthdate     DATE,
    phone_number  VARCHAR(30),

    is_active     BOOLEAN NOT NULL DEFAULT TRUE,

    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE INDEX idx_users_name ON users(name);
CREATE INDEX idx_users_email ON users(email);


-- =========================================================
-- FRIEND REQUESTS
-- =========================================================

CREATE TABLE friend_requests (
    id          BIGSERIAL PRIMARY KEY,

    sender_id   BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,

    status      friend_request_status NOT NULL DEFAULT 'pending',

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_friend_requests_sender
        FOREIGN KEY (sender_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_friend_requests_receiver
        FOREIGN KEY (receiver_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT friend_request_not_self
        CHECK (sender_id <> receiver_id)
);

CREATE INDEX idx_friend_requests_sender
    ON friend_requests(sender_id);

CREATE INDEX idx_friend_requests_receiver
    ON friend_requests(receiver_id);

CREATE INDEX idx_friend_requests_status
    ON friend_requests(status);

CREATE UNIQUE INDEX idx_pending_friend_request_unique
    ON friend_requests(sender_id, receiver_id)
    WHERE status = 'pending';


-- =========================================================
-- FRIENDSHIPS
-- =========================================================

CREATE TABLE friendships (
    user_id       BIGINT NOT NULL,
    friend_id     BIGINT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, friend_id),

    CONSTRAINT fk_friendships_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_friendships_friend
        FOREIGN KEY (friend_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT friendship_not_self
        CHECK (user_id <> friend_id)
);

CREATE INDEX idx_friendships_friend_id
    ON friendships(friend_id);


-- =========================================================
-- POSTS
-- =========================================================

CREATE TABLE posts (
    id               BIGSERIAL PRIMARY KEY,

    author_id        BIGINT NOT NULL,

    background_color VARCHAR(20) NOT NULL DEFAULT '#fff',

    content          TEXT NOT NULL,

    media_files      JSONB NOT NULL DEFAULT '[]'::jsonb,

    like_count       INTEGER NOT NULL DEFAULT 0,
    wow_count        INTEGER NOT NULL DEFAULT 0,
    love_count       INTEGER NOT NULL DEFAULT 0,
    angry_count      INTEGER NOT NULL DEFAULT 0,
    haha_count       INTEGER NOT NULL DEFAULT 0,
    sad_count        INTEGER NOT NULL DEFAULT 0,

    privacy          post_privacy NOT NULL DEFAULT 'public',

    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_posts_author
        FOREIGN KEY (author_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_posts_author_id
    ON posts(author_id);

CREATE INDEX idx_posts_created_at
    ON posts(created_at DESC);

CREATE INDEX idx_posts_author_created_at
    ON posts(author_id, created_at DESC);


-- =========================================================
-- REACTIONS
-- =========================================================

CREATE TABLE reactions (
    id          BIGSERIAL PRIMARY KEY,

    user_id     BIGINT NOT NULL,
    post_id     BIGINT NOT NULL,

    type        reaction_type NOT NULL DEFAULT 'like',

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_reactions_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_reactions_post
        FOREIGN KEY (post_id)
        REFERENCES posts(id)
        ON DELETE CASCADE,

    CONSTRAINT reaction_unique_user_post
        UNIQUE (user_id, post_id)
);

CREATE INDEX idx_reactions_post_id
    ON reactions(post_id);

CREATE INDEX idx_reactions_user_id
    ON reactions(user_id);


-- =========================================================
-- COMMENTS
-- =========================================================

CREATE TABLE comments (
    id               BIGSERIAL PRIMARY KEY,

    post_id          BIGINT NOT NULL,
    parent_id        BIGINT,
    user_id          BIGINT NOT NULL,
    reply_to_user_id BIGINT,

    content          TEXT NOT NULL,

    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_comments_post
        FOREIGN KEY (post_id)
        REFERENCES posts(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_comments_parent
        FOREIGN KEY (parent_id)
        REFERENCES comments(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_comments_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_comments_reply_to_user
        FOREIGN KEY (reply_to_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE INDEX idx_comments_post_id
    ON comments(post_id);

CREATE INDEX idx_comments_parent_id
    ON comments(parent_id);

CREATE INDEX idx_comments_post_created
    ON comments(post_id, created_at);


-- =========================================================
-- CONVERSATIONS
-- =========================================================

CREATE TABLE conversations (
    id               BIGSERIAL PRIMARY KEY,

    is_group         BOOLEAN NOT NULL DEFAULT FALSE,

    group_owner_id   BIGINT,
    group_name       VARCHAR(100),
    group_avatar     JSONB,

    last_message_id  BIGINT,
    last_message_at  TIMESTAMPTZ,

    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_conversations_group_owner
        FOREIGN KEY (group_owner_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE INDEX idx_conversations_last_message_at
    ON conversations(last_message_at DESC);


-- =========================================================
-- CONVERSATION MEMBERS
-- =========================================================

CREATE TABLE conversation_members (
    conversation_id BIGINT NOT NULL,
    user_id         BIGINT NOT NULL,

    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (conversation_id, user_id),

    CONSTRAINT fk_conversation_members_conversation
        FOREIGN KEY (conversation_id)
        REFERENCES conversations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_conversation_members_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_conversation_members_user_id
    ON conversation_members(user_id);


-- =========================================================
-- MESSAGES
-- =========================================================

CREATE TABLE messages (
    id               BIGSERIAL PRIMARY KEY,

    conversation_id  BIGINT NOT NULL,
    sender_id        BIGINT NOT NULL,

    text             TEXT,

    media_files      JSONB NOT NULL DEFAULT '[]'::jsonb,

    is_deleted       BOOLEAN NOT NULL DEFAULT FALSE,

    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_messages_conversation
        FOREIGN KEY (conversation_id)
        REFERENCES conversations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_messages_sender
        FOREIGN KEY (sender_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT message_has_content
        CHECK (
            text IS NOT NULL
            OR jsonb_array_length(media_files) > 0
        )
);

CREATE INDEX idx_messages_conversation_created
    ON messages(conversation_id, created_at DESC);

CREATE INDEX idx_messages_sender_id
    ON messages(sender_id);


-- =========================================================
-- MESSAGE READS
-- =========================================================

CREATE TABLE message_reads (
    message_id  BIGINT NOT NULL,
    user_id     BIGINT NOT NULL,

    seen_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (message_id, user_id),

    CONSTRAINT fk_message_reads_message
        FOREIGN KEY (message_id)
        REFERENCES messages(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_message_reads_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_message_reads_user_id
    ON message_reads(user_id);


-- =========================================================
-- NOTIFICATIONS
-- =========================================================

CREATE TABLE notifications (
    id          BIGSERIAL PRIMARY KEY,

    sender_id   BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,

    type        notification_type NOT NULL,

    content     TEXT NOT NULL,

    is_read     BOOLEAN NOT NULL DEFAULT FALSE,

    link_to_id  BIGINT,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_notifications_sender
        FOREIGN KEY (sender_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_notifications_receiver
        FOREIGN KEY (receiver_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_notifications_receiver_created
    ON notifications(receiver_id, created_at DESC);

CREATE INDEX idx_notifications_receiver_unread
    ON notifications(receiver_id, is_read)
    WHERE is_read = FALSE;