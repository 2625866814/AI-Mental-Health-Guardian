// 心理测评引擎 - 标准化量表实现

// PHQ-9 抑郁筛查量表
const PHQ9_QUESTIONS = [
  { id: 1, text: '做事时提不起劲或没有兴趣', category: 'interest' },
  { id: 2, text: '感到心情低落、沮丧或绝望', category: 'mood' },
  { id: 3, text: '入睡困难、睡不安稳或睡眠过多', category: 'sleep' },
  { id: 4, text: '感觉疲倦或没有活力', category: 'energy' },
  { id: 5, text: '食欲不振或吃太多', category: 'appetite' },
  { id: 6, text: '觉得自己很糟糕或觉得自己很失败，或让自己或家人失望', category: 'selfworth' },
  { id: 7, text: '对事物难以专注，如阅读报纸或看电视', category: 'concentration' },
  { id: 8, text: '动作或说话速度缓慢到别人已经觉察，或正好相反——Loss烦躁或坐立不安', category: 'psychomotor' },
  { id: 9, text: '有不如死掉或用某种方式伤害自己的念头', category: 'suicide' }
];

// GAD-7 焦虑筛查量表
const GAD7_QUESTIONS = [
  { id: 1, text: '感觉紧张、焦虑或急切', category: 'tension' },
  { id: 2, text: '不能够停止或控制担忧', category: 'worry' },
  { id: 3, text: '对各种各样的事情担忧过多', category: 'excessive_worry' },
  { id: 4, text: '很难放松下来', category: 'relaxation' },
  { id: 5, text: '由于不安而无法静坐', category: 'restlessness' },
  { id: 6, text: '变得容易烦恼或急躁', category: 'irritability' },
  { id: 7, text: '感到似乎将有可怕的事情发生', category: 'dread' }
];

