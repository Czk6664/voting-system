# 差额选举显示和导出问题修复

## 修复的问题

### 1. PDF导出显示 [object Object]
**问题描述**：导出PDF时，差额选举的候选人信息显示为 `[object Object]`

**原因**：
- 差额选举的 `poll.results[name]` 是一个对象：`{ approve: 1, reject: 0, abstain: 0 }`
- 而普通投票的 `poll.results[option]` 是数字
- PDF导出代码只处理了数字类型，没有处理对象类型

**修复**：
- 在 `app.js` 的 `/api/admin/poll/:id/export` 接口中，添加了对差额选举的特殊处理
- 正确显示赞成、不赞成、弃权的票数和得票率
- 另选人用黄色背景标识

### 2. 投票类型显示不准确
**问题描述**：PDF中投票类型只显示"单选"或"多选"，没有显示"差额选举"

**修复**：
- 添加了差额选举类型的识别
- 显示格式：`差额选举 (候选人6人，应选3人，到会60人)`
- 同时显示选举有效性：✓ 选举有效 或 ✗ 选举无效

### 3. 总票数显示为0
**问题描述**：差额选举的总票数在管理界面显示为0

**原因**：
- 前端使用 `Object.values(poll.results).reduce((a, b) => a + b, 0)` 计算总票数
- 对于差额选举，`poll.results` 的值是对象，不能直接相加
- 导致 `{approve: 1} + {approve: 1}` = `[object Object][object Object]`

**修复**：
- 修改后端 `/api/admin/polls` 接口，为每个投票添加 `totalVotes` 字段
- `totalVotes` 从 `data.votes.get(poll.id).size` 获取，表示实际投票人数
- 前端直接使用后端返回的 `totalVotes`

### 4. 最大票数计算错误
**问题描述**：PDF导出时，进度条宽度计算错误

**原因**：
- 代码使用 `Math.max(...Object.values(poll.results), 1)` 计算最大票数
- 对于差额选举，这会尝试比较对象，导致错误

**修复**：
- 根据投票类型分别处理：
  - 差额选举：`Math.max(...Object.values(poll.results).map(r => r.approve || 0), 1)`
  - 普通投票：`Math.max(...Object.values(poll.results), 1)`

## 修改的文件

1. **app.js**
   - `/api/admin/polls` 接口：添加 `totalVotes` 字段
   - `/api/admin/poll/:id/export` 接口：
     - 修复投票类型显示
     - 添加选举有效性显示
     - 修复最大票数计算
     - 添加差额选举结果的特殊渲染逻辑

2. **admin.html**
   - `renderPolls()` 函数：使用后端返回的 `totalVotes` 而不是前端计算
   - `renderHistory()` 函数：同样使用后端返回的 `totalVotes`

3. **display.html**
   - `loadCurrentPoll()` 函数：保存后端返回的 `totalVotes`
   - `renderResults()` 函数：
     - 根据投票类型计算总票数
     - 差额选举使用保存的 `totalVotes`
     - 普通投票累加选项票数
   - 图表数据准备：差额选举使用赞成票数
   - 结果列表渲染：添加差额选举的特殊显示逻辑

## 额外修复：图表显示问题

### 5. 图表数据错误
**问题描述**：差额选举的图表无法正确显示

**原因**：
- 图表代码尝试使用 `poll.options.map(opt => poll.results[opt])` 获取数据
- 对于差额选举，`poll.results[name]` 是对象，不是数字
- 导致图表数据为 `[object Object]`，无法渲染

**修复**：
- **display.html**：
  - 添加 `loadPollResults()` 函数，从 `/api/poll/:id/results` 加载完整数据
  - 投票结束时调用此函数获取包含 `totalVotes` 的完整数据
  - 图表数据准备时，差额选举使用 `result.approve` 赞成票数
  - 添加数据验证，避免空数据导致错误
  
- **admin.html**：
  - `showChart()` 函数中，差额选举使用 `result.approve` 赞成票数
  - 添加数据类型检查

## 测试建议

1. 创建一个差额选举（例如：6个候选人，应选3人，到会60人）
2. 进行投票（包括赞成、不赞成、弃权、另选）
3. 结束投票
4. 检查管理界面的总票数是否正确
5. 检查公开展示页面（display.html）：
   - 总票数是否正确显示
   - 饼图和柱状图是否正确显示赞成票数
   - 结果列表是否显示赞成/不赞成/弃权详情
6. 在管理界面点击"查看图表"：
   - 图表是否正确显示
   - 数据是否为赞成票数
7. 导出PDF，检查：
   - 投票类型是否显示为"差额选举"
   - 候选人信息是否正确显示（不是 [object Object]）
   - 总票数是否正确
   - 选举有效性是否正确显示
   - 另选人是否有黄色背景标识

## 关于"差额选举"的说明

差额选举是指候选人数量**多于**应选人数的选举方式。例如：
- 候选人6人，应选3人 → 差额3人
- 这样选民有更多选择空间，可以淘汰不合适的候选人

显示"应选3人"是正确的，表示从6个候选人中选出3人。
