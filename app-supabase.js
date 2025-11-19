const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const crypto = require('crypto');
const db = require('./lib/database');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());
app.use(express.static('.'));

// 管理员密码
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

// WebSocket 连接管理
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('新的 WebSocket 连接');

  ws.on('close', () => {
    clients.delete(ws);
    console.log('WebSocket 连接关闭');
  });
});

// 广播消息给所有客户端
function broadcast(message) {
  const data = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// 生成设备指纹
function generateDeviceFingerprint(req) {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';
  return crypto.createHash('sha256').update(ip + userAgent).digest('hex');
}

// 验证管理员权限
function isAdmin(req) {
  return req.headers.authorization === 'admin-token';
}

// ==================== API 路由 ====================

// 管理员登录
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === adminPassword) {
    res.json({ success: true, token: 'admin-token' });
  } else {
    res.status(401).json({ success: false, message: '密码错误' });
  }
});

// 获取所有投票
app.get('/api/polls', async (req, res) => {
  try {
    const polls = await db.getAllPolls();
    res.json({ polls });
  } catch (error) {
    console.error('获取投票列表失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 创建投票
app.post('/api/polls', async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: '需要管理员权限' });
  }

  try {
    const poll = await db.createPoll(req.body);
    broadcast({ type: 'poll_created', poll });
    res.json({ success: true, poll });
  } catch (error) {
    console.error('创建投票失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 开始投票
app.post('/api/poll/:id/start', async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: '需要管理员权限' });
  }

  try {
    const poll = await db.updatePollStatus(req.params.id, 'active');
    broadcast({ type: 'poll_started', poll });
    res.json({ success: true, poll });
  } catch (error) {
    console.error('开始投票失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 结束投票
app.post('/api/poll/:id/end', async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: '需要管理员权限' });
  }

  try {
    const poll = await db.updatePollStatus(req.params.id, 'ended');
    broadcast({ type: 'poll_ended', poll });
    res.json({ success: true, poll });
  } catch (error) {
    console.error('结束投票失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 删除投票
app.delete('/api/poll/:id', async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: '需要管理员权限' });
  }

  try {
    await db.deletePoll(req.params.id);
    broadcast({ type: 'poll_deleted', pollId: req.params.id });
    res.json({ success: true });
  } catch (error) {
    console.error('删除投票失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 提交投票
app.post('/api/poll/:id/vote', async (req, res) => {
  try {
    const pollId = req.params.id;
    const deviceId = generateDeviceFingerprint(req);
    const voteData = req.body;

    // 检查是否已投票
    const hasVoted = await db.hasVoted(pollId, deviceId);
    if (hasVoted) {
      return res.status(400).json({
        success: false,
        message: '您已经投过票了'
      });
    }

    // 提交投票
    await db.submitVote(pollId, deviceId, voteData);

    // 广播更新
    broadcast({ type: 'vote_submitted', pollId });

    res.json({ success: true });
  } catch (error) {
    console.error('提交投票失败:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取投票结果
app.get('/api/poll/:id/results', async (req, res) => {
  try {
    const pollId = req.params.id;
    const poll = await db.getPoll(pollId);

    if (!poll) {
      return res.status(404).json({ error: '投票不存在' });
    }

    // 只有管理员或已结束的投票可以查看结果
    const isAdminUser = isAdmin(req);
    if (!isAdminUser && poll.status !== 'ended') {
      return res.status(403).json({ error: '投票未结束，无法查看结果' });
    }

    // 获取所有投票记录
    const votes = await db.getPollResults(pollId);
    const voteCount = await db.getVoteCount(pollId);

    // 统计结果
    const results = {};
    const alternatives = {};

    // 初始化候选人结果
    poll.options.forEach(option => {
      results[option] = {
        approve: 0,
        disapprove: 0,
        abstain: 0
      };
    });

    // 统计投票
    votes.forEach(vote => {
      const voteData = vote.vote_data;
      
      Object.keys(voteData).forEach(candidate => {
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

    res.json({
      poll,
      results,
      alternatives,
      totalVotes: voteCount
    });
  } catch (error) {
    console.error('获取投票结果失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 生成访问码
app.post('/api/access-codes/generate', async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: '需要管理员权限' });
  }

  try {
    const { count } = req.body;
    const codes = await db.generateAccessCodes(count);
    res.json({ success: true, codes });
  } catch (error) {
    console.error('生成访问码失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 验证访问码
app.post('/api/access-codes/validate', async (req, res) => {
  try {
    const { code } = req.body;
    const result = await db.validateAccessCode(code);
    
    if (result.valid) {
      const deviceId = generateDeviceFingerprint(req);
      await db.useAccessCode(code, deviceId);
    }
    
    res.json(result);
  } catch (error) {
    console.error('验证访问码失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取所有访问码
app.get('/api/access-codes', async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: '需要管理员权限' });
  }

  try {
    const codes = await db.getAllAccessCodes();
    res.json({ codes });
  } catch (error) {
    console.error('获取访问码失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('========================================');
  console.log('  实时投票系统 (Supabase 版本)');
  console.log('========================================');
  console.log(`✓ 服务器运行在: http://localhost:${PORT}`);
  console.log(`✓ 管理员密码: ${adminPassword}`);
  console.log(`✓ 数据库: Supabase PostgreSQL`);
  console.log('========================================');
});
