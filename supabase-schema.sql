-- 投票表
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  options JSONB NOT NULL,
  type TEXT NOT NULL,
  should_elect INTEGER,
  attendee_count INTEGER,
  allow_alternative BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE
);

-- 投票记录表
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  vote_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, device_id)
);

-- 访问码表
CREATE TABLE access_codes (
  code TEXT PRIMARY KEY,
  used BOOLEAN DEFAULT false,
  device_id TEXT,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_polls_status ON polls(status);
CREATE INDEX idx_votes_poll_id ON votes(poll_id);
CREATE INDEX idx_votes_device_id ON votes(device_id);
CREATE INDEX idx_access_codes_used ON access_codes(used);

-- 启用行级安全（可选，暂时禁用以简化）
ALTER TABLE polls DISABLE ROW LEVEL SECURITY;
ALTER TABLE votes DISABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes DISABLE ROW LEVEL SECURITY;
