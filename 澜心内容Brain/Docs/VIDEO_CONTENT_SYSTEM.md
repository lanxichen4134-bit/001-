---
title: 视频内容档案系统
date: 2026-08-24
status: active
repository_truth_source: origin/main
---

# 视频内容档案系统

本系统将一条视频从内容事实到长期学习的过程，统一记录在澜心内容 Brain 中：

~~~text
原始视频 / 数据截图（本地媒体资产层）
→ Content 视频内容档案
→ 逐字稿
→ Reviews 发布记录
→ 追加式数据快照
→ 内容复盘
→ 候选长期洞见
→ 澜心明确确认
→ Brain 长期事实层
~~~

GitHub origin/main 是视频文本档案、逐字稿、发布数据和复盘的唯一正式事实源；它不是两台电脑之间同步原始媒体的地方。

## 适用范围与安全边界

- GitHub 可保存：Content ID、内容档案、逐字稿、内容结构、发布记录、公开安全的数据快照、去标识化反馈、复盘和明确标注的 AI 分析。
- GitHub 不保存：原始视频、原始音频、剪辑工程、平台后台原始截图、本机缓存、完整私信/聊天、可识别用户资料、健康敏感资料、未公开经营数据或本机绝对路径。
- 两台电脑如需共同访问媒体，应使用 iCloud、NAS、网盘或其他受控媒体资产系统；本仓库只保留 source_video_filename 和 source_asset_label 等跨设备可理解的标签。
- public_safety 为每份正式视频档案、逐字稿和发布记录的强制字段：public_safe、needs_review、private_do_not_commit。后两者不得将敏感正文直接提交到公开仓库。

## Content ID、状态与变体

### Content ID

每一条正式内容只有一个 Content ID，格式为 CYYYYMMDD-NNN。例如 C20260824-001。

- 日期是内容正式进入内容档案系统的日期；NNN 从当日 001 开始。
- 建立前必须搜索仓库，确认没有同一 ID；标题后续改变也不得改变 ID。
- 同一内容跨平台发布、复用或复盘，都继续引用原 Content ID，不建立新的 Content ID。

### Content status

唯一内容状态链仍为：

~~~text
raw_idea → discussing → idea_clear → structure_ready → drafting → approved → published → reviewed
~~~

不得用 recorded、edited 或 finished 新建并行 Content 状态。视频制作进度使用独立 media_stage，例如 source、edited、final；它不替代 status。

### Variant

同一内容仅做跨平台发布时，不需要变体。若明显改变开头、剪辑、时长、结构，或进行 A/B 测试，可使用 variant_id，例如 V01、V02。每条发布记录必须标明自己使用的 variant；无变体可留空。

## Publish ID 与平台

每一次发布使用 Publish ID：P-{ContentID}-{平台代码}-{序号}。例如 P-C20260824-001-DY-01。

首批平台代码为：DY（抖音）、WX（视频号）、XHS（小红书）、BILI（B站）、KS（快手）。新平台出现时再增加实际需要的代码，不预设无用代码。

## 一条真实视频的操作顺序

1. 读取本文件、对应模板和 AGENTS.md；搜索 Content ID，避免重复入库。
2. 在 Content/视频档案/年份/ 建立内容档案，并按模板记录内容事实和 media_stage；创建日期文件夹仅在第一条真实记录需要时建立。
3. 在 Content/逐字稿/年份/ 建立对应 transcript，按 A 原始机器转写、B AI 核对版、C AI 整理版三层分开保存。
4. 发布时，在 Reviews/视频发布记录/年份/ 建立一个 Publish Record。多平台或多次发布应分别建立 Publish ID。
5. 每次收到后台截图或可核验数据，向对应 Publish Record 新增一个 Data Snapshot；绝不覆盖历史快照。
6. 在该发布记录中完成复盘，明确区分事实、假设和未知；一次结果不能自动成为长期规律。
7. 新的候选原话、候选洞见和 AI 建议只保存在对应档案/复盘中。只有澜心明确确认后，才可建议进入 Brain。

## 逐字稿、数据与复盘的证据规则

- A. 原始机器转写最大程度保留实际口语；听不清写 [听不清]，不确定写 [待核]，不脑补人名、机构名或数字。可获取时保留真实时间码，不能伪造。
- B. AI 核对版仅可修正明显识别错误、补标点、分段、确认同音字和清除技术噪声；不得改变原意、增加观点或美文化。只有澜心明确确认，human_confirmed 才可写 true。
- C. AI 整理版可以压缩、二创、提炼结构或剪辑点，但必须标注为 AI 整理，绝不是澜心逐字原话。
- 发布数据以平台可见值为事实。显示为 1.2万等近似数时保留原始显示值；若为计算需要归一化，另标 approximate: true 和 AI 计算，不能伪装成平台精确数值。
- 仅在原始数据充分时计算收藏率、完播率等衍生指标；所有计算与原始平台数据必须分开。
- 评论、私信、学员反馈进入公开仓库前必须去除用户名、头像、联系方式、订单号、可识别身份和不必要的健康细节；优先归纳问题与高频反应。

## 关联文件

- Content/视频档案/README_视频档案规则.md
- Content/逐字稿/README_逐字稿规则.md
- Reviews/视频发布记录/README_发布与数据记录规则.md
- Prompts/06_视频内容入库_首条Prompt.md
- Prompts/07_视频发布数据与复盘_首条Prompt.md

## 本次边界

本次只建立规则、目录、模板、提示词和系统接入；不批量迁移历史视频、历史截图或历史逐字稿，不预建年份空目录，也不因本系统自动修改 Brain。
