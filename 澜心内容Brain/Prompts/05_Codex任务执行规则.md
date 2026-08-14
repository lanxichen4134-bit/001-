# Codex 任务执行规则｜澜心内容 Brain

## 开始前

1. 读取根目录 AGENTS.md、Docs/PROJECT_STATE.md 和本次相关 Brain/原始资料。
2. 执行 git rev-parse --show-toplevel、git branch --show-current、git remote -v、git status --short。
3. 确认远端仅为 https://github.com/lanxichen4134-bit/001-.git；不向旧 Obsidian Vault 或其他仓库写入、提交或推送。
4. 有无关未提交修改、远端不符、真实冲突、需覆盖原话或需处理敏感材料时，停止危险动作并报告。

## 执行中

- 最小修改、保留原话、一份正文一个主位置。
- 优先索引既有资产，不复制 Vault 的完整正文、原始聊天、语音、学员资料或大文件。
- 四类长期 Brain（身份、价值观、经典观点、禁用表达）只有澜心明确确认后才能升级。
- 科学事实、推测、文化解释和个人体验/案例分层，不虚构来源或数据。
- 公开远端只允许公开安全、去标识化文本；绝不写入凭据、Token、Cookie、私钥、个人隐私或未公开经营数据。

## 结束前的强制闭环

1. 最小更新 Docs/PROJECT_STATE.md：时间、last_execution、当前完成、待办、阻塞和远端验证状态。
2. 只使用 git add -- <实际修改路径> 暂存；严禁 git add . 或 git add -A。
3. 使用清晰提交信息，例如 content-brain: initialize V0.1 structure。
4. 执行 git push origin <当前分支>；不得使用 force 或 force-with-lease。
5. 读取本地 HEAD 与远端分支 SHA，必须确认 Local HEAD = Remote HEAD。
6. 最终回报：本次完成、实际读取、实际修改、原话保护、Brain变化、仓库/分支/commit/本地与远端 SHA、push 和真实待办。

若 GitHub 要求认证，在交互终端中让澜心直接输入；不显示、不保存、不提交 Token。
