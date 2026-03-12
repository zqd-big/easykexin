# 技术选型建议（MVP）

## 1. 总体方案
- 架构：前后端分离，单仓库管理
- 前端：React + TypeScript + Vite
- 后端：Node.js + Express + TypeScript
- 存储：JSON 文件（MVP），后续可切 SQLite

## 2. 选型理由
### 前端（React + TypeScript）
- 组件化适合多页面训练流程（首页/练习/题库/错题/拆解）
- TypeScript 便于约束题目模型与接口返回类型
- Vite 启动快，适合本地 MVP 快速迭代

### 后端（Node + Express）
- 与前端语言统一，开发心智成本低
- REST API 足够覆盖 MVP 数据读写
- 便于后续接入判题服务或鉴权

### 存储（JSON -> SQLite）
- JSON：零门槛、可直接手改题库、适合前期验证题型
- SQLite：当训练记录增多时可平滑迁移，支持索引与统计查询

## 3. 推荐目录
- `apps/web`：React 前端
- `apps/api`：Node API
- `data/questions.json`：题库
- `data/user_progress.json`：训练记录
- `schemas/micro-drill.schema.json`：题目 Schema

## 4. 后续演进
1. `JSON` 升级 `SQLite`（保留同一 API）
2. 增加代码执行沙箱（容器隔离）
3. 增加自动判题与分步评分
4. 增加学习路径推荐（基于错误分布）
