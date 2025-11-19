const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());
app.use(express.static('.'));

// 数据存储目录
const DATA_DIR = path.join(__dirname, 'data');
const BACKUP_DIR = path.join(__dirname, 'backup');
const DATA_FILE = path.join(DATA_DIR, 'polls.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// 数据存储
const data = {
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123', // 生产环境应使用环境变量
  polls: [],
  currentPoll: null,
  votes: new Map(), // pollId -> Map(deviceId -> vote)
  devices: new Set(), // 已投票的设备指纹
  accessCodes: new Map(), // code -> { used: boolean, deviceId: string }
};

// 从文件加载数据
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const fileData = fs.readFileSync(DATA_FILE, 'utf8');
      const savedData = JSON.parse(fileData);
      
      // 恢复投票数据
      if (savedData.polls) {
        data.polls = savedData.polls;
      }
      
      // 恢复投票记录（Map 需要特殊处理）
      if (savedData.votes) {
        data.votes = new Map();
        Object.keys(savedData.votes).forEach(pollId => {
          const pollVotes = new Map();
          Object.keys(savedData.votes[pollId]).forEach(deviceId => {
            pollVotes.set(deviceId, savedData.votes[pollId][deviceId]);
          });
          data.votes.set(pollId, pollVotes);
        });
      }
      
      // 恢复访问码
      if (savedData.accessCodes) {
        data.accessCodes = new Map(Object.entries(savedData.accessCodes));
      }
      
      console.log(`✓ 已加载 ${data.polls.length} 个投票记录`);
    } else {
      console.log('✓ 首次启动，创建新的数据文件');
    }
  } catch (error) {
    console.error('✗ 加载数据失败:', error.message);
    console.log('  将使用空数据启动');
  }
}

// 保存数据到文件
function saveData() {
  try {
    // 转换 Map 为普通对象以便 JSON 序列化
    const votesObj = {};
    data.votes.forEach((pollVotes, pollId) => {
      votesObj[pollId] = {};
      pollVotes.forEach((vote, deviceId) => {
        votesObj[pollId][deviceId] = vote;
      });
    });
    
    const accessCodesObj = {};
    data.accessCodes.forEach((value, key) => {
      accessCodesObj[key] = value;
    });
    
    const saveData = {
      polls: data.polls,
      votes: votesObj,
      accessCodes: accessCodesObj,
      savedAt: new Date().toISOString()
    };
    
    // 保存到文件
    fs.writeFileSync(DATA_FILE, JSON.stringify(saveData, null, 2), 'utf8');
    
    // 每天自动备份一次
    const today = new Date().toISOString().split('T')[0];
    const backupFile = path.join(BACKUP_DIR, `polls-${today}.json`);
    if (!fs.existsSync(backupFile)) {
      fs.writeFileSync(backupFile, JSON.stringify(saveData, null, 2), 'utf8');
      console.log(`✓ 已创建每日备份: ${backupFile}`);
    }
  } catch (error) {
    console.error('✗ 保存数据失败:', error.message);
  }
}

// 定期自动保存（每5分钟）
setInterval(() => {
  saveData();
  console.log(`✓ 自动保存完成 [${new Date().toLocaleString('zh-CN')}]`);
}, 5 * 60 * 1000);

// 启动时加载数据
loadData();

// 生成设备指纹
function generateDeviceFingerprint(req) {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';
  return crypto.createHash('sha256').update(ip + userAgent).digest('hex');
}

// WebSocket 连接管理
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  
  ws.on('close', () => {
    clients.delete(ws);
  });
});

// 广播更新
function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// API 路由

// 管理员登录
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === data.adminPassword) {
    res.json({ success: true, token: 'admin-token' });
  } else {
    res.status(401).json({ success: false, message: '密码错误' });
  }
});

// 生成6位数字投票码
function generatePollCode() {
  let code;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (data.polls.some(p => p.code === code));
  return code;
}

