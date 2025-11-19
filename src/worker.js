/**
 * Cloudflare Workers + Supabase 版本
 * 结合 Workers 的全球分布和 Supabase 的数据持久化
 */

import { createClient } from '@supabase/supabase-js';

export default {
  async fetch(request, env, ctx) {
    // 初始化 Supabase 客户端
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS 头
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // 处理 OPTIONS 请求
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 静态文件路由
      if (path === '/' || path === '/index.html') {
        return await serveStatic('index.html', env);
      }
      if (path === '/admin.html') {
        return await serveStatic('admin.html', env);
      }
      if (path === '/voter.html') {
        return await serveStatic('voter.html', env);
      }
      if (path === '/display.html') {
        return await serveStatic('display.html', env);
      }
      if (path === '/style.css') {
        return await serveStatic('style.css', env);
      }

      // API 路由
      if (path.startsWith('/api/')) {
        return await handleAPI(request, env, supabase, path, method, corsHeaders);
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('Error:', error);
      return jsonResponse(
        { error: error.message },
        corsHeaders,
        500
      );
    }
  },
};

// 服务静态文件
async function serveStatic(filename, env) {
  try {
    const content = await env.STATIC_ASSETS.get(filename);
    if (!content) {
      return new Response('File not found', { status: 404 });
    }

    const contentType = filename.endsWith('.html')
      ? 'text/html; charset=utf-8'
      : filename.endsWith('.css')
      ? 'text/css; charset=utf-8'
      : 'text/plain';

    return new Response(content, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    return new Response('Error loading file', { status: 500 });
  }
}

// 处理 API 请求
async function handleAPI(request, env, supabase, path, method, corsHeaders) {
  // 管理员登录
  if (path === '/api/admin/login' && method === 'POST') {
    const { password } = await request.json();
    const adminPassword = env.ADMIN_PASSWORD || 'admin123';

    if (password === adminPassword) {
      return jsonResponse({ success: true, token: 'admin-token' }, corsHeaders);
    }
    return jsonResponse({ success: false, message: '密码错误' }, corsHeaders, 401);
  }

  // 获取所有投票
  if (path === '/api/polls' && method === 'GET') {
    const { data, error } = await supabase
      .from('polls')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return jsonResponse({ polls: data || [] }, corsHeaders);
  }

  // 创建投票
  if (path === '/api/polls' && method === 'POST') {
    if (!isAdmin(request)) {
      return jsonResponse({ error: 'Unauthorized' }, corsHeaders, 401);
    }

    const pollData = await request.json();
    const { data, error } = await supabase
      .from('polls')
      .insert([{
        title: pollData.title,
        description: pollData.description,
        options: pollData.options,
        type: pollData.type,
        should_elect: pollData.shouldElect,
        attendee_count: pollData.attendeeCount,
        allow_alternative: pollData.allowAlternative,
        status: 'draft',
      }])
      .select()
      .single();

    if (error) throw error;
    return jsonResponse({ success: true, poll: data }, corsHeaders);
  }

  // 开始投票
  if (path.match(/^\/api\/poll\/(.+)\/start$/) && method === 'POST') {
    if (!isAdmin(request)) {
      return jsonResponse({ error: 'Unauthorized' }, corsHeaders, 401);
    }

    const pollId = path.match(/^\/api\/poll\/(.+)\/start$/)[1];
    const { data, error } = await supabase
      .from('polls')
      .update({
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .eq('id', pollId)
      .select()
      .single();

    if (error) throw error;
    return jsonResponse({ success: true, poll: data }, corsHeaders);
  }

  // 结束投票
  if (path.match(/^\/api\/poll\/(.+)\/end$/) && method === 'POST') {
    if (!isAdmin(request)) {
      return jsonResponse({ error: 'Unauthorized' }, corsHeaders, 401);
    }

    const pollId = path.match(/^\/api\/poll\/(.+)\/end$/)[1];
    const { data, error } = await supabase
      .from('polls')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
      })
      .eq('id', pollId)
      .select()
      .single();

    if (error) throw error;
    return jsonResponse({ success: true, poll: data }, corsHeaders);
  }

  // 删除投票
  if (path.match(/^\/api\/poll\/(.+)$/) && method === 'DELETE') {
    if (!isAdmin(request)) {
      return jsonResponse({ error: 'Unauthorized' }, corsHeaders, 401);
    }

    const pollId = path.match(/^\/api\/poll\/(.+)$/)[1];
    const { error } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId);

    if (error) throw error;
    return jsonResponse({ success: true }, corsHeaders);
  }

  // 提交投票
  if (path.match(/^\/api\/poll\/(.+)\/vote$/) && method === 'POST') {
    const pollId = path.match(/^\/api\/poll\/(.+)\/vote$/)[1];
    const voteData = await request.json();
    const deviceId = generateDeviceId(request);

    // 检查是否已投票
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('device_id', deviceId)
      .single();

    if (existingVote) {
      return jsonResponse(
        { success: false, message: '您已经投过票了' },
        corsHeaders,
        400
      );
    }

    // 提交投票
    const { error } = await supabase
      .from('votes')
      .insert([{
        poll_id: pollId,
        device_id: deviceId,
        vote_data: voteData,
      }]);

    if (error) throw error;
    return jsonResponse({ success: true }, corsHeaders);
  }

  // 获取投票结果
  if (path.match(/^\/api\/poll\/(.+)\/results$/) && method === 'GET') {
    const pollId = path.match(/^\/api\/poll\/(.+)\/results$/)[1];

    // 获取投票信息
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', pollId)
      .single();

    if (pollError) throw pollError;

    // 检查权限
    const isAdminUser = isAdmin(request);
    if (!isAdminUser && poll.status !== 'ended') {
      return jsonResponse(
        { error: '投票未结束，无法查看结果' },
        corsHeaders,
        403
      );
    }

    // 获取所有投票记录
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('vote_data')
      .eq('poll_id', pollId);

    if (votesError) throw votesError;

    // 统计结果
    const results = {};
    const alternatives = {};

    // 初始化候选人结果
    poll.options.forEach((option) => {
      results[option] = { approve: 0, disapprove: 0, abstain: 0 };
    });

    // 统计投票
    votes.forEach((vote) => {
      const voteData = vote.vote_data;
      Object.keys(voteData).forEach((candidate) => {
        const action = voteData[candidate];

        if (results[candidate]) {
          // 正式候选人
          if (action === 'approve') results[candidate].approve++;
          else if (action === 'disapprove') results[candidate].disapprove++;
          else if (action === 'abstain') results[candidate].abstain++;
        } else {
          // 另选他人
          if (!alternatives[candidate]) {
            alternatives[candidate] = { approve: 0, disapprove: 0, abstain: 0 };
          }
          if (action === 'approve') alternatives[candidate].approve++;
          else if (action === 'disapprove') alternatives[candidate].disapprove++;
          else if (action === 'abstain') alternatives[candidate].abstain++;
        }
      });
    });

    return jsonResponse(
      {
        poll,
        results,
        alternatives,
        totalVotes: votes.length,
      },
      corsHeaders
    );
  }

  // 生成访问码
  if (path === '/api/access-codes/generate' && method === 'POST') {
    if (!isAdmin(request)) {
      return jsonResponse({ error: 'Unauthorized' }, corsHeaders, 401);
    }

    const { count } = await request.json();
    const codes = [];
    const inserts = [];

    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      codes.push(code);
      inserts.push({ code, used: false });
    }

    const { error } = await supabase.from('access_codes').insert(inserts);

    if (error) throw error;
    return jsonResponse({ success: true, codes }, corsHeaders);
  }

  // 验证访问码
  if (path === '/api/access-codes/validate' && method === 'POST') {
    const { code } = await request.json();
    const { data, error } = await supabase
      .from('access_codes')
      .select('*')
      .eq('code', code)
      .single();

    if (error || !data) {
      return jsonResponse(
        { valid: false, message: '无效的访问码' },
        corsHeaders
      );
    }

    if (data.used) {
      return jsonResponse(
        { valid: false, message: '访问码已被使用' },
        corsHeaders
      );
    }

    // 标记为已使用
    const deviceId = generateDeviceId(request);
    await supabase
      .from('access_codes')
      .update({
        used: true,
        device_id: deviceId,
        used_at: new Date().toISOString(),
      })
      .eq('code', code);

    return jsonResponse({ valid: true }, corsHeaders);
  }

  return jsonResponse({ error: 'Not Found' }, corsHeaders, 404);
}

// 辅助函数
function jsonResponse(data, corsHeaders, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function isAdmin(request) {
  return request.headers.get('Authorization') === 'admin-token';
}

function generateDeviceId(request) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const userAgent = request.headers.get('User-Agent') || '';
  return `${ip}-${userAgent.substring(0, 50)}`;
}
