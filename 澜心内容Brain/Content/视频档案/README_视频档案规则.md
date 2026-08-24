---
title: 视频内容档案规则
status: active
system_reference: ../../Docs/VIDEO_CONTENT_SYSTEM.md
---

# 视频内容档案规则

这里保存每条正式视频的内容事实；原始视频、音频、剪辑工程和后台截图不进入本目录，也不进入公开 GitHub。

## 文件位置与命名

第一条真实记录建立对应年份目录，例如：

~~~text
Content/视频档案/2026/C20260824-001.md
~~~

创建 Content ID 前，先在仓库中搜索既有 ID。每条内容只有一个 Content ID，标题改变时 ID 不改变。同一内容跨平台发布不新建内容档案。

## 填写规则

- status 只能使用现有 Content 状态链；media_stage 仅记录 source、edited、final 等制作进度。
- content_pillar 优先使用已确认的四支柱：身体的主人、思想的主人、人生的主人、生命的主人。
- primary_goal 只选择最主要的一个：流量、专业信任、用户教育、转化或品牌认同；确有必要才填写 secondary_goal。
- video_format 可填写口播、课程切片、直播切片、访谈、Vlog、现场分享、其他；未知留空。
- source_video_filename 与 source_asset_label 只记录跨设备标签，不记录本机路径或外部私密访问链接。
- 一条档案只记录一个核心观点。医学、传统文化、个人体验和 AI 判断分开记录；疑点写在证据与专业边界，不改写原话。
- public_safety 必填：public_safe、needs_review、private_do_not_commit。公开仓库只能提交 public_safe 的公开安全文本。

使用 [_TEMPLATE_视频内容档案.md](_TEMPLATE_视频内容档案.md) 创建真实档案。