// 创建投票
app.post('/api/admin/poll', (req, res) => {
  const poll = {
    id: uuidv4(),
    code: generatePollCode(), // 生成投票码
    ...req.body,
    createdAt: new Date().toISOString(),
    status: 'pending', // pending, active, ended
    results: {}
  };
  
  // 初始化结果
  if (poll.type === 'election') {
    // 差额选举：初始化为对象
    poll.options.forEach(opt => {
      poll.results[opt] = { approve: 0, reject: 0, abstain: 0 };
    });
  } else {
    // 普通投票：初始化为数字
    poll.options.forEach(opt => {
      poll.results[opt] = 0;
    });
  }
  
  data.polls.push(poll);
  saveData(); // 保存数据
  res.json({ success: true, poll });
});

// 开始投票
app.post('/api/admin/poll/:id/start', (req, res) => {
  const poll = data.polls.find(p => p.id === req.params.id);
  if (!poll) {
    return res.status(404).json({ success: false, message: '投票不存在' });
  }
  
  poll.status = 'active';
  poll.startedAt = new Date().toISOString();
  data.currentPoll = poll;
  data.votes.set(poll.id, new Map());
  data.devices.clear();
  
  saveData(); // 保存数据
  broadcast({ type: 'pollStarted', poll });
  res.json({ success: true, poll });
});

// 结束投票
app.post('/api/admin/poll/:id/end', (req, res) => {
  const poll = data.polls.find(p => p.id === req.params.id);
  if (!poll) {
    return res.status(404).json({ success: false, message: '投票不存在' });
  }
  
  poll.status = 'ended';
  poll.endedAt = new Date().toISOString();
  
  // 如果是差额选举，验证选举有效性
  if (poll.type === 'election' && poll.electionConfig) {
    const pollVotes = data.votes.get(poll.id);
    const totalVotes = pollVotes ? pollVotes.size : 0;
    const attendeeCount = parseInt(poll.electionConfig.attendeeCount) || 0;
    
    // 收回的选票数 vs 实际到会人数
    if (totalVotes > attendeeCount) {
      poll.electionValid = false;
      poll.electionValidMessage = `选举无效：收回选票${totalVotes}张 > 到会人数${attendeeCount}人，应重新选举`;
    } else {
      poll.electionValid = true;
      poll.electionValidMessage = `选举有效：收回选票${totalVotes}张 ≤ 到会人数${attendeeCount}人`;
    }
  }
  
  if (data.currentPoll?.id === poll.id) {
    data.currentPoll = null;
  }
  
  saveData(); // 保存数据
  broadcast({ type: 'pollEnded', poll });
  res.json({ success: true, poll });
});

// 复制投票（发起新一轮）
app.post('/api/admin/poll/:id/duplicate', (req, res) => {
  const originalPoll = data.polls.find(p => p.id === req.params.id);
  if (!originalPoll) {
    return res.status(404).json({ success: false, message: '投票不存在' });
  }
  
  const newPoll = {
    id: uuidv4(),
    code: generatePollCode(), // 生成新的投票码
    title: req.body.title || originalPoll.title,
    description: req.body.description || originalPoll.description,
    options: req.body.options || originalPoll.options,
    type: req.body.type || originalPoll.type,
    anonymous: req.body.anonymous !== undefined ? req.body.anonymous : originalPoll.anonymous,
    selectionConfig: req.body.selectionConfig || originalPoll.selectionConfig,
    electionConfig: req.body.electionConfig || originalPoll.electionConfig,
    passCondition: req.body.passCondition || originalPoll.passCondition,
    failCondition: req.body.failCondition || originalPoll.failCondition,
    createdAt: new Date().toISOString(),
    status: 'pending',
    results: {}
  };
  
  // 初始化结果
  if (newPoll.type === 'election') {
    newPoll.options.forEach(opt => {
      newPoll.results[opt] = { approve: 0, reject: 0, abstain: 0 };
    });
  } else {
    newPoll.options.forEach(opt => {
      newPoll.results[opt] = 0;
    });
  }
  
  data.polls.push(newPoll);
  saveData(); // 保存数据
  res.json({ success: true, poll: newPoll });
});

