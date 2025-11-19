const { supabase } = require('./supabase');

// 获取所有投票
async function getAllPolls() {
  const { data, error } = await supabase
    .from('polls')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

// 获取单个投票
async function getPoll(pollId) {
  const { data, error } = await supabase
    .from('polls')
    .select('*')
    .eq('id', pollId)
    .single();
  
  if (error) throw error;
  return data;
}

// 创建投票
async function createPoll(pollData) {
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
      status: 'draft'
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// 更新投票状态
async function updatePollStatus(pollId, status) {
  const updates = { status };
  
  if (status === 'active') {
    updates.started_at = new Date().toISOString();
  } else if (status === 'ended') {
    updates.ended_at = new Date().toISOString();
  }
  
  const { data, error } = await supabase
    .from('polls')
    .update(updates)
    .eq('id', pollId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// 删除投票
async function deletePoll(pollId) {
  const { error } = await supabase
    .from('polls')
    .delete()
    .eq('id', pollId);
  
  if (error) throw error;
}

// 检查是否已投票
async function hasVoted(pollId, deviceId) {
  const { data, error } = await supabase
    .from('votes')
    .select('id')
    .eq('poll_id', pollId)
    .eq('device_id', deviceId)
    .single();
  
  return !!data;
}

// 提交投票
async function submitVote(pollId, deviceId, voteData) {
  const { data, error } = await supabase
    .from('votes')
    .insert([{
      poll_id: pollId,
      device_id: deviceId,
      vote_data: voteData
    }])
    .select()
    .single();
  
  if (error) {
    if (error.code === '23505') { // 唯一约束冲突
      throw new Error('您已经投过票了');
    }
    throw error;
  }
  
  return data;
}

// 获取投票结果
async function getPollResults(pollId) {
  const { data, error } = await supabase
    .from('votes')
    .select('vote_data')
    .eq('poll_id', pollId);
  
  if (error) throw error;
  return data || [];
}

// 获取投票统计
async function getVoteCount(pollId) {
  const { count, error } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .eq('poll_id', pollId);
  
  if (error) throw error;
  return count || 0;
}

// 生成访问码
async function generateAccessCodes(count) {
  const codes = [];
  const inserts = [];
  
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    codes.push(code);
    inserts.push({ code, used: false });
  }
  
  const { error } = await supabase
    .from('access_codes')
    .insert(inserts);
  
  if (error) throw error;
  return codes;
}

// 验证访问码
async function validateAccessCode(code) {
  const { data, error } = await supabase
    .from('access_codes')
    .select('*')
    .eq('code', code)
    .single();
  
  if (error || !data) {
    return { valid: false, message: '无效的访问码' };
  }
  
  if (data.used) {
    return { valid: false, message: '访问码已被使用' };
  }
  
  return { valid: true, data };
}

// 使用访问码
async function useAccessCode(code, deviceId) {
  const { error } = await supabase
    .from('access_codes')
    .update({
      used: true,
      device_id: deviceId,
      used_at: new Date().toISOString()
    })
    .eq('code', code);
  
  if (error) throw error;
}

// 获取所有访问码
async function getAllAccessCodes() {
  const { data, error } = await supabase
    .from('access_codes')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

module.exports = {
  getAllPolls,
  getPoll,
  createPoll,
  updatePollStatus,
  deletePoll,
  hasVoted,
  submitVote,
  getPollResults,
  getVoteCount,
  generateAccessCodes,
  validateAccessCode,
  useAccessCode,
  getAllAccessCodes
};
