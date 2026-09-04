export type RiskLevel = "GREEN" | "YELLOW" | "ORANGE" | "RED";
export type PelvicPattern =
  | "BALANCED"
  | "WEAKNESS"
  | "TENSION"
  | "COORDINATION"
  | "MIXED";

export interface AssessmentAnswers {
  ageRange: string;
  lifeStage: string;
  parity?: string;
  deliveryType?: string[];
  heightCm: number;
  weightKg: number;
  waistCm: number;
  hipCm: number;
  bodyFatKnown?: "YES" | "NO";
  bodyFatPct?: number;

  bodyShape: "A" | "H" | "O" | "V" | "X";
  bodyConcerns: string[];

  postureTags: string[];
  breathPattern: string;
  breathHolding: string;

  pf01StressLeak: number;
  pf02Urgency: number;
  pf03Nocturia: number;
  pf04VoidingDifficulty: number;
  pf05Heaviness: number;
  pf06ProlapseSensation: number;
  pf07ConstipationStrain: number;
  pf08BowelControl: number;
  pf09PelvicPain: number;
  pf10InsertionPain: number;
  pf11ContractionSense: number;
  pf12RelaxSense: number;
  pf13Compensation: string[];
  pf14Endurance: number;
  impactScore: number;

  redFlags: string[];
  primaryGoal: string;
}

export interface Recommendation {
  id: string;
  name: string;
}

export interface AssessmentResult {
  assessmentVersion: "1.0.0";
  riskLevel: RiskLevel;
  bodyProfile: {
    composition: string;
    shape: string;
    posture: string[];
    pelvicFloor: string;
  };
  metrics: {
    bmi: number;
    bmiLevel: string;
    waistLevel: string;
    whr: number;
    whrLevel: string;
    bodyFatLevel?: string;
    pelvicWeaknessScore: number;
    pelvicTensionScore: number;
    pelvicCoordinationScore: number;
  };
  priorityActions: string[];
  recommendations: {
    primary: Recommendation | null;
    secondary: Recommendation | null;
  };
  advisorRequired: boolean;
  professionalEvaluationRecommended: boolean;
  userTags: string[];
}

const COURSE = {
  MORNING: { id: "COURSE_MORNING", name: "元气女人晨练" },
  MAGIC_ABS: { id: "COURSE_MAGIC_ABS", name: "魔力腹·腰腹核心计划" },
  CURVE: { id: "COURSE_CURVE", name: "双C腰 × M蜜桃臀曲线计划" },
  POSTURE_CORE: { id: "COURSE_POSTURE_CORE", name: "呼吸核心与体态基础课" },
  PF_SUPPORT: { id: "COURSE_PF_SUPPORT", name: "盆底唤醒与支撑训练" },
  PF_RELAX: { id: "COURSE_PF_RELAX", name: "盆底放松 × 呼吸协调基础" },
  ADVISOR: { id: "ADVISOR_BODY_CONSULT", name: "澜心健康顾问身体咨询" },
  PROFESSIONAL: { id: "PROFESSIONAL_EVALUATION", name: "专业医疗/盆底康复评估" },
};

function round(value: number, digits = 2): number {
  const m = Math.pow(10, digits);
  return Math.round(value * m) / m;
}

function getBmiLevel(bmi: number): string {
  if (bmi < 18.5) return "LOW";
  if (bmi < 24) return "REFERENCE";
  if (bmi < 28) return "OVERWEIGHT";
  return "HIGH";
}

function getWaistLevel(waistCm: number): string {
  if (waistCm < 80) return "REFERENCE";
  if (waistCm < 85) return "INCREASED";
  return "HIGH";
}

function getWhrLevel(whr: number): string {
  return whr < 0.85 ? "REFERENCE" : "HIGH";
}

function getBodyFatLevel(ageRange: string, pct?: number): string | undefined {
  if (pct == null) return undefined;

  if (["LT25", "25_29", "30_34", "35_39"].includes(ageRange)) {
    if (pct < 21) return "LOW";
    if (pct < 33) return "REFERENCE";
    return "HIGH";
  }

  if (["40_44", "45_49", "50_59"].includes(ageRange)) {
    if (pct < 23) return "LOW";
    if (pct < 34) return "REFERENCE";
    return "HIGH";
  }

  if (pct < 24) return "LOW";
  if (pct < 36) return "REFERENCE";
  return "HIGH";
}