// 获取所有投票
app.get('/api/admin/polls', (req, res) => {
  // 为每个投票添加实际投票人数
  const pollsWithVotes = data.polls.map(poll => {
    const pollVotes = data.votes.get(poll.id);
    return {
      ...poll,
      totalVotes: pollVotes ? pollVotes.size : 0
    };
  });
  res.json({ success: true, polls: pollsWithVotes });
});

// 获取历史记录
app.get('/api/admin/history', (req, res) => {
  const filter = req.query.filter || 'all';
  
  let history = data.polls.map(poll => {
    const pollVotes = data.votes.get(poll.id);
    return {
      ...poll,
      totalVotes: pollVotes ? pollVotes.size : 0
    };
  });
  
  // 按状态筛选
  if (filter !== 'all') {
    history = history.filter(p => p.status === filter);
  }
  
  // 按创建时间倒序排列
  history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json({ success: true, history });
});

// 生成访问码
app.post('/api/admin/generate-codes', (req, res) => {
  const { count = 10 } = req.body;
  const codes = [];
  
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    data.accessCodes.set(code, { used: false, deviceId: null });
    codes.push(code);
  }
  
  saveData(); // 保存数据
  res.json({ success: true, codes });
});

// 验证访问码
app.post('/api/voter/verify-code', (req, res) => {
  const { code } = req.body;
  const deviceId = generateDeviceFingerprint(req);
  
  const codeData = data.accessCodes.get(code);
  if (!codeData) {
    return res.status(401).json({ success: false, message: '无效的访问码' });
  }
  
  if (codeData.used && codeData.deviceId !== deviceId) {
    return res.status(401).json({ success: false, message: '访问码已被使用' });
  }
  
  codeData.used = true;
  codeData.deviceId = deviceId;
  
  saveData(); // 保存数据
  res.json({ success: true, deviceId });
});

// 通过投票码获取投票
app.post('/api/poll/verify-code', (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ success: false, message: '请输入投票码' });
  }
  
  const poll = data.polls.find(p => p.code === code && p.status === 'active');
  
  if (!poll) {
    return res.status(404).json({ success: false, message: '投票码无效或投票未开始' });
  }
  
  const deviceId = generateDeviceFingerprint(req);
  const pollVotes = data.votes.get(poll.id);
  const hasVoted = pollVotes ? pollVotes.has(deviceId) : false;
  
  res.json({ 
    success: true, 
    poll,
    hasVoted 
  });
});

// 获取当前投票（公开展示 - 不显示结果）
app.get('/api/poll/current', (req, res) => {
  if (!data.currentPoll) {
    return res.json({ success: true, poll: null });
  }
  
  const deviceId = generateDeviceFingerprint(req);
  const pollVotes = data.votes.get(data.currentPoll.id);
  const hasVoted = pollVotes ? pollVotes.has(deviceId) : false;
  
  // 返回投票信息，但不包含详细结果（仅返回总票数）
  const pollVotesCount = pollVotes ? pollVotes.size : 0;
  
  res.json({ 
    success: true, 
    poll: {
      ...data.currentPoll,
      results: undefined // 不返回结果
    },
    totalVotes: pollVotesCount,
    hasVoted 
  });
});

