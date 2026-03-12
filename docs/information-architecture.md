# 信息架构与页面结构

## 1. 站点信息架构
- Home（首页）
- Practice（练习页）
- Question Bank（题库页）
- Wrongbook（错题与薄弱点）
- Decompose（长题拆解页）

## 2. 页面结构
## 2.1 Home
- 顶部：产品标题 + 导航
- 主区域：
  - 模式卡片（micro/decompose/template/review）
  - 技能标签多选
  - 开始按钮

## 2.2 Practice
- 左栏：题目信息
  - 标题
  - brief
  - 输入示例
  - 期望输出
  - 预计耗时
- 右栏：
  - C 代码编辑区
  - 操作区（提交/看答案/下一题）
  - 反馈区（标记答对/答错）

## 2.3 Question Bank
- 顶部筛选条：
  - 标签
  - 函数名
  - 难度
- 列表区：题目卡片
- 详情抽屉：题干、示例、标签、模式

## 2.4 Wrongbook
- 左栏：错题列表
- 右栏：薄弱技能统计（标签 -> 错误次数）

## 2.5 Decompose
- 顶部：source_problem 选择器
- 主区：按 step_order 显示步骤题卡片
- 每卡片可直接进入练习

## 3. 导航与路由
- `/` -> Home
- `/practice` -> Practice
- `/bank` -> Question Bank
- `/wrongbook` -> Wrongbook
- `/decompose` -> Decompose
