const { createClient } = require('@supabase/supabase-js');

// Supabase 配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('⚠️  缺少 Supabase 配置！');
  console.error('请设置环境变量：');
  console.error('  SUPABASE_URL=你的项目URL');
  console.error('  SUPABASE_ANON_KEY=你的匿名密钥');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