// SCL-90 简化版 (保留核心题目)
const SCL90_CORE_QUESTIONS = [
  { id: 1, text: '头痛', category: 'somatization' },
  { id: 2, text: '神经过敏，心中不踏实', category: 'anxiety' },
  { id: 3, text: '头脑中有不必要的想法或字句盘旋', category: 'ocd' },
  { id: 4, text: '头晕或昏倒', category: 'somatization' },
  { id: 5, text: '对异性的兴趣减退', category: 'depression' },
  { id: 6, text: '对旁人责备求全', category: 'interpersonal' },
  { id: 7, text: '感到别人能控制您的思想', category: 'paranoid' },
  { id: 8, text: '责怪别人制造麻烦', category: 'hostility' },
  { id: 9, text: '忘记性大', category: 'depression' },
  { id: 10, text: '担心自己的衣饰整齐及仪态的端正', category: 'anxiety' },
  { id: 11, text: '容易烦恼和激动', category: 'hostility' },
  { id: 12, text: '胸痛', category: 'somatization' },
  { id: 13, text: '害怕空旷的场所或街道', category: 'phobia' },
  { id: 14, text: '感到自己的精力下降，活动减慢', category: 'depression' },
  { id: 15, text: '想结束自己的生命', category: 'depression' },
  { id: 16, text: '听到别人听不到的声音', category: 'psychoticism' },
  { id: 17, text: '发抖', category: 'somatization' },
  { id: 18, text: '感到大多数人都不可信任', category: 'paranoid' },
  { id: 19, text: '胃口不好', category: 'somatization' },
  { id: 20, text: '容易哭泣', category: 'depression' },
  { id: 21, text: '同异性相处时感到害羞不自在', category: 'interpersonal' },
  { id: 22, text: '感到受骗，中了圈套或有人想抓住您', category: 'paranoid' },
  { id: 23, text: '无缘无故地突然感到害怕', category: 'phobia' },
  { id: 24, text: '自己不能控制地大发脾气', category: 'hostility' },
  { id: 25, text: '怕单独出门', category: 'phobia' },
  { id: 26, text: '经常责怪自己', category: 'depression' },
  { id: 27, text: '腰痛', category: 'somatization' },
  { id: 28, text: '感到难以完成任务', category: 'depression' },
  { id: 29, text: '感到孤独', category: 'depression' },
  { id: 30, text: '感到苦闷', category: 'depression' },
  { id: 31, text: '过分担忧', category: 'anxiety' },
  { id: 32, text: '对事物不感兴趣', category: 'depression' },
  { id: 33, text: '感到害怕', category: 'phobia' },
  { id: 34, text: '您的感情容易受到伤害', category: 'interpersonal' },
  { id: 35, text: '旁人能知道您的私下想法', category: 'paranoid' },
  { id: 36, text: '感到别人不理解您、不同情您', category: 'interpersonal' },
  { id: 37, text: '感到人们对您不友好，不喜欢您', category: 'interpersonal' },
  { id: 38, text: '做事必须做得很慢以保证做得正确', category: 'ocd' },
  { id: 39, text: '心跳得很厉害', category: 'somatization' },
  { id: 40, text: '恶心或胃部不舒服', category: 'somatization' },
  { id: 41, text: '肌肉酸痛', category: 'somatization' },
  { id: 42, text: '感到周围的事物都很陌生', category: 'psychoticism' },
  { id: 43, text: '感到要赶快把事情做完', category: 'anxiety' },
  { id: 44, text: '不能集中注意力', category: 'depression' },
  { id: 45, text: '感到身体的某一部分软弱无力', category: 'somatization' },
  { id: 46, text: '感到紧张或被激怒', category: 'anxiety' },
  { id: 47, text: '感到手或脚发重', category: 'somatization' },
  { id: 48, text: '感到死亡的恐惧', category: 'phobia' },
  { id: 49, text: '吃得太多', category: 'somatization' },
  { id: 50, text: '当别人想到您时感到不愉快', category: 'interpersonal' },
  { id: 51, text: '入睡困难', category: 'sleep' },
  { id: 52, text: '做事必须反复检查', category: 'ocd' },
  { id: 53, text: '难以作出决定', category: 'depression' },
  { id: 54, text: '怕乘电车、公共汽车、地铁或火车', category: 'phobia' },
  { id: 55, text: '呼吸有困难', category: 'somatization' },
  { id: 56, text: '感到一阵阵发冷或发热', category: 'somatization' },
  { id: 57, text: '因为感到害怕而避开某些东西、场合或活动', category: 'phobia' },
  { id: 58, text: '感到身体的某一部分有异样感', category: 'somatization' },
  { id: 59, text: '感到自己有罪', category: 'depression' },
  { id: 60, text: '感到自己的身体有严重问题', category: 'somatization' }
];

// 评分选项
const SCORE_OPTIONS = [
  { value: 0, label: '没有' },
  { value: 1, label: '有一点' },
  { value: 2, label: '中等程度' },
  { value: 3, label: '相当严重' },
  { value: 4, label: '非常严重' }
];

// PHQ-9 评分标准
function scorePHQ9(answers) {
  const totalScore = answers.reduce((sum, a) => sum + (a.score || 0), 0);
  
  let severity, riskLevel, interpretation;
  
  if (totalScore <= 4) {
    severity = 'minimal';
    riskLevel = 'low';
    interpretation = '没有或极轻微抑郁症状';
  } else if (totalScore <= 9) {
    severity = 'mild';
    riskLevel = 'low';
    interpretation = '轻微抑郁症状';
  } else if (totalScore <= 14) {
    severity = 'moderate';
    riskLevel = 'medium';
    interpretation = '中度抑郁症状';
  } else if (totalScore <= 19) {
    severity = 'moderately_severe';
    riskLevel = 'high';
    interpretation = '中重度抑郁症状';
  } else {
    severity = 'severe';
    riskLevel = 'critical';
    interpretation = '重度抑郁症状';
  }

  // 检查自杀风险 (第9题)
  const suicideItem = answers.find(a => a.questionId === 9);
  const suicideScore = suicideItem ? suicideItem.score : 0;
  let suicideRisk = 'none';
  if (suicideScore >= 3) suicideRisk = 'high';
  else if (suicideScore >= 2) suicideRisk = 'medium';
  else if (suicideScore >= 1) suicideRisk = 'low';

  // 维度分析
  const dimensions = {};
  PHQ9_QUESTIONS.forEach(q => {
    const answer = answers.find(a => a.questionId === q.id);
    if (answer) {
      if (!dimensions[q.category]) dimensions[q.category] = [];
      dimensions[q.category].push(answer.score);
    }
  });

  const dimensionScores = {};
  Object.entries(dimensions).forEach(([cat, scores]) => {
    dimensionScores[cat] = scores.reduce((a, b) => a + b, 0) / scores.length;
  });

  return {
    totalScore,
    severity,
    riskLevel,
    interpretation,
    suicideRisk,
    suicideScore,
    dimensions: dimensionScores,
    maxScore: 27
  };
}

