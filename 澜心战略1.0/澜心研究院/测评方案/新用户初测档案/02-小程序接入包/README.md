# 澜心社女性身体状态测评 1.0｜小程序接入版

版本：1.0.0  
用途：新用户首次进入小程序时，完成“身体档案 → 身体成分 → 体型曲线 → 体态核心 → 盆底功能自测 → 目标 → 个性化分流”。

## 1. 产品目标

这不是医疗诊断工具，也不输出“疾病结论”或单一总分。

系统只完成四件事：

1. 建立用户身体画像与长期标签；
2. 判断当前更适合“自主练习 / 课程推荐 / 健康顾问咨询 / 建议专业医疗评估”中的哪条路径；
3. 输出“1 个主计划 + 1 个辅助计划”，避免一次推荐过多课程；
4. 将结构化数据沉淀到澜心女性身体数据库，供后续用户研究、课程迭代和运营分析。

## 2. 核心用户路径

开始测评
→ 基本身体档案
→ 身体成分分析
→ 体型曲线分析
→ 体态与核心分析
→ 盆底功能自测
→ 身体目标
→ 生成「我的澜心身体画像」
→ CTA 分流

CTA 分为：

- GREEN：直接开始练习
- YELLOW：推荐课程，可咨询健康顾问
- ORANGE：优先健康顾问咨询，再确定训练
- RED：暂不自动推荐强化训练，建议专业医疗/盆底康复评估

## 3. 设计原则

### 3.1 不做“总健康分”
避免用一个 0–100 分把复杂身体状态伪精确化。

### 3.2 盆底先判断“收与放”，再谈加强
盆底状态至少区分：
- 平衡/维持型
- 偏弱型
- 偏紧张型
- 收放协调不足型
- 混合型
- 风险提示型

### 3.3 结果页说“倾向”，不说“诊断”
例如：
- “骨盆前倾倾向”
- “盆底偏紧张倾向”
- “核心支撑不足倾向”

不要写：
- “你患有骨盆前倾”
- “你有盆底疾病”

### 3.4 推荐优先级
安全分流 > 盆底与核心 > 体态 > 体型塑形 > 日常维持。

### 3.5 配置化
题目、阈值、标签、课程映射均放在 JSON 配置中。后续课程升级或规则调整，尽量不改核心引擎。

---

## 4. 前端建议

### 4.1 页面结构

建议 6 个步骤，每一步都显示进度：

1/6 基本档案  
2/6 身体成分  
3/6 体型曲线  
4/6 体态核心  
5/6 盆底自测  
6/6 我的目标

### 4.2 交互原则

- 单题尽量不超过一屏；
- 体型、体态类题目建议配澜心社自有示意图；
- 允许“我不确定”；
- 数字题即时校验；
- 预计完成时间 3–5 分钟；
- 支持中途保存和恢复；
- 红旗问题不要制造恐慌，统一使用“建议进一步专业评估”的表达。

---

## 5. 后台核心字段

建议至少保存：

```text
assessment_version
user_id
created_at

age_range
life_stage
parity
delivery_type
height_cm
weight_kg
waist_cm
hip_cm
body_fat_pct

bmi
bmi_level
waist_level
whr
body_shape
body_concerns[]

posture_tags[]
breath_pattern
breath_holding

pelvic_answers{}
pelvic_weakness_score
pelvic_tension_score
pelvic_coordination_score
pelvic_pattern
impact_score

red_flags[]
risk_level

primary_recommendation
secondary_recommendation
advisor_required
professional_evaluation_recommended

user_tags[]
```

---

## 6. 接口建议

### POST /api/assessment/v1/submit

请求：

```json
{
  "assessmentVersion": "1.0.0",
  "userId": "USER_001",
  "answers": {
    "...": "..."
  }
}
```

返回：

```json
{
  "assessmentVersion": "1.0.0",
  "riskLevel": "YELLOW",
  "bodyProfile": {
    "composition": "腰腹脂肪偏集中",
    "shape": "H型｜腰臀曲线不足",
    "posture": ["肋骨外翻倾向", "核心支撑不足倾向"],
    "pelvicFloor": "收放协调不足型"
  },
  "priorityActions": [
    "重新学习呼吸",
    "恢复核心与盆底协同",
    "再进入腰腹臀曲线塑形"
  ],
  "recommendations": {
    "primary": {
      "id": "COURSE_POSTURE_CORE",
      "name": "呼吸核心与体态基础课"
    },
    "secondary": {
      "id": "COURSE_MORNING",
      "name": "元气女人晨练"
    }
  },
  "advisorRequired": false,
  "professionalEvaluationRecommended": false,
  "userTags": [
    "AGE_40_PLUS",
    "SHAPE_H",
    "CORE_SUPPORT_LOW",
    "PF_COORDINATION"
  ]
}
```

---

## 7. 结果页信息架构

### 我的澜心身体画像

四张卡：

- 身体成分
- 身体曲线
- 体态核心
- 盆底状态

### 你现在最值得先做的 3 件事

按优先级输出 3 条，不超过 3 条。

### 推荐路径

正常只显示：

- 主计划 1 个
- 辅助计划 1 个

### CTA

GREEN / YELLOW：
- 开始我的专属训练
- 咨询澜心健康顾问

ORANGE：
- 优先咨询澜心健康顾问
- 查看适合我的基础练习

RED：
- 建议先进行专业评估
- 查看安全说明

---

## 8. 安全边界

本测评为健康教育、运动与生活方式分流工具，不用于诊断、治疗或替代医生、盆底康复治疗师等专业人员的评估。

出现以下情况时，系统优先进入 RED：

- 原因不明的阴道异常出血；
- 血尿；
- 明显无法正常排尿；
- 明显阴道/盆腔器官脱出感；
- 持续或明显加重的盆腔/会阴疼痛；
- 明显粪便失禁；
- 其他由医学顾问后续加入的红旗情况。

孕期、产后 6 周以内以及近期手术恢复期不直接进入普通强化训练路径，应优先咨询专业人员或健康顾问。

---

## 9. IT 实现建议

建议采用：

```text
assessment.schema.json
        ↓
前端动态渲染问卷
        ↓
answers
        ↓
engine.ts
        ↓
scoring.config.json + recommendation-map.json
        ↓
result DTO
        ↓
结果页 + 用户标签数据库
```

优点：

1. 前端和算法解耦；
2. 课程名称或课程 ID 变化时，只改 recommendation-map.json；
3. 阈值变化时，只改 scoring.config.json；
4. 1.1、1.2 可以通过 assessmentVersion 保留历史数据；
5. 后续可以接入 A/B Test，而不破坏老数据。

---

## 10. 文件说明

- `assessment.schema.json`：题库、选项、跳题、字段定义
- `scoring.config.json`：评分阈值和红旗逻辑
- `recommendation-map.json`：推荐课程和 CTA 配置
- `engine.ts`：核心评分、画像、分流、推荐引擎
- `sample-input.json`：示例提交
- `sample-output.json`：示例结果
- `API_CONTRACT.md`：接口与数据库对接建议
