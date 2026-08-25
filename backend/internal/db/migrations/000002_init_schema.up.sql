CREATE TABLE refresh_tokens (
    id          BIGSERIAL PRIMARY KEY,

    user_id     BIGINT NOT NULL,
    token_hash  TEXT NOT NULL,

    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_refresh_tokens_user_id
    ON refresh_tokens(user_id);

CREATE INDEX idx_refresh_tokens_expires_at
    ON refresh_tokens(expires_at);

CREATE INDEX idx_refresh_tokens_token_hash
    ON refresh_tokens(token_hash);