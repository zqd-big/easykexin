# 可信考试碎片化刷题软件（MVP）

## 1. 项目说明
- 目标：把华为可信考试长题拆成微题，支持碎片时间练习。
- 当前：已完成 MVP 骨架（前端 + 后端 + 66 题种子题库）。

## 2. 目录
- `docs/`：PRD、信息架构、线框、技术选型、题库覆盖
- `schemas/`：微题 JSON Schema
- `data/questions.json`：题库数据
- `data/user_progress.json`：练习记录
- `apps/api`：Node + Express API
- `apps/web`：React + TypeScript 前端

## 3. 本地运行
```bash
npm install
npm run dev
```

默认端口：
- 前端 `http://localhost:5173`
- 后端 `http://localhost:8787`

## 4. 核心接口
- `GET /api/meta`
- `GET /api/questions`
- `GET /api/questions/:id`
- `GET /api/decompose/:source`
- `POST /api/submissions`
- `GET /api/wrongbook`

## 5. 后续建议
1. 题库从 JSON 迁移 SQLite。
2. 增加自动判题（编译+运行+用例校验）。
3. 增加个性化推荐（按薄弱技能推题）。
