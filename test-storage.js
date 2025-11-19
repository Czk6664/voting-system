// 文件存储功能测试脚本
const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('  文件存储功能测试');
console.log('========================================\n');

const DATA_DIR = path.join(__dirname, 'data');
const BACKUP_DIR = path.join(__dirname, 'backup');
const DATA_FILE = path.join(DATA_DIR, 'polls.json');

// 测试1: 检查目录
console.log('测试1: 检查数据目录...');
if (fs.existsSync(DATA_DIR)) {
  console.log('✓ data/ 目录存在');
} else {
  console.log('✗ data/ 目录不存在');
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log('✓ 已创建 data/ 目录');
}

if (fs.existsSync(BACKUP_DIR)) {
  console.log('✓ backup/ 目录存在');
} else {
  console.log('✗ backup/ 目录不存在');
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log('✓ 已创建 backup/ 目录');
}
console.log('');

// 测试2: 检查数据文件
console.log('测试2: 检查数据文件...');
if (fs.existsSync(DATA_FILE)) {
  const stats = fs.statSync(DATA_FILE);
  console.log('✓ polls.json 存在');
  console.log(`  文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`  修改时间: ${stats.mtime.toLocaleString('zh-CN')}`);
  
  // 尝试读取
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    console.log(`  投票数量: ${data.polls ? data.polls.length : 0}`);
    console.log(`  保存时间: ${data.savedAt || '未知'}`);
  } catch (error) {
    console.log('✗ 文件格式错误:', error.message);
  }
} else {
  console.log('✗ polls.json 不存在（首次启动时会自动创建）');
}
console.log('');

// 测试3: 检查备份文件
console.log('测试3: 检查备份文件...');
if (fs.existsSync(BACKUP_DIR)) {
  const backups = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json'));
  console.log(`✓ 找到 ${backups.length} 个备份文件`);
  
  if (backups.length > 0) {
    console.log('  最近的备份:');
    backups.slice(-5).forEach(file => {
      const stats = fs.statSync(path.join(BACKUP_DIR, file));
      console.log(`    - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
    });
  }
} else {
  console.log('✗ backup/ 目录不存在');
}
console.log('');

// 测试4: 写入权限
console.log('测试4: 测试写入权限...');
try {
  const testFile = path.join(DATA_DIR, 'test.txt');
  fs.writeFileSync(testFile, 'test');
  fs.unlinkSync(testFile);
  console.log('✓ 数据目录可写');
} catch (error) {
  console.log('✗ 数据目录不可写:', error.message);
}
console.log('');

// 总结
console.log('========================================');
console.log('  测试完成');
console.log('========================================');
console.log('\n提示:');
console.log('1. 启动服务器: npm start');
console.log('2. 创建投票并测试');
console.log('3. 重启服务器验证数据恢复');
console.log('4. 查看 data/polls.json 文件\n');
