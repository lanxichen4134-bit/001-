# 澜心社女性身体状态测评 1.0｜API / 数据库对接建议

## 1. 前端读取题库

建议题库不写死在页面。

启动时读取：

`assessment.schema.json`

前端根据：
- `type`
- `required`
- `options`
- `visibleWhen`

动态渲染。

## 2. 推荐的后端流程

```text
前端问卷
→ submit answers
→ validate
→ evaluateAssessment()
→ 保存原始答案
→ 保存计算结果
→ 保存标签
→ 返回 result DTO
```

## 3. 建议数据库表

### assessment_sessions

```sql
id
user_id
assessment_version
status
started_at
completed_at
raw_answers_json
```

### assessment_results

```sql
id
session_id
user_id
assessment_version

bmi
bmi_level
waist_level
whr
whr_level
body_fat_level

body_shape
posture_tags_json
pelvic_pattern
pelvic_weakness_score
pelvic_tension_score
pelvic_coordination_score
impact_score

risk_level
red_flags_json
advisor_required
professional_evaluation_recommended

primary_recommendation_id
secondary_recommendation_id

result_json
created_at
```

### user_health_tags

建议标签单独建表，不要只存 JSON，方便查询。

```sql
id
user_id
tag_code
source
assessment_version
created_at
active
```

## 4. 接口

### GET /api/assessment/v1/schema

返回当前题库。

### POST /api/assessment/v1/session

创建测评 session。

### PATCH /api/assessment/v1/session/:id

保存阶段进度。

### POST /api/assessment/v1/session/:id/submit

提交并生成测评结果。

### GET /api/assessment/v1/result/:id

读取历史结果。

## 5. 幂等

submit 接口建议：

- 同一 session 只能生成一次正式结果；
- 重复提交返回同一 result；
- 修改答案后必须新建 revision 或 session。

## 6. 版本化

永远保存：

`assessment_version = 1.0.0`

未来 1.1 调整评分时：
- 老用户历史结果仍按 1.0 展示；
- 重新测评生成 1.1；
- 不要批量重算历史结果，除非有明确数据迁移。

## 7. 推荐配置

不要在 `engine.ts` 里写真实 SKU、价格、上架状态。

建议课程中心维护：

```json
{
  "courseId": "COURSE_MAGIC_ABS",
  "skuId": "实际商品SKU",
  "enabled": true,
  "miniProgramPath": "/pages/course/detail?id=xxx"
}
```

评估引擎只输出 courseId。

## 8. 健康顾问线索

当出现以下任一条件时，生成顾问线索：

- riskLevel = ORANGE
- pelvicPattern = MIXED
- impactScore >= 7
- 用户主动点击“咨询健康顾问”

线索建议带上：

```text
user_id
assessment_result_id
top_3_tags
risk_level
primary_concern
pelvic_pattern
recommended_course
created_at
```

健康顾问后台不要默认展示用户所有敏感答案，只展示与咨询必要相关的信息，并设置权限控制。

## 9. RED 风险流

RED 不进入自动营销强转化。

建议：

```text
风险提示
→ 安全说明
→ 建议专业医疗/盆底康复评估
→ 用户确认
→ 可选择联系健康顾问了解下一步
```

不要出现：
- “你问题很严重”
- “必须购买某课程”
- “训练可以治疗某疾病”

## 10. 埋点建议

```text
assessment_start
assessment_section_view
assessment_question_answer
assessment_save
assessment_submit
assessment_result_view
assessment_primary_course_click
assessment_advisor_click
assessment_professional_eval_click
assessment_abandon
```

用于分析：
- 每一步流失率
- 哪类身体画像最多
- 哪类标签转化率最高
- 哪类课程推荐点击率最高
- 测评后顾问咨询率
- 不同版本算法表现