// 投票
app.post('/api/vote', (req, res) => {
  const { pollId, selection } = req.body;
  const deviceId = generateDeviceFingerprint(req);
  
  const poll = data.polls.find(p => p.id === pollId);
  if (!poll || poll.status !== 'active') {
    return res.status(400).json({ success: false, message: '投票不可用' });
  }
  
  let pollVotes = data.votes.get(pollId);
  if (!pollVotes) {
    pollVotes = new Map();
    data.votes.set(pollId, pollVotes);
  }
  
  // 检查是否已投票
  if (pollVotes.has(deviceId)) {
    return res.status(400).json({ success: false, message: '您已经投过票了' });
  }
  
  // 验证选项
  if (poll.type === 'election') {
    // 处理差额选举投票
    if (!selection.type || selection.type !== 'election') {
      return res.status(400).json({ success: false, message: '无效的选举投票格式' });
    }
    
    const { approves, rejects, alternatives, abstentions } = selection;
    const shouldElect = poll.electionConfig.shouldElect;
    
    // 验证规则
    if (alternatives.length > rejects.length) {
      return res.status(400).json({ 
        success: false, 
        message: '另选人数量不能超过不赞成人数' 
      });
    }
    
    const totalApproves = approves.length + alternatives.length;
    if (totalApproves > shouldElect) {
      return res.status(400).json({ 
        success: false, 
        message: '总选人数超过应选人数，这是无效票' 
      });
    }
    
    // 统计票数
    approves.forEach(name => {
      if (!poll.results[name]) poll.results[name] = { approve: 0, reject: 0, abstain: 0 };
      poll.results[name].approve++;
    });
    
    rejects.forEach(name => {
      if (!poll.results[name]) poll.results[name] = { approve: 0, reject: 0, abstain: 0 };
      poll.results[name].reject++;
    });
    
    abstentions.forEach(name => {
      if (!poll.results[name]) poll.results[name] = { approve: 0, reject: 0, abstain: 0 };
      poll.results[name].abstain++;
    });
    
    // 统计另选人
    alternatives.forEach(name => {
      if (!poll.results[name]) {
        poll.results[name] = { approve: 0, reject: 0, abstain: 0, isAlternative: true };
      }
      poll.results[name].approve++;
    });
    
    pollVotes.set(deviceId, selection);
  } else if (poll.type === 'single') {
    if (!poll.options.includes(selection)) {
      return res.status(400).json({ success: false, message: '无效的选项' });
    }
    poll.results[selection]++;
    pollVotes.set(deviceId, selection);
  } else {
    // 多选验证
    if (!Array.isArray(selection) || !selection.every(s => poll.options.includes(s))) {
      return res.status(400).json({ success: false, message: '无效的选项' });
    }
    
    // 验证多选配置
    if (poll.selectionConfig) {
      if (poll.selectionConfig.exact) {
        // 必须选择指定数量
        if (selection.length !== poll.selectionConfig.exact) {
          return res.status(400).json({ 
            success: false, 
            message: `必须选择${poll.selectionConfig.exact}个选项` 
          });
        }
      } else {
        // 验证最小和最大数量
        if (selection.length < poll.selectionConfig.min) {
          return res.status(400).json({ 
            success: false, 
            message: `至少选择${poll.selectionConfig.min}个选项` 
          });
        }
        if (selection.length > poll.selectionConfig.max) {
          return res.status(400).json({ 
            success: false, 
            message: `最多选择${poll.selectionConfig.max}个选项` 
          });
        }
      }
    }
    
    selection.forEach(opt => poll.results[opt]++);
    pollVotes.set(deviceId, selection);
  }
  
  // 广播更新
  broadcast({ type: 'voteUpdate', poll });
  
  saveData(); // 保存数据
  res.json({ success: true, message: '投票成功' });
});

// 获取投票结果（仅管理员）
app.get('/api/poll/:id/results', (req, res) => {
  // 验证管理员权限（简化版，生产环境应使用JWT等）
  const isAdmin = req.headers.authorization === 'admin-token';
  
  const poll = data.polls.find(p => p.id === req.params.id);
  if (!poll) {
    return res.status(404).json({ success: false, message: '投票不存在' });
  }
  
  const pollVotes = data.votes.get(poll.id);
  const totalVotes = pollVotes ? pollVotes.size : 0;
  
  // 只有管理员或已结束的投票才能看到结果
  if (!isAdmin && poll.status !== 'ended') {
    return res.status(403).json({ 
      success: false, 
      message: '投票进行中，结果暂不公开' 
    });
  }
  
  res.json({ 
    success: true, 
    poll,
    totalVotes,
    results: poll.results
  });
});