function weighted(answers: AssessmentAnswers, map: Record<string, number>): number {
  let score = 0;
  for (const [field, weight] of Object.entries(map)) {
    const value = Number((answers as any)[field] ?? 0);
    score += value * weight;
  }
  return round(score, 2);
}

function pelvicScores(a: AssessmentAnswers) {
  const weakness = weighted(a, {
    pf01StressLeak: 1,
    pf02Urgency: 0.5,
    pf05Heaviness: 0.75,
    pf11ContractionSense: 1,
    pf14Endurance: 1,
  });

  const tension = weighted(a, {
    pf04VoidingDifficulty: 1,
    pf07ConstipationStrain: 0.75,
    pf09PelvicPain: 1.25,
    pf10InsertionPain: 1.25,
    pf12RelaxSense: 1.25,
  });

  let coordination = weighted(a, {
    pf11ContractionSense: 1,
    pf12RelaxSense: 1,
    pf14Endurance: 0.5,
  });

  const compensation = (a.pf13Compensation || []).filter(
    (x) => !["NONE"].includes(x)
  ).length;

  coordination = round(coordination + compensation, 2);

  return { weakness, tension, coordination };
}

function getPelvicPattern(scores: {
  weakness: number;
  tension: number;
  coordination: number;
}): PelvicPattern {
  const weak = scores.weakness >= 4;
  const tense = scores.tension >= 4;
  const coord = scores.coordination >= 3;

  if (weak && tense) return "MIXED";
  if (tense) return "TENSION";
  if (weak) return "WEAKNESS";
  if (coord) return "COORDINATION";
  return "BALANCED";
}

function hasHardRedFlag(a: AssessmentAnswers): boolean {
  const flags = new Set(a.redFlags || []);
  const hardFlags = [
    "UNEXPLAINED_BLEEDING",
    "HEMATURIA",
    "URINARY_RETENTION",
    "VISIBLE_PROLAPSE",
    "SEVERE_PERSISTENT_PAIN",
    "FECAL_INCONTINENCE",
  ];

  return (
    hardFlags.some((x) => flags.has(x)) ||
    a.pf06ProlapseSensation >= 3 ||
    a.pf08BowelControl >= 3 ||
    a.pf09PelvicPain >= 3 ||
    a.pf10InsertionPain >= 3
  );
}

function getRiskLevel(a: AssessmentAnswers, pelvic: PelvicPattern): RiskLevel {
  if (hasHardRedFlag(a)) return "RED";

  const flags = new Set(a.redFlags || []);
  if (
    ["PREGNANT", "POSTPARTUM_LT6W"].includes(a.lifeStage) ||
    flags.has("RECENT_SURGERY") ||
    a.impactScore >= 7 ||
    ["TENSION", "MIXED"].includes(pelvic)
  ) {
    return "ORANGE";
  }

  if (
    ["WEAKNESS", "COORDINATION"].includes(pelvic) ||
    a.impactScore >= 4
  ) {
    return "YELLOW";
  }

  return "GREEN";
}

function postureProfile(a: AssessmentAnswers): string[] {
  const result: string[] = [];

  const tags = new Set(a.postureTags || []);

  if (tags.has("ROUNDED_SHOULDERS")) result.push("圆肩/含胸倾向");
  if (tags.has("RIB_FLARE")) result.push("肋骨外翻倾向");
  if (tags.has("ANTERIOR_PELVIC_TILT_TENDENCY")) result.push("骨盆前倾倾向");
  if (tags.has("PELVIC_ASYMMETRY")) result.push("左右骨盆不对称倾向");
  if (tags.has("ABDOMEN_PROTRUSION")) result.push("小腹前突倾向");

  if (
    ["CHEST", "SHOULDERS", "UNSURE"].includes(a.breathPattern) ||
    ["OFTEN", "SOMETIMES"].includes(a.breathHolding)
  ) {
    result.push("呼吸与核心协同不足倾向");
  }

  return result.length ? result : ["整体体态暂无明显高优先级问题"];
}