// GAD-7 评分标准
function scoreGAD7(answers) {
  const totalScore = answers.reduce((sum, a) => sum + (a.score || 0), 0);
  
  let severity, riskLevel, interpretation;
  
  if (totalScore <= 4) {
    severity = 'minimal';
    riskLevel = 'low';
    interpretation = '没有或极轻微焦虑症状';
  } else if (totalScore <= 9) {
    severity = 'mild';
    riskLevel = 'low';
    interpretation = '轻微焦虑症状';
  } else if (totalScore <= 14) {
    severity = 'moderate';
    riskLevel = 'medium';
    interpretation = '中度焦虑症状';
  } else {
    severity = 'severe';
    riskLevel = 'high';
    interpretation = '重度焦虑症状';
  }

  // 维度分析
  const dimensions = {};
  GAD7_QUESTIONS.forEach(q => {
    const answer = answers.find(a => a.questionId === q.id);
    if (answer) {
      if (!dimensions[q.category]) dimensions[q.category] = [];
      dimensions[q.category].push(answer.score);
    }
  });

  const dimensionScores = {};
  Object.entries(dimensions).forEach(([cat, scores]) => {
    dimensionScores[cat] = scores.reduce((a, b) => a + b, 0) / scores.length;
  });

  return {
    totalScore,
    severity,
    riskLevel,
    interpretation,
    dimensions: dimensionScores,
    maxScore: 21
  };
}

// SCL-90 评分
function scoreSCL90(answers) {
  const categories = {
    somatization: [],
    anxiety: [],
    ocd: [],
    depression: [],
    interpersonal: [],
    paranoid: [],
    hostility: [],
    phobia: [],
    psychoticism: [],
    sleep: []
  };

  let totalScore = 0;
  let totalItems = 0;

  answers.forEach(answer => {
    const question = SCL90_CORE_QUESTIONS.find(q => q.id === answer.questionId);
    if (question && categories[question.category] !== undefined) {
      categories[question.category].push(answer.score);
      totalScore += answer.score;
      totalItems++;
    }
  });

  // 计算各维度分数
  const categoryScores = {};
  let maxCategoryScore = 0;
  let maxCategory = '';

  Object.keys(categories).forEach(cat => {
    const scores = categories[cat];
    if (scores.length > 0) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      categoryScores[cat] = avg;
      if (avg > maxCategoryScore) {
        maxCategoryScore = avg;
        maxCategory = cat;
      }
    } else {
      categoryScores[cat] = 0;
    }
  });

  // 总分标准化 (0-1)
  const normalizedScore = totalItems > 0 ? (totalScore / totalItems) / 4 : 0;

  // 风险等级
  let riskLevel = 'low';
  if (normalizedScore > 0.7) riskLevel = 'critical';
  else if (normalizedScore > 0.5) riskLevel = 'high';
  else if (normalizedScore > 0.3) riskLevel = 'medium';

  // 维度中文名映射
  const categoryNames = {
    somatization: '躯体化',
    anxiety: '焦虑',
    ocd: '强迫症状',
    depression: '抑郁',
    interpersonal: '人际关系敏感',
    paranoid: '偏执',
    hostility: '敌对',
    phobia: '恐怖',
    psychoticism: '精神病性',
    sleep: '睡眠障碍'
  };

  return {
    totalScore: normalizedScore,
    rawTotal: totalScore,
    categories: categoryScores,
    categoryNames,
    maxCategory: categoryNames[maxCategory] || maxCategory,
    maxCategoryScore,
    riskLevel,
    totalItems
  };
}