// 导出结果为HTML（可打印为PDF）
app.get('/api/admin/poll/:id/export', (req, res) => {
  const poll = data.polls.find(p => p.id === req.params.id);
  if (!poll) {
    return res.status(404).json({ success: false, message: '投票不存在' });
  }
  
  const pollVotes = data.votes.get(poll.id);
  const totalVotes = pollVotes ? pollVotes.size : 0;
  
  // 计算最大票数（根据投票类型）
  let maxVotes = 1;
  if (poll.type === 'election') {
    // 差额选举：使用赞成票数
    maxVotes = Math.max(...Object.values(poll.results).map(r => r.approve || 0), 1);
  } else {
    // 普通投票：直接使用票数
    maxVotes = Math.max(...Object.values(poll.results), 1);
  }
  
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>投票结果报告 - ${poll.title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: "Microsoft YaHei", "SimSun", Arial, sans-serif;
            padding: 40px;
            color: #333;
            background: white;
        }
        h1 {
            text-align: center;
            color: #2b7cff;
            margin-bottom: 30px;
            font-size: 28px;
            font-weight: 700;
        }
        .info-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .info-item {
            margin: 10px 0;
            font-size: 14px;
            line-height: 1.6;
        }
        .info-label {
            font-weight: bold;
            color: #2b7cff;
            display: inline-block;
            min-width: 100px;
        }
        hr {
            border: none;
            border-top: 2px solid #2b7cff;
            margin: 30px 0;
        }
        h2 {
            color: #2b7cff;
            margin-bottom: 20px;
            font-size: 20px;
            font-weight: 600;
        }
        .result-item {
            margin: 20px 0;
            page-break-inside: avoid;
        }
        .option-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        .vote-info {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
        }
        .bar-container {
            background: #e9ecef;
            height: 30px;
            border-radius: 4px;
            overflow: hidden;
            position: relative;
        }
        .bar-fill {
            background: #2b7cff;
            height: 100%;
            display: flex;
            align-items: center;
            padding-left: 10px;
            color: white;
            font-weight: bold;
            font-size: 14px;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #999;
            page-break-before: avoid;
        }
        .print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: #2b7cff;
            color: white;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(43, 124, 255, 0.3);
        }
        .print-btn:hover {
            background: #1a6ae8;
        }
        @media print {
            body { padding: 20px; }
            .print-btn { display: none; }
        }
    </style>
</head>
<body>
    <button class="print-btn" onclick="window.print()">🖨️ 打印/保存为PDF</button>
    
    <h1>📊 投票结果报告</h1>
    
    <div class="info-section">
        <div class="info-item">
            <span class="info-label">投票标题：</span>${poll.title}
        </div>
        ${poll.description ? `
        <div class="info-item">
            <span class="info-label">投票描述：</span>${poll.description}
        </div>
        ` : ''}
        <div class="info-item">
            <span class="info-label">创建时间：</span>${new Date(poll.createdAt).toLocaleString('zh-CN')}
        </div>
        ${poll.startedAt ? `
        <div class="info-item">
            <span class="info-label">开始时间：</span>${new Date(poll.startedAt).toLocaleString('zh-CN')}
        </div>
        ` : ''}
        ${poll.endedAt ? `
        <div class="info-item">
            <span class="info-label">结束时间：</span>${new Date(poll.endedAt).toLocaleString('zh-CN')}
        </div>
        ` : ''}
        <div class="info-item">
            <span class="info-label">投票类型：</span>${
              poll.type === 'single' ? '单选' : 
              poll.type === 'election' ? '差额选举' : 
              '多选'
            }${
              poll.type === 'election' && poll.electionConfig ? 
              ` (候选人${poll.options.length}人，应选${poll.electionConfig.shouldElect}人，到会${poll.electionConfig.attendeeCount}人)` : 
              poll.type === 'multiple' && poll.selectionConfig ? 
              (poll.selectionConfig.exact ? ` (必选${poll.selectionConfig.exact}个)` : ` (${poll.selectionConfig.min}-${poll.selectionConfig.max}个)`) : 
              ''
            }
        </div>
        <div class="info-item">
            <span class="info-label">匿名投票：</span>${poll.anonymous ? '是' : '否'}
        </div>
        <div class="info-item">
            <span class="info-label">总票数：</span>${totalVotes}
        </div>
        ${poll.type === 'election' && poll.electionConfig ? `
        <div class="info-item">
            <span class="info-label">选举有效性：</span>
            <span style="color: ${totalVotes <= poll.electionConfig.attendeeCount ? '#28a745' : '#dc3545'}; font-weight: bold;">
                ${totalVotes <= poll.electionConfig.attendeeCount ? 
                  `✓ 选举有效（收回${totalVotes}张 ≤ 到会${poll.electionConfig.attendeeCount}人）` : 
                  `✗ 选举无效（收回${totalVotes}张 > 到会${poll.electionConfig.attendeeCount}人）`
                }
            </span>
        </div>
        ` : ''}
    </div>
    
    <hr>
    
    <h2>投票结果</h2>
    
    ${poll.type === 'election' ? 
      // 差额选举结果
      Object.keys(poll.results).map((name, index) => {
        const result = poll.results[name];
        const approve = result.approve || 0;
        const reject = result.reject || 0;
        const abstain = result.abstain || 0;
        const total = approve + reject + abstain;
        const approvePercent = total > 0 ? ((approve / total) * 100).toFixed(1) : 0;
        const barWidth = maxVotes > 0 ? ((approve / maxVotes) * 100).toFixed(1) : 0;
        
        return `
          <div class="result-item" style="${result.isAlternative ? 'background: #fff3cd; padding: 15px; border-radius: 8px;' : ''}">
              <div class="option-name">${index + 1}. ${name}${result.isAlternative ? ' (另选)' : ''}</div>
              <div class="vote-info">
                  ✓ 赞成: ${approve} 票 | 
                  ✗ 不赞成: ${reject} 票 | 
                  ○ 弃权: ${abstain} 票 | 
                  得票率: ${approvePercent}%
              </div>
              <div class="bar-container">
                  <div class="bar-fill" style="width: ${barWidth}%; background: #28a745;">
                      ${approvePercent}%
                  </div>
              </div>
          </div>
        `;
      }).join('') :
      // 普通投票结果
      poll.options.map((option, index) => {
        const votes = poll.results[option] || 0;
        const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : 0;
        const barWidth = totalVotes > 0 ? ((votes / maxVotes) * 100).toFixed(1) : 0;
        
        return `
          <div class="result-item">
              <div class="option-name">${index + 1}. ${option}</div>
              <div class="vote-info">票数：${votes} 票 (${percentage}%)</div>
              <div class="bar-container">
                  <div class="bar-fill" style="width: ${barWidth}%">
                      ${percentage}%
                  </div>
              </div>
          </div>
        `;
      }).join('')
    }
    
    <div class="footer">
        报告生成时间：${new Date().toLocaleString('zh-CN')}
    </div>
</body>
</html>
  `;
  
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// 导出结果为JSON
app.get('/api/admin/poll/:id/export-json', (req, res) => {
  const poll = data.polls.find(p => p.id === req.params.id);
  if (!poll) {
    return res.status(404).json({ success: false, message: '投票不存在' });
  }
  
  const pollVotes = data.votes.get(poll.id);
  const totalVotes = pollVotes ? pollVotes.size : 0;
  
  const report = {
    title: poll.title,
    description: poll.description,
    createdAt: poll.createdAt,
    endedAt: poll.endedAt,
    totalVotes,
    results: poll.results,
    type: poll.type,
    anonymous: poll.anonymous
  };
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=poll-${poll.id}.json`);
  res.json(report);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('========================================');
  console.log('  实时投票系统');
  console.log('========================================');
  console.log(`✓ 服务器运行在: http://localhost:${PORT}`);
  console.log(`✓ 管理员密码: ${data.adminPassword}`);
  console.log(`✓ 数据存储: ${DATA_FILE}`);
  console.log(`✓ 备份目录: ${BACKUP_DIR}`);
  console.log('========================================');
});

// 优雅关闭：保存数据
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  saveData();
  console.log('✓ 数据已保存');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n正在关闭服务器...');
  saveData();
  console.log('✓ 数据已保存');
  process.exit(0);
});