function compositionProfile(
  bmiLevel: string,
  waistLevel: string,
  whrLevel: string,
  a: AssessmentAnswers
): string {
  if (waistLevel === "HIGH" || whrLevel === "HIGH" || a.bodyShape === "O") {
    return "腰腹脂肪偏集中";
  }
  if (bmiLevel === "LOW") return "体重偏低，建议优先关注肌肉与营养";
  if (bmiLevel === "OVERWEIGHT" || bmiLevel === "HIGH") return "建议优先改善身体成分与肌肉比例";
  return "身体成分处于日常管理范围";
}

function shapeProfile(a: AssessmentAnswers): string {
  const map: Record<string, string> = {
    A: "A型｜下身集中型",
    H: "H型｜直线型",
    O: "O型｜腰腹集中型",
    V: "V型｜上宽下窄型",
    X: "X型｜曲线型",
  };
  return map[a.bodyShape] || "未分类";
}

function pelvicLabel(pattern: PelvicPattern): string {
  const map: Record<PelvicPattern, string> = {
    BALANCED: "平衡/维持型",
    WEAKNESS: "偏弱型",
    TENSION: "偏紧张型",
    COORDINATION: "收放协调不足型",
    MIXED: "混合型",
  };
  return map[pattern];
}

function chooseRecommendations(
  a: AssessmentAnswers,
  risk: RiskLevel,
  pelvic: PelvicPattern,
  posture: string[],
  waistLevel: string,
  whrLevel: string
): { primary: Recommendation | null; secondary: Recommendation | null } {
  if (risk === "RED") {
    return { primary: COURSE.PROFESSIONAL, secondary: null };
  }

  if (risk === "ORANGE") {
    if (pelvic === "TENSION" || pelvic === "MIXED") {
      return { primary: COURSE.ADVISOR, secondary: COURSE.PF_RELAX };
    }
    return { primary: COURSE.ADVISOR, secondary: COURSE.POSTURE_CORE };
  }

  if (pelvic === "TENSION") {
    return { primary: COURSE.PF_RELAX, secondary: COURSE.MORNING };
  }

  if (pelvic === "MIXED") {
    return { primary: COURSE.ADVISOR, secondary: COURSE.PF_RELAX };
  }

  if (pelvic === "WEAKNESS") {
    return { primary: COURSE.PF_SUPPORT, secondary: COURSE.POSTURE_CORE };
  }

  if (pelvic === "COORDINATION") {
    return { primary: COURSE.POSTURE_CORE, secondary: COURSE.MORNING };
  }

  const postureNeeds = posture.some((x) => !x.includes("暂无明显"));
  if (postureNeeds || a.primaryGoal === "POSTURE") {
    return { primary: COURSE.POSTURE_CORE, secondary: COURSE.MORNING };
  }

  const waistFocus =
    waistLevel !== "REFERENCE" ||
    whrLevel === "HIGH" ||
    a.bodyShape === "O" ||
    a.bodyConcerns.includes("LOWER_ABDOMEN") ||
    a.bodyConcerns.includes("WAIST") ||
    a.primaryGoal === "WAIST_ABS";

  if (waistFocus) {
    return { primary: COURSE.MAGIC_ABS, secondary: COURSE.MORNING };
  }

  const curveFocus =
    ["H", "V"].includes(a.bodyShape) ||
    a.bodyConcerns.includes("FLAT_GLUTES") ||
    a.bodyConcerns.includes("SAGGING_GLUTES") ||
    a.primaryGoal === "CURVES";

  if (curveFocus) {
    return { primary: COURSE.CURVE, secondary: COURSE.MORNING };
  }

  return { primary: COURSE.MORNING, secondary: null };
}

