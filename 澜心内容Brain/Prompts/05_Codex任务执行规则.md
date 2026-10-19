# Codex 任务执行规则

本文件是执行入口摘要；完整规则以根目录[AGENTS.md](../../AGENTS.md)和[一句话执行规范](../Docs/ONE_SENTENCE_EXECUTION.md)为准，不另维护个人事实或第二套任务系统。

## 开始前

读取AGENTS、PROJECT_STATE、DECISIONS、SYSTEM_MAP及任务相关Brain、原始资料和已有内容卡。检查仓库根目录、分支、remote、工作区，执行git fetch origin后比较本地与origin/main。唯一远端为 https://github.com/lanxichen4134-bit/001-.git，正式分支main。

有无关未提交修改、本地独有提交、分叉、错误远端或需覆盖原话时停止相关写入，保护并报告；只有干净且无本地独有提交或分叉时才能快进同步。公开可见性每次提交前重新核实。旧Obsidian只读，不向其他远端推送。

## 执行中

理解一句话意图，资料和权限具备就做，不让澜心填写技术表。最小修改、原话保护、一份正文一个主位置；按最新明确输入和已确认Brain处理事实，AI建议不自动升级。新长期规则需具体确认依据、日期和范围，已获授权不用重问。不能安全公开的正文不提交。

研究依[研究参考](../Docs/XIAOHONGSHU_TOPIC_RESEARCH_REFERENCE_V1.0.md)与[报告标准](../Docs/RESEARCH_REPORT_STANDARD.md)；写作直接接现有Content入口；Work交接使用[中文入口](09_Work执行入口.md)。工具实际未联通就交付可转交说明，不声称执行完成。

## 结束前

1. 最小更新PROJECT_STATE的实际动作、完成、待办、限制及验证状态。
2. 正式源变更后由Docs/framework_tools.py生成受影响阅读快照，再运行检查；不把本地快照更新说成Project已上传。
3. 审查.gitignore、公开安全、准确修改清单和staged diff，只用git add -- <本次实际路径>。
4. 使用content-brain:前缀提交；普通git push origin main，不强推。
5. 比较git rev-parse HEAD与git ls-remote origin refs/heads/main，真实确认相等。状态文件可记录提交前已验证基线，最终新SHA写执行回执，不能预写成功或循环自引用。
6. 用中文报告结果、测试边界、实际修改、仓库/分支/commit和SHA一致性；推送失败如实说明。

认证由用户在正规交互界面完成，不显示、不保存、不提交任何凭据。禁止破坏性清理或覆盖无关工作。
