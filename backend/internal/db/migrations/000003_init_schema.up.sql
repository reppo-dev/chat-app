CREATE TYPE conversation_type AS ENUM (
    'direct',
    'group',
    'channel'
);

ALTER TABLE conversations
ADD COLUMN conversation_type conversation_type NOT NULL DEFAULT 'direct';