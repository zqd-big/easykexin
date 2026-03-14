# 免 Node 便携版

## 运行方式
1. 双击 `run-portable.bat`
2. 浏览器会打开 `index.html`

不需要安装 Node.js、npm、Python。

## 数据来源
- 题库来自项目根目录 `data/questions.json`
- 已在 `questions-data.js` 内嵌，可离线运行
- 如果你更新了 `data/questions.json`，执行 `refresh-data.ps1` 重新打包题库数据

## 说明
- 提交记录保存在浏览器 `localStorage`
- 清空浏览器站点数据会清掉错题记录
