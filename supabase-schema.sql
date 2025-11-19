-- ============================================
-- 话术助手 Supabase 数据库表结构
-- ============================================

-- 1. 公共分组表
CREATE TABLE IF NOT EXISTS public.chat_groups_public (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 公共话术表
CREATE TABLE IF NOT EXISTS public.public_catalog (
  id TEXT PRIMARY KEY,
  group_id TEXT REFERENCES chat_groups_public(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  note TEXT,
  content TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  tags JSONB DEFAULT '[]'::jsonb,
  lang TEXT DEFAULT 'zh',
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- 3. 用户私人分组表
CREATE TABLE IF NOT EXISTS public.chat_groups_user (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 用户私人话术表
CREATE TABLE IF NOT EXISTS public.user_scripts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  group_id TEXT,
  title TEXT NOT NULL,
  note TEXT,
  content TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  tags JSONB DEFAULT '[]'::jsonb,
  lang TEXT DEFAULT 'zh',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 发布申请表
CREATE TABLE IF NOT EXISTS public.publish_requests (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  source_script_id TEXT,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  review_notes TEXT,
  token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 创建索引
-- ============================================

-- public_catalog 索引
CREATE INDEX IF NOT EXISTS idx_public_catalog_group_id ON public.public_catalog(group_id);
CREATE INDEX IF NOT EXISTS idx_public_catalog_updated_at ON public.public_catalog(updated_at);
CREATE INDEX IF NOT EXISTS idx_public_catalog_order_index ON public.public_catalog(order_index);
CREATE INDEX IF NOT EXISTS idx_public_catalog_is_active ON public.public_catalog(is_active);

-- chat_groups_public 索引
CREATE INDEX IF NOT EXISTS idx_chat_groups_public_order_index ON public.chat_groups_public(order_index);

-- user_scripts 索引
CREATE INDEX IF NOT EXISTS idx_user_scripts_user_id ON public.user_scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_scripts_user_group ON public.user_scripts(user_id, group_id);
CREATE INDEX IF NOT EXISTS idx_user_scripts_updated_at ON public.user_scripts(user_id, updated_at);

-- chat_groups_user 索引
CREATE INDEX IF NOT EXISTS idx_chat_groups_user_user_id ON public.chat_groups_user(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_groups_user_order_index ON public.chat_groups_user(order_index);

-- publish_requests 索引
CREATE INDEX IF NOT EXISTS idx_publish_requests_status ON public.publish_requests(status);
CREATE INDEX IF NOT EXISTS idx_publish_requests_user_id ON public.publish_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_publish_requests_updated_at ON public.publish_requests(updated_at);

-- ============================================
-- RLS (Row Level Security) 策略
-- ============================================

-- 启用 RLS
ALTER TABLE public.chat_groups_public ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_groups_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publish_requests ENABLE ROW LEVEL SECURITY;

-- 公共表：所有人可读
CREATE POLICY "公共分组所有人可读" ON public.chat_groups_public
  FOR SELECT USING (true);

CREATE POLICY "公共话术所有人可读" ON public.public_catalog
  FOR SELECT USING (is_active = true);

-- 用户私人表：只能访问自己的数据
CREATE POLICY "用户只能读取自己的分组" ON public.chat_groups_user
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户只能创建自己的分组" ON public.chat_groups_user
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能更新自己的分组" ON public.chat_groups_user
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户只能删除自己的分组" ON public.chat_groups_user
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "用户只能读取自己的话术" ON public.user_scripts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户只能创建自己的话术" ON public.user_scripts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能更新自己的话术" ON public.user_scripts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户只能删除自己的话术" ON public.user_scripts
  FOR DELETE USING (auth.uid() = user_id);

-- 发布申请：用户可以创建和读取自己的申请
CREATE POLICY "用户可以创建发布申请" ON public.publish_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以读取自己的申请" ON public.publish_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的申请" ON public.publish_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 插入一些示例数据（可选）
-- ============================================

-- 插入默认分组
INSERT INTO public.chat_groups_public (id, name, color, order_index) VALUES
  ('greeting', '问候语', '#4CAF50', 0),
  ('service', '服务话术', '#2196F3', 1),
  ('closing', '结束语', '#FF9800', 2)
ON CONFLICT (id) DO NOTHING;

-- 插入示例话术
INSERT INTO public.public_catalog (id, group_id, title, note, content, order_index, is_active) VALUES
  ('1', 'greeting', '欢迎语', '标准问候语', '您好，很高兴为您服务！有什么可以帮助您的吗？', 0, true),
  ('2', 'service', '产品介绍', '突出产品优势', '我们的产品具有以下特点：高质量、高性价比、优质服务。', 0, true),
  ('3', 'closing', '感谢语', '礼貌结束对话', '感谢您的咨询，祝您生活愉快！', 0, true)
ON CONFLICT (id) DO NOTHING;