// 综合评估
function comprehensiveAssessment(scl90Answers, phq9Answers, gad7Answers, textAnalysis) {
  const results = {
    scl90: null,
    phq9: null,
    gad7: null,
    overallRisk: 'low',
    overallScore: 0,
    recommendations: [],
    summary: '',
    riskTier: null,          // 显式分层
    riskFactors: [],         // 可解释性：各源贡献
    sourceContributions: {}  // 各信息源贡献度
  };

  let riskScores = [];
  let sourceWeights = {};

  // SCL-90 评估
  if (scl90Answers && scl90Answers.length > 0) {
    results.scl90 = scoreSCL90(scl90Answers);
    riskScores.push({ source: 'scl90', score: results.scl90.totalScore, weight: 0.4 });
    sourceWeights.scl90 = 0.4;
  }

  // PHQ-9 评估
  if (phq9Answers && phq9Answers.length > 0) {
    results.phq9 = scorePHQ9(phq9Answers);
    riskScores.push({ source: 'phq9', score: results.phq9.totalScore / 27, weight: 0.3 });
    sourceWeights.phq9 = 0.3;
  }

  // GAD-7 评估
  if (gad7Answers && gad7Answers.length > 0) {
    results.gad7 = scoreGAD7(gad7Answers);
    riskScores.push({ source: 'gad7', score: results.gad7.totalScore / 21, weight: 0.2 });
    sourceWeights.gad7 = 0.2;
  }

  // 文本分析
  if (textAnalysis && textAnalysis.riskScore !== undefined) {
    riskScores.push({ source: 'text', score: textAnalysis.riskScore, weight: 0.1 });
    sourceWeights.text = 0.1;
  }

  // 计算综合风险分数（并归一化权重）
  if (riskScores.length > 0) {
    const totalWeight = riskScores.reduce((sum, r) => sum + r.weight, 0);
    results.overallScore = riskScores.reduce((sum, r) => sum + r.score * r.weight, 0) / totalWeight;

    // 各信息源贡献度（归一化后的实际贡献）
    riskScores.forEach(r => {
      const normalizedWeight = r.weight / totalWeight;
      results.sourceContributions[r.source] = {
        score: r.score,
        weight: normalizedWeight,
        contribution: r.score * normalizedWeight,
        percentage: (r.score * normalizedWeight / results.overallScore * 100).toFixed(1) + '%'
      };
      results.riskFactors.push({
        source: r.source,
        score: r.score,
        weight: normalizedWeight,
        contribution: r.score * normalizedWeight
      });
    });
  }

  // 确定综合风险等级
  if (results.overallScore > 0.7) results.overallRisk = 'critical';
  else if (results.overallScore > 0.5) results.overallRisk = 'high';
  else if (results.overallScore > 0.3) results.overallRisk = 'medium';

  // 检查自杀风险
  const hasSuicideRisk = (results.phq9 && results.phq9.suicideRisk !== 'none') ||
                          (textAnalysis && textAnalysis.hasCrisis);

  if (hasSuicideRisk) {
    results.overallRisk = 'critical';
    results.riskFactors.push({
      source: 'crisis_flag',
      score: 1,
      weight: 1,
      contribution: 1,
      desc: '自杀风险信号'
    });
  }

  // 生成显式风险分层
  results.riskTier = generateRiskTier(results.overallRisk, hasSuicideRisk, {
    scl90: results.scl90,
    phq9: results.phq9,
    gad7: results.gad7,
    textAnalysis
  });

  // 生成建议（基于分层）
  results.recommendations = results.recommendations.concat(
    generateAssessmentRecommendations(results)
  );

  // 生成摘要
  results.summary = generateAssessmentSummary(results);

  // 隐私声明
  results.privacyNotice = '本评估结果仅作为辅助筛查参考，不作为心理疾病诊断依据，结果不向第三方泄露';
  results.aiBoundary = 'AI辅助完成风险线索筛选，高风险判断与干预决策必须由专业人员完成';

  return results;
}