function buildPriorityActions(
  risk: RiskLevel,
  pelvic: PelvicPattern,
  posture: string[],
  a: AssessmentAnswers
): string[] {
  if (risk === "RED") {
    return [
      "先暂停自行强化训练",
      "优先完成专业医疗或盆底康复评估",
      "明确安全范围后再制定训练计划",
    ];
  }

  if (risk === "ORANGE") {
    return [
      "先确认当前身体状态与训练边界",
      "从呼吸、放松与基础协调开始",
      "再决定是否进入强化或塑形训练",
    ];
  }

  if (pelvic === "TENSION" || pelvic === "MIXED") {
    return [
      "先学习盆底放松",
      "恢复呼吸与盆底协同",
      "再进入力量强化",
    ];
  }

  if (pelvic === "WEAKNESS" || pelvic === "COORDINATION") {
    return [
      "重新学习呼吸",
      "恢复核心与盆底协同",
      "逐步建立支撑与耐力",
    ];
  }

  if (posture.length && !posture[0].includes("暂无明显")) {
    return [
      "优化呼吸模式",
      "恢复核心与骨盆稳定",
      "再进入腰腹臀曲线塑形",
    ];
  }

  return [
    "保持规律训练",
    "提高肌肉与核心参与",
    "持续观察身体反馈",
  ];
}

function buildTags(
  a: AssessmentAnswers,
  pelvic: PelvicPattern,
  risk: RiskLevel,
  bmiLevel: string,
  waistLevel: string
): string[] {
  const tags: string[] = [];

  if (["40_44", "45_49", "50_59", "60_PLUS"].includes(a.ageRange)) {
    tags.push("AGE_40_PLUS");
  } else if (["30_34", "35_39"].includes(a.ageRange)) {
    tags.push("AGE_30_PLUS");
  }

  tags.push(`LIFE_${a.lifeStage}`);
  tags.push(`SHAPE_${a.bodyShape}`);
  tags.push(`BMI_${bmiLevel}`);
  tags.push(`WAIST_${waistLevel}`);
  tags.push(`PF_${pelvic}`);
  tags.push(`RISK_${risk}`);

  if (a.breathHolding === "OFTEN") tags.push("BREATH_HOLDING");
  if (a.postureTags.includes("RIB_FLARE")) tags.push("RIB_FLARE");
  if (a.postureTags.includes("ABDOMEN_PROTRUSION")) tags.push("ABDOMEN_PROTRUSION");

  return Array.from(new Set(tags));
}

export function evaluateAssessment(a: AssessmentAnswers): AssessmentResult {
  const heightM = a.heightCm / 100;
  const bmi = round(a.weightKg / (heightM * heightM), 1);
  const whr = round(a.waistCm / a.hipCm, 2);

  const bmiLevel = getBmiLevel(bmi);
  const waistLevel = getWaistLevel(a.waistCm);
  const whrLevel = getWhrLevel(whr);
  const bodyFatLevel = getBodyFatLevel(a.ageRange, a.bodyFatPct);

  const scores = pelvicScores(a);
  const pelvic = getPelvicPattern(scores);
  const risk = getRiskLevel(a, pelvic);

  const posture = postureProfile(a);
  const recommendations = chooseRecommendations(
    a,
    risk,
    pelvic,
    posture,
    waistLevel,
    whrLevel
  );

  return {
    assessmentVersion: "1.0.0",
    riskLevel: risk,
    bodyProfile: {
      composition: compositionProfile(bmiLevel, waistLevel, whrLevel, a),
      shape: shapeProfile(a),
      posture,
      pelvicFloor: pelvicLabel(pelvic),
    },
    metrics: {
      bmi,
      bmiLevel,
      waistLevel,
      whr,
      whrLevel,
      bodyFatLevel,
      pelvicWeaknessScore: scores.weakness,
      pelvicTensionScore: scores.tension,
      pelvicCoordinationScore: scores.coordination,
    },
    priorityActions: buildPriorityActions(risk, pelvic, posture, a),
    recommendations,
    advisorRequired: ["ORANGE"].includes(risk) || pelvic === "MIXED",
    professionalEvaluationRecommended: risk === "RED",
    userTags: buildTags(a, pelvic, risk, bmiLevel, waistLevel),
  };
}
