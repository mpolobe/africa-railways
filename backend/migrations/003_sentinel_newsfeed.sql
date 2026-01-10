-- Sentinel Newsfeed System
-- Migration: 003_sentinel_newsfeed.sql

-- Posts table for newsfeed
CREATE TABLE IF NOT EXISTS newsfeed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL,
  author_type VARCHAR(20) NOT NULL, -- 'admin' or 'sentinel'
  author_name VARCHAR(255) NOT NULL,
  author_avatar VARCHAR(500),
  content TEXT NOT NULL,
  media_urls TEXT[], -- Array of image/video URLs
  visibility VARCHAR(20) DEFAULT 'all', -- 'all', 'sentinels_only', 'admins_only'
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Comments/Replies table
CREATE TABLE IF NOT EXISTS newsfeed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES newsfeed_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  author_type VARCHAR(20) NOT NULL, -- 'admin' or 'sentinel'
  author_name VARCHAR(255) NOT NULL,
  author_avatar VARCHAR(500),
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES newsfeed_comments(id) ON DELETE CASCADE, -- For nested replies
  likes_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Likes table (for both posts and comments)
CREATE TABLE IF NOT EXISTS newsfeed_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type VARCHAR(20) NOT NULL, -- 'admin' or 'sentinel'
  target_type VARCHAR(20) NOT NULL, -- 'post' or 'comment'
  target_id UUID NOT NULL, -- post_id or comment_id
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id) -- Prevent duplicate likes
);

-- Notifications table for newsfeed activity
CREATE TABLE IF NOT EXISTS newsfeed_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL,
  recipient_type VARCHAR(20) NOT NULL, -- 'admin' or 'sentinel'
  actor_id UUID NOT NULL,
  actor_name VARCHAR(255) NOT NULL,
  notification_type VARCHAR(50) NOT NULL, -- 'like', 'comment', 'reply', 'mention', 'admin_post'
  post_id UUID REFERENCES newsfeed_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES newsfeed_comments(id) ON DELETE CASCADE,
  content TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_newsfeed_posts_created_at ON newsfeed_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsfeed_posts_author ON newsfeed_posts(author_id, author_type);
CREATE INDEX IF NOT EXISTS idx_newsfeed_posts_visibility ON newsfeed_posts(visibility);
CREATE INDEX IF NOT EXISTS idx_newsfeed_posts_pinned ON newsfeed_posts(is_pinned, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_newsfeed_comments_post ON newsfeed_comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_newsfeed_comments_parent ON newsfeed_comments(parent_comment_id);

CREATE INDEX IF NOT EXISTS idx_newsfeed_likes_target ON newsfeed_likes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_newsfeed_likes_user ON newsfeed_likes(user_id, user_type);

CREATE INDEX IF NOT EXISTS idx_newsfeed_notifications_recipient ON newsfeed_notifications(recipient_id, recipient_type, is_read);
CREATE INDEX IF NOT EXISTS idx_newsfeed_notifications_created ON newsfeed_notifications(created_at DESC);

-- Function to update likes count on posts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE newsfeed_posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.target_id AND NEW.target_type = 'post';
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE newsfeed_posts 
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.target_id AND OLD.target_type = 'post';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update likes count on comments
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE newsfeed_comments 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.target_id AND NEW.target_type = 'comment';
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE newsfeed_comments 
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.target_id AND OLD.target_type = 'comment';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update comments count on posts
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE newsfeed_posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE newsfeed_posts 
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trigger_update_post_likes
AFTER INSERT OR DELETE ON newsfeed_likes
FOR EACH ROW
EXECUTE FUNCTION update_post_likes_count();

CREATE TRIGGER trigger_update_comment_likes
AFTER INSERT OR DELETE ON newsfeed_likes
FOR EACH ROW
EXECUTE FUNCTION update_comment_likes_count();

CREATE TRIGGER trigger_update_post_comments
AFTER INSERT OR DELETE ON newsfeed_comments
FOR EACH ROW
EXECUTE FUNCTION update_post_comments_count();

-- Function to create notification on new comment
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  post_author_type VARCHAR(20);
BEGIN
  -- Get post author
  SELECT author_id, author_type INTO post_author_id, post_author_type
  FROM newsfeed_posts
  WHERE id = NEW.post_id;
  
  -- Create notification if commenter is not the post author
  IF post_author_id != NEW.author_id THEN
    INSERT INTO newsfeed_notifications (
      recipient_id, recipient_type, actor_id, actor_name, 
      notification_type, post_id, comment_id, content
    ) VALUES (
      post_author_id, post_author_type, NEW.author_id, NEW.author_name,
      'comment', NEW.post_id, NEW.id, LEFT(NEW.content, 100)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_comment_notification
AFTER INSERT ON newsfeed_comments
FOR EACH ROW
EXECUTE FUNCTION create_comment_notification();

-- Function to create notification on admin post (notify all sentinels)
CREATE OR REPLACE FUNCTION notify_sentinels_on_admin_post()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.author_type = 'admin' THEN
    -- This would need to be handled in application code to get all sentinel IDs
    -- Placeholder for the concept
    NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- View for feed with author info
CREATE OR REPLACE VIEW newsfeed_posts_view AS
SELECT 
  p.id,
  p.author_id,
  p.author_type,
  p.author_name,
  p.author_avatar,
  p.content,
  p.media_urls,
  p.visibility,
  p.likes_count,
  p.comments_count,
  p.is_pinned,
  p.created_at,
  p.updated_at,
  EXTRACT(EPOCH FROM (NOW() - p.created_at)) as age_seconds
FROM newsfeed_posts p
WHERE p.is_deleted = false
ORDER BY p.is_pinned DESC, p.created_at DESC;

-- Migration complete
SELECT 'Sentinel newsfeed migration completed successfully' as status;