// 风险分层：基础筛查 → 需关注 → 人工复核 → 专业转介
function generateRiskTier(overallRisk, hasSuicideRisk, sources) {
  // 危机情况直接进入专业转介（最高级）
  if (hasSuicideRisk || overallRisk === 'critical') {
    return {
      level: 'professional_referral',  // 专业转介
      levelLabel: '专业转介',
      tier: 4,
      color: 'red',
      action: '立即专业介入',
      description: '检测到高风险信号，建议24小时内联系精神科医生或心理危机干预',
      nextStep: '专业人员评估+必要时启动危机干预流程',
      resources: [
        { type: 'hotline', name: '心理危机干预热线', contact: '400-161-9995' },
        { type: 'professional', name: '精神科医生/心理咨询师', action: '立即转介' }
      ],
      aiBoundary: 'AI仅完成风险线索识别，高风险判断与干预决策必须由专业人员完成'
    };
  }

  // 高风险：人工复核级
  if (overallRisk === 'high') {
    return {
      level: 'manual_review',  // 人工复核
      levelLabel: '人工复核',
      tier: 3,
      color: 'orange',
      action: '人工复核+专业关注',
      description: 'AI筛查显示需要关注的风险信号，建议由心理教师在3个工作日内复核',
      nextStep: '人工访谈确认+评估是否需要进一步专业服务',
      resources: [
        { type: 'counselor', name: '心理教师/咨询师', action: '3个工作日内复核' }
      ],
      aiBoundary: 'AI辅助风险线索筛选，人工复核后决定是否升级或解除'
    };
  }

  // 中风险：需关注级
  if (overallRisk === 'medium') {
    return {
      level: 'attention_needed',  // 需关注
      levelLabel: '需关注',
      tier: 2,
      color: 'yellow',
      action: '持续关注+自助资源',
      description: '存在轻微心理困扰，建议持续观察并在2周后复评',
      nextStep: '提供自助练习/科普内容+2周后复评',
      resources: [
        { type: 'self_help', name: '情绪日记+放松练习', action: '推荐' },
        { type: 'follow_up', name: '2周复评', action: '系统提醒' }
      ],
      aiBoundary: 'AI提供状态提示与自助资源，不形成诊断结论'
    };
  }

  // 低风险：基础筛查级
  return {
    level: 'basic_screening',  // 基础筛查
    levelLabel: '基础筛查',
    tier: 1,
    color: 'green',
    action: '日常关注',
    description: '当前心理健康状况良好，建议保持定期筛查节奏',
    nextStep: '按周期（如每月/每学期）完成常规筛查',
    resources: [
      { type: 'education', name: '心理健康科普', action: '定期推送' }
    ],
    aiBoundary: 'AI完成基础筛查，无明显风险信号'
  };
}

