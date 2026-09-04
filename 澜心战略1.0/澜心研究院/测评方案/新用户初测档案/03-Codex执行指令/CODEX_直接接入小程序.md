# Codex执行指令｜将澜心社女性身体状态测评1.0直接接入小程序

你现在作为本项目高级全栈工程师，直接读取当前小程序仓库，并以本目录下 `02-小程序接入包/` 为唯一产品与算法基准，完成《澜心社女性身体状态测评1.0》的正式接入。

这不是方案讨论任务。不要只输出设计文档、伪代码或示例代码；请检查现有技术栈、修改真实代码、完成数据库/API/页面/测试，并交付可进入小程序测试环境运行的版本。

## 必读文件

- `README.md`
- `assessment.schema.json`
- `scoring.config.json`
- `recommendation-map.json`
- `engine.ts`
- `API_CONTRACT.md`
- `sample-input.json`
- `sample-output.json`

## 必须完成的业务闭环

`用户进入测评 → 创建Session → 动态问卷 → 中途保存 → 提交 → 评分 → 身体画像 → GREEN/YELLOW/ORANGE/RED分流 → 用户标签 → 1主计划+最多1辅助计划 → 健康顾问/专业评估分流 → 数据入库 → 历史结果可查看`

## 技术原则

1. 优先复用现有小程序技术栈、登录态、API、数据库、商品系统和顾问入口；不得为本功能重构整个项目。
2. 问卷优先根据 `assessment.schema.json` 动态渲染，支持 single、multi、single_image、number、slider、scale_0_3、required、visibleWhen、exclusive、maxSelections。
3. 评分算法以 `engine.ts` 和 `scoring.config.json` 为准；若现有项目不是 TypeScript，可等价转换，但不得改变算法结果。
4. 课程只通过 courseId 映射真实SKU与页面路径，不把价格/SKU/URL写死在评分引擎。
5. 所有历史结果保存 `assessmentVersion=1.0.0`，重新测评生成新 session/result，不覆盖旧数据。
6. 用户端不显示单一健康总分；结果页固定展示身体成分、身体曲线、体态核心、盆底状态。
7. 盆底至少保留 BALANCED / WEAKNESS / TENSION / COORDINATION / MIXED 五类。
8. ORANGE 优先顾问咨询；RED 停止普通强化训练销售流程，转专业评估建议。
9. 原始健康答案按敏感数据处理，不进入普通运营日志或第三方埋点。
10. 不得编造不存在的真实SKU、课程路径、CRM入口；找不到时标记明确 TODO，但继续完成其他可开发部分。

## 验收测试

至少覆盖：
- GREEN：基础健康用户；
- YELLOW：产后漏尿+偏弱；
- ORANGE：疼痛+难放松+排尿困难；
- ORANGE：偏弱与偏紧同时存在的混合型；
- RED：明显脱出/异常出血/血尿等红旗；
- ORANGE：孕期；
- ORANGE：产后6周以内。

## 完成后报告

请输出：
1. 新增/修改文件路径；
2. 小程序实际入口；
3. 数据库变更；
4. 实际API/云函数；
5. courseId→真实SKU映射；
6. 健康顾问入口；
7. GREEN/YELLOW/ORANGE/RED测试结果；
8. 仅列真正依赖外部资源的未完成项。

最终目标：打开微信小程序后，用户能直接完成测评、看到身体画像、获得正确训练/咨询分流，且数据完整进入后台。