function generateAssessmentRecommendations(results) {
  const recommendations = [];

  // 基于风险分层生成建议
  if (results.riskTier) {
    switch (results.riskTier.level) {
      case 'professional_referral':
        recommendations.push({
          priority: 'urgent',
          action: '立即专业转介',
          description: '检测到高风险信号，建议24小时内联系精神科医生或拨打心理危机干预热线：400-161-9995',
          tier: 'professional_referral',
          responsible: '专业人员'
        });
        break;
      case 'manual_review':
        recommendations.push({
          priority: 'high',
          action: '人工复核',
          description: 'AI筛查显示需要关注的风险信号，建议由心理教师在3个工作日内完成人工复核',
          tier: 'manual_review',
          responsible: '心理教师/咨询师'
        });
        break;
      case 'attention_needed':
        recommendations.push({
          priority: 'medium',
          action: '持续关注+自助资源',
          description: '存在轻微心理困扰，建议持续观察情绪变化，使用自助练习资源，2周后复评',
          tier: 'attention_needed',
          responsible: 'AI辅助+自我管理'
        });
        break;
      case 'basic_screening':
        recommendations.push({
          priority: 'low',
          action: '保持良好状态',
          description: '当前心理健康状况良好，建议保持定期筛查节奏与积极生活方式',
          tier: 'basic_screening',
          responsible: '自我管理'
        });
        break;
    }
  } else {
    // 兼容未生成 riskTier 的旧调用
    if (results.overallRisk === 'critical') {
      recommendations.push({
        priority: 'high',
        action: '立即寻求专业帮助',
        description: '建议立即联系精神科医生或心理咨询师进行专业评估'
      });
    } else if (results.overallRisk === 'high') {
      recommendations.push({
        priority: 'medium',
        action: '预约心理咨询',
        description: '建议在1-2周内预约专业心理咨询师'
      });
    }
  }

  // 针对特定维度的建议
  if (results.scl90) {
    const topCategories = Object.entries(results.scl90.categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2);

    topCategories.forEach(([cat, score]) => {
      if (score > 2) {
        const catAdvice = {
          depression: '建议关注情绪变化，尝试增加户外活动和社交',
          anxiety: '建议学习放松技巧，如深呼吸、正念冥想',
          somatization: '建议关注身体健康，必要时进行体检',
          interpersonal: '建议参加社交技能训练或团体活动',
          ocd: '建议学习认知行为技巧，减少强迫行为',
          sleep: '建议调整作息规律，改善睡眠环境'
        };
        if (catAdvice[cat]) {
          recommendations.push({
            priority: 'low',
            action: `针对${results.scl90.categoryNames[cat]}的建议`,
            description: catAdvice[cat]
          });
        }
      }
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'low',
      action: '保持良好状态',
      description: '您的心理健康状况良好，请继续保持积极的生活方式'
    });
  }

  return recommendations;
}

function generateAssessmentSummary(results) {
  const parts = [];

  if (results.scl90) {
    parts.push(`SCL-90总分${Math.round(results.scl90.totalScore * 100)}%`);
  }
  if (results.phq9) {
    parts.push(`PHQ-9: ${results.phq9.interpretation}`);
  }
  if (results.gad7) {
    parts.push(`GAD-7: ${results.gad7.interpretation}`);
  }

  // 优先使用分层标签
  if (results.riskTier) {
    parts.push(`风险分层：${results.riskTier.levelLabel}`);
    return `${parts.join('；')}。${results.riskTier.description}。`;
  }

  // 兼容旧版
  const riskText = {
    critical: '存在较高心理风险，建议立即寻求专业帮助',
    high: '心理健康需要关注，建议预约专业咨询',
    medium: '有轻微心理困扰，建议调整生活方式',
    low: '心理健康状况良好'
  };

  return `${parts.join('；')}。${riskText[results.overallRisk]}。`;
}

// 获取量表题目
function getQuestions(scale) {
  switch (scale) {
    case 'phq9':
      return { questions: PHQ9_QUESTIONS, options: SCORE_OPTIONS };
    case 'gad7':
      return { questions: GAD7_QUESTIONS, options: SCORE_OPTIONS };
    case 'scl90':
      return { questions: SCL90_CORE_QUESTIONS, options: SCORE_OPTIONS };
    default:
      return null;
  }
}

module.exports = {
  scorePHQ9,
  scoreGAD7,
  scoreSCL90,
  comprehensiveAssessment,
  getQuestions,
  PHQ9_QUESTIONS,
  GAD7_QUESTIONS,
  SCL90_CORE_QUESTIONS,
  SCORE_OPTIONS
};
