// 数据分析引擎 - 情绪趋势、行为模式、综合报告

const { Op } = require('sequelize');
const { generatePrivacyNotice } = require('../middleware/privacy');

// 情绪趋势分析
function analyzeEmotionTrend(emotionHistory, days = 30) {
  if (!emotionHistory || emotionHistory.length === 0) {
    return {
      trend: 'insufficient_data',
      averageScore: 0.5,
      volatility: 0,
      dataPoints: 0
    };
  }

  // 按日期分组
  const dailyScores = {};
  emotionHistory.forEach(entry => {
    const date = entry.date || new Date(entry.createdAt).toISOString().split('T')[0];
    if (!dailyScores[date]) dailyScores[date] = [];
    dailyScores[date].push(entry.score || 0.5);
  });

  // 计算每日平均分
  const dailyAverages = Object.entries(dailyScores).map(([date, scores]) => ({
    date,
    score: scores.reduce((a, b) => a + b, 0) / scores.length
  })).sort((a, b) => a.date.localeCompare(b.date));

  if (dailyAverages.length < 2) {
    return {
      trend: 'insufficient_data',
      averageScore: dailyAverages[0]?.score || 0.5,
      volatility: 0,
      dataPoints: dailyAverages.length
    };
  }

  // === 计算个体基线 ===
  // 基线 = 历史30天内的中位数 + 标准差，作为该个体的"正常状态"参考
  // 不同于统一阈值，个体基线降低统一标准对不同用户产生的误差
  const baseline = calculateIndividualBaseline(dailyAverages);

  // 计算整体统计
  const allScores = dailyAverages.map(d => d.score);
  const averageScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;

  // 计算波动性 (标准差)
  const variance = allScores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / allScores.length;
  const volatility = Math.sqrt(variance);

  // 计算趋势 (线性回归斜率)
  const n = dailyAverages.length;
  const xMean = (n - 1) / 2;
  const yMean = averageScore;

  let numerator = 0;
  let denominator = 0;
  dailyAverages.forEach((d, i) => {
    numerator += (i - xMean) * (d.score - yMean);
    denominator += Math.pow(i - xMean, 2);
  });

  const slope = denominator !== 0 ? numerator / denominator : 0;

  // 确定趋势类型
  let trend = 'stable';
  if (slope > 0.01) trend = 'improving';
  else if (slope < -0.01) trend = 'declining';

  // 检测异常点（基于个体基线，而非统一阈值）
  const anomalies = [];
  // 使用个体基线的标准差作为异常判定阈值
  // 偏离基线超过2σ视为异常
  const threshold = baseline.stdDev * 2;
  dailyAverages.forEach((d, i) => {
    if (i > 0) {
      // 与个体基线对比
      const deviationFromBaseline = d.score - baseline.median;
      const change = Math.abs(d.score - dailyAverages[i - 1].score);
      // 异常条件：偏离基线2σ 或 日间变化超过2σ
      if (Math.abs(deviationFromBaseline) > threshold || change > threshold) {
        anomalies.push({
          date: d.date,
          score: d.score,
          change: d.score - dailyAverages[i - 1].score,
          deviationFromBaseline: deviationFromBaseline.toFixed(3),
          baselineType: deviationFromBaseline < -threshold ? 'below_baseline' : 'above_baseline',
          severity: Math.abs(deviationFromBaseline) > threshold * 1.5 ? 'high' : 'medium'
        });
      }
    }
  });

  // 最近7天趋势
  const recent7 = dailyAverages.slice(-7);
  const recentAvg = recent7.reduce((sum, d) => sum + d.score, 0) / recent7.length;

  // 最近7天vs之前
  const previous = dailyAverages.slice(-14, -7);
  const previousAvg = previous.length > 0
    ? previous.reduce((sum, d) => sum + d.score, 0) / previous.length
    : averageScore;

  let recentTrend = 'stable';
  if (recentAvg > previousAvg + 0.1) recentTrend = 'improving';
  else if (recentAvg < previousAvg - 0.1) recentTrend = 'declining';

  // 当前状态相对个体基线的偏离
  const currentDeviation = recentAvg - baseline.median;
  const deviationLevel = Math.abs(currentDeviation) > threshold ? 'significant' :
                         Math.abs(currentDeviation) > baseline.stdDev ? 'moderate' : 'normal';

  return {
    trend,
    recentTrend,
    averageScore,
    recentAverage: recentAvg,
    volatility,
    slope,
    dataPoints: n,
    anomalies,
    dailyAverages,
    minScore: Math.min(...allScores),
    maxScore: Math.max(...allScores),
    // 个体基线信息
    individualBaseline: baseline,
    baselineDeviation: {
      current: recentAvg,
      baseline: baseline.median,
      deviation: currentDeviation.toFixed(3),
      level: deviationLevel,
      interpretation: deviationLevel === 'significant' ?
        `当前情绪显著偏离个体基线(${(baseline.median * 100).toFixed(0)}%)，需重点关注` :
        deviationLevel === 'moderate' ?
        `当前情绪中度偏离个体基线，建议持续观察` :
        `当前情绪在个体基线范围内，状态正常`
    }
  };
}

// 计算个体基线（基于历史数据的中位数+标准差）
// 不同于统一固定标准，个体基线降低统一标准对不同用户产生的误差
function calculateIndividualBaseline(dailyAverages) {
  if (!dailyAverages || dailyAverages.length === 0) {
    return {
      median: 0.5,
      mean: 0.5,
      stdDev: 0.1,
      min: 0.5,
      max: 0.5,
      sampleSize: 0,
      established: false
    };
  }

  const scores = dailyAverages.map(d => d.score).sort((a, b) => a - b);
  const n = scores.length;

  // 中位数（对异常值更鲁棒）
  const median = n % 2 === 0
    ? (scores[n / 2 - 1] + scores[n / 2]) / 2
    : scores[Math.floor(n / 2)];

  // 均值
  const mean = scores.reduce((a, b) => a + b, 0) / n;

  // 标准差
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  // 四分位距（IQR）用于识别个体正常波动范围
  const q1 = scores[Math.floor(n * 0.25)];
  const q3 = scores[Math.floor(n * 0.75)];
  const iqr = q3 - q1;

  // 基线建立条件：至少需要7天数据才能建立稳定基线
  const established = n >= 7;

  return {
    median,
    mean,
    stdDev: stdDev || 0.05, // 避免为0
    min: scores[0],
    max: scores[n - 1],
    q1,
    q3,
    iqr,
    sampleSize: n,
    established,
    // 基线区间（中位数±1σ）
    normalRange: {
      lower: Math.max(0, median - stdDev),
      upper: Math.min(1, median + stdDev)
    },
    // 未建立基线时的提示
    note: established ? null : '个体基线数据不足（需≥7天），当前使用临时基线，准确度有限'
  };
}

// 行为模式分析
function analyzeBehaviorPatterns(behaviorData) {
  if (!behaviorData || behaviorData.length === 0) {
    return {
      patterns: [],
      insights: [],
      riskFactors: []
    };
  }

  const patterns = [];
  const insights = [];
  const riskFactors = [];

  // 分析登录频率
  const loginData = behaviorData.filter(b => b.dataType === 'login_frequency');
  if (loginData.length > 0) {
    const avgLogins = loginData.reduce((sum, d) => sum + (d.dataValue?.count || 0), 0) / loginData.length;
    if (avgLogins < 2) {
      patterns.push({ type: 'low_engagement', desc: '使用频率较低' });
      riskFactors.push('社交隔离倾向');
    } else if (avgLogins > 5) {
      patterns.push({ type: 'high_engagement', desc: '使用频率较高' });
    }
  }

  // 分析睡眠模式
  const sleepData = behaviorData.filter(b => b.dataType === 'sleep_pattern');
  if (sleepData.length > 0) {
    const avgSleep = sleepData.reduce((sum, d) => sum + (d.dataValue?.hours || 7), 0) / sleepData.length;
    if (avgSleep < 6) {
      patterns.push({ type: 'sleep_deprivation', desc: '睡眠不足' });
      riskFactors.push('睡眠问题');
      insights.push('建议保持每晚7-8小时的充足睡眠');
    } else if (avgSleep > 9) {
      patterns.push({ type: 'excessive_sleep', desc: '睡眠过多' });
      riskFactors.push('可能的抑郁症状');
    }
  }

  // 分析活动时间
  const activityData = behaviorData.filter(b => b.dataType === 'activity_time');
  if (activityData.length > 0) {
    const nightActivity = activityData.filter(d => {
      const hour = d.dataValue?.hour || 0;
      return hour >= 23 || hour <= 4;
    });
    
    if (nightActivity.length > activityData.length * 0.3) {
      patterns.push({ type: 'night_owl', desc: '夜间活动频繁' });
      insights.push('建议调整作息，减少夜间使用电子设备');
    }
  }

  // 生成洞察
  if (patterns.length === 0) {
    insights.push('您的行为模式正常，请继续保持');
  } else {
    patterns.forEach(p => {
      if (p.type === 'low_engagement') {
        insights.push('建议增加社交活动和户外运动');
      }
    });
  }

  return {
    patterns,
    insights,
    riskFactors,
    dataPoints: behaviorData.length
  };
}

// 生成综合报告
function generateComprehensiveReport(userId, testResults, diaryEntries, chatHistory, behaviorData) {
  const report = {
    userId,
    generatedAt: new Date().toISOString(),
    sections: {},
    overallRisk: 'low',
    overallScore: 0,
    summary: '',
    recommendations: []
  };

  // 1. 测评分析
  if (testResults && testResults.length > 0) {
    const latestTest = testResults[0];
    report.sections.assessment = {
      latestRiskLevel: latestTest.riskResult?.riskLevel || 'low',
      latestScore: latestTest.riskResult?.finalScore || 0,
      testCount: testResults.length,
      trend: calculateTestTrend(testResults)
    };
  }

  // 2. 情绪分析
  if (diaryEntries && diaryEntries.length > 0) {
    const emotionHistory = diaryEntries
      .filter(d => d.emotionAnalysis)
      .map(d => ({
        date: d.entryDate,
        score: d.emotionAnalysis.emotionScore || 0.5
      }));
    
    report.sections.emotion = analyzeEmotionTrend(emotionHistory);
  }

  // 3. 对话分析
  if (chatHistory && chatHistory.length > 0) {
    report.sections.interaction = {
      totalSessions: new Set(chatHistory.map(c => c.sessionId)).size,
      totalMessages: chatHistory.length,
      averageSessionLength: chatHistory.length / Math.max(1, new Set(chatHistory.map(c => c.sessionId)).size)
    };
  }

  // 4. 行为分析
  if (behaviorData && behaviorData.length > 0) {
    report.sections.behavior = analyzeBehaviorPatterns(behaviorData);
  }

  // 5. 一致性分析（多源信息冲突检测）
  report.sections.consistency = analyzeConsistency(report.sections);

  // 计算综合风险（含一致性影响）
  const riskScores = [];
  if (report.sections.assessment) {
    riskScores.push(report.sections.assessment.latestScore);
  }
  if (report.sections.emotion) {
    riskScores.push(1 - report.sections.emotion.averageScore);
  }
  if (report.sections.behavior) {
    riskScores.push(report.sections.behavior.riskFactors.length / 5);
  }

  if (riskScores.length > 0) {
    report.overallScore = riskScores.reduce((a, b) => a + b, 0) / riskScores.length;
  }

  // 一致性分析：信息源间显著不一致时小幅上调风险分（作为辅助线索）
  if (report.sections.consistency && report.sections.consistency.hasSignificantConflict) {
    report.overallScore = Math.min(1, report.overallScore + 0.05);
  }

  if (report.overallScore > 0.7) report.overallRisk = 'critical';
  else if (report.overallScore > 0.5) report.overallRisk = 'high';
  else if (report.overallScore > 0.3) report.overallRisk = 'medium';

  // 生成建议
  report.recommendations = generateReportRecommendations(report);

  // 生成可解释性分析
  report.explainability = generateExplainability(report);

  // 生成摘要
  report.summary = generateReportSummary(report);

  // 隐私声明
  report.privacyNotice = generatePrivacyNotice('report');
  report.dataHandling = {
    deidentification: '报告中涉及身份的信息已按最小必要原则处理',
    accessControl: '本报告访问受角色权限控制，重要操作已留痕审计',
    aiBoundary: 'AI分析结果仅作为辅助筛查参考，不作为心理疾病诊断依据',
    retention: '原始数据存储遵循最小化原则，敏感原始数据不长期保存'
  };

  return report;
}

// 可解释性分析：展示各信息源贡献度、置信度、关键影响因素
function generateExplainability(report) {
  const explainability = {
    riskScore: report.overallScore,
    riskLevel: report.overallRisk,
    confidence: 'medium',
    sources: [],
    keyFactors: [],
    trendNote: null,
    consistencyNote: null,
    interpretation: ''
  };

  // 各信息源贡献度
  const sourceLabels = {
    assessment: '量表测评',
    emotion: '文本情绪',
    behavior: '行为模式',
    interaction: '对话交互'
  };

  // 计算各信息源对综合风险的贡献
  const sourceRisks = [];
  if (report.sections.assessment) {
    const risk = report.sections.assessment.latestScore || 0;
    sourceRisks.push({ source: 'assessment', label: '量表测评', risk, weight: 1 / (sourceRisks.length + 1) });
  }
  if (report.sections.emotion && report.sections.emotion.averageScore !== undefined) {
    const risk = 1 - (report.sections.emotion.averageScore || 0.5);
    sourceRisks.push({ source: 'emotion', label: '文本情绪', risk, weight: 1 / (sourceRisks.length + 1) });
  }
  if (report.sections.behavior) {
    const risk = Math.min(1, (report.sections.behavior.riskFactors || []).length / 5);
    sourceRisks.push({ source: 'behavior', label: '行为模式', risk, weight: 1 / (sourceRisks.length + 1) });
  }

  // 归一化权重
  const totalWeight = sourceRisks.reduce((sum, s) => sum + s.weight, 0);
  sourceRisks.forEach(s => {
    s.weight = s.weight / totalWeight;
    s.contribution = s.risk * s.weight;
    s.percentage = (s.contribution / Math.max(0.001, report.overallScore) * 100).toFixed(1) + '%';
    explainability.sources.push({
      source: s.source,
      label: s.label,
      riskScore: s.risk.toFixed(3),
      weight: s.weight.toFixed(3),
      contribution: s.contribution.toFixed(3),
      percentage: s.percentage,
      interpretation: getSourceInterpretation(s.source, s.risk)
    });
  });

  // 置信度评估
  let confidenceScore = 0.5;
  const dataPoints = sourceRisks.length;
  if (dataPoints >= 3) confidenceScore += 0.3;
  else if (dataPoints >= 2) confidenceScore += 0.2;
  // 有情绪趋势数据则增加置信度
  if (report.sections.emotion && report.sections.emotion.dataPoints > 3) confidenceScore += 0.1;
  // 有显著冲突则降低置信度
  if (report.sections.consistency && report.sections.consistency.hasSignificantConflict) {
    confidenceScore -= 0.15;
  }
  explainability.confidence = confidenceScore >= 0.75 ? 'high' :
                               confidenceScore >= 0.5 ? 'medium' : 'low';
  explainability.confidenceScore = Math.min(1, confidenceScore).toFixed(2);

  // 关键影响因素
  if (report.sections.assessment && report.sections.assessment.latestScore > 0.5) {
    explainability.keyFactors.push({
      factor: '量表测评',
      impact: 'high',
      desc: `量表风险等级为 ${report.sections.assessment.latestRiskLevel}，对综合风险贡献较大`
    });
  }
  if (report.sections.emotion) {
    if (report.sections.emotion.averageScore < 0.35) {
      explainability.keyFactors.push({
        factor: '文本情绪',
        impact: 'high',
        desc: '文本情绪持续低落，是综合风险上升的重要因素'
      });
    }
    if (report.sections.emotion.anomalies && report.sections.emotion.anomalies.length > 0) {
      explainability.keyFactors.push({
        factor: '情绪异常点',
        impact: 'medium',
        desc: `检测到${report.sections.emotion.anomalies.length}个情绪异常波动点`
      });
    }
    if (report.sections.emotion.trend === 'declining') {
      explainability.trendNote = '情绪呈下降趋势，需关注近期状态变化';
    }
  }
  if (report.sections.behavior && report.sections.behavior.riskFactors) {
    const topBehavior = report.sections.behavior.riskFactors.slice(0, 2);
    topBehavior.forEach(bf => {
      explainability.keyFactors.push({
        factor: '行为模式',
        impact: 'medium',
        desc: bf.description || bf.type
      });
    });
  }

  // 一致性说明
  if (report.sections.consistency && report.sections.consistency.analyzed) {
    if (report.sections.consistency.hasSignificantConflict) {
      explainability.consistencyNote = '不同信息源存在显著不一致，已小幅上调风险分，建议人工复核时重点关注';
    } else if (report.sections.consistency.hasConflict) {
      explainability.consistencyNote = '不同信息源存在轻微差异，属正常波动';
    } else {
      explainability.consistencyNote = '各信息源结果一致，综合判断置信度较高';
    }
  }

  // 综合解释
  explainability.interpretation = generateInterpretation(explainability);

  return explainability;
}

// 各信息源的解释
function getSourceInterpretation(source, risk) {
  const interpretations = {
    assessment: risk > 0.5 ? '量表显示较高风险' : risk > 0.3 ? '量表显示中等风险' : '量表显示低风险',
    emotion: risk > 0.5 ? '文本情绪负面' : risk > 0.3 ? '文本情绪略低' : '文本情绪积极',
    behavior: risk > 0.5 ? '行为模式异常' : risk > 0.3 ? '行为模式有轻微异常' : '行为模式正常'
  };
  return interpretations[source] || '未知';
}

// 综合解释
function generateInterpretation(explainability) {
  const parts = [];
  parts.push(`综合风险等级为${explainability.riskLevel}，置信度${explainability.confidence}`);

  if (explainability.sources.length > 0) {
    const topSource = [...explainability.sources].sort((a, b) => b.contribution - a.contribution)[0];
    parts.push(`主要贡献来自${topSource.label}（${topSource.percentage}）`);
  }

  if (explainability.keyFactors.length > 0) {
    parts.push(`关键影响因素：${explainability.keyFactors.map(f => f.factor).join('、')}`);
  }

  if (explainability.trendNote) parts.push(explainability.trendNote);
  if (explainability.consistencyNote) parts.push(explainability.consistencyNote);

  return parts.join('；') + '。';
}

// 一致性分析：检测量表、文本情绪、行为模式之间的信息一致性
function analyzeConsistency(sections) {
  const result = {
    analyzed: false,
    hasConflict: false,
    hasSignificantConflict: false,
    conflictLevel: 'none',  // none | minor | moderate | significant
    conflicts: [],
    notes: []
  };

  if (!sections) return result;

  // 收集各信息源的"风险方向"
  // 将各源归一化到 0-1 风险分数（1=高风险，0=低风险）
  const sources = {};

  if (sections.assessment) {
    sources.scale = {
      risk: sections.assessment.latestScore || 0,
      level: sections.assessment.latestRiskLevel || 'low',
      desc: '量表结果'
    };
  }

  if (sections.emotion && sections.emotion.averageScore !== undefined) {
    // 情绪分数越高越好，所以 risk = 1 - 情绪分数
    sources.text = {
      risk: 1 - (sections.emotion.averageScore || 0.5),
      level: sections.emotion.averageScore < 0.35 ? 'high' :
             sections.emotion.averageScore < 0.5 ? 'medium' : 'low',
      desc: '文本/日记情绪'
    };
  }

  if (sections.behavior) {
    const behaviorRisk = sections.behavior.riskFactors ?
      Math.min(1, sections.behavior.riskFactors.length / 5) : 0;
    sources.behavior = {
      risk: behaviorRisk,
      level: behaviorRisk > 0.5 ? 'high' :
             behaviorRisk > 0.3 ? 'medium' : 'low',
      desc: '行为模式'
    };
  }

  const sourceNames = Object.keys(sources);
  if (sourceNames.length < 2) {
    result.notes.push('信息源不足2个，无法开展一致性分析');
    return result;
  }

  result.analyzed = true;

  // 两两比较信息源
  for (let i = 0; i < sourceNames.length; i++) {
    for (let j = i + 1; j < sourceNames.length; j++) {
      const a = sourceNames[i];
      const b = sourceNames[j];
      const srcA = sources[a];
      const srcB = sources[b];

      const diff = Math.abs(srcA.risk - srcB.risk);
      const levelGap = getLevelGap(srcA.level, srcB.level);

      // 显著冲突：风险分差>0.3 且 等级差≥2级
      if (diff > 0.3 && levelGap >= 2) {
        result.hasConflict = true;
        result.hasSignificantConflict = true;
        result.conflictLevel = 'significant';
        result.conflicts.push({
          sources: [a, b],
          sourceA: { name: srcA.desc, risk: srcA.risk, level: srcA.level },
          sourceB: { name: srcB.desc, risk: srcB.risk, level: srcB.level },
          difference: diff,
          levelGap,
          desc: `${srcA.desc}(${srcA.level}) 与 ${srcB.desc}(${srcB.level}) 存在显著不一致`,
          interpretation: '不同信息源呈现的状态差异较大，可能反映个体主观表达与实际状态存在偏差，建议作为人工复核的辅助线索',
          action: '建议人工复核时关注此差异，不直接作为诊断依据'
        });
      }
      // 中度冲突：风险分差 0.2-0.3 或 等级差1级
      else if (diff > 0.2 || levelGap >= 1) {
        result.hasConflict = true;
        if (result.conflictLevel === 'none') result.conflictLevel = 'moderate';
        result.conflicts.push({
          sources: [a, b],
          sourceA: { name: srcA.desc, risk: srcA.risk, level: srcA.level },
          sourceB: { name: srcB.desc, risk: srcB.risk, level: srcB.level },
          difference: diff,
          levelGap,
          desc: `${srcA.desc}(${srcA.level}) 与 ${srcB.desc}(${srcB.level}) 存在轻微不一致`,
          interpretation: '不同信息源存在一定程度差异，属正常波动范围',
          action: '持续观察，若差异持续扩大则需关注'
        });
      }
    }
  }

  // 特殊场景：量表显示低风险但文本显示高负面情绪
  if (sources.scale && sources.text) {
    if (sources.scale.risk < 0.3 && sources.text.risk > 0.6) {
      result.hasConflict = true;
      result.hasSignificantConflict = true;
      result.conflictLevel = 'significant';
      result.conflicts.push({
        sources: ['scale', 'text'],
        type: 'scale_low_text_high',
        sourceA: { name: '量表结果', risk: sources.scale.risk, level: sources.scale.level },
        sourceB: { name: '文本情绪', risk: sources.text.risk, level: sources.text.level },
        desc: '量表结果正常但文本情绪显著负面',
        interpretation: '量表可能在本次评估中未捕捉到真实状态，或个体在结构化测评中倾向选择中性答案',
        action: '建议结合多次文本情绪观察，必要时人工访谈核实'
      });
    }
    // 反向：量表高风险但文本积极
    if (sources.scale.risk > 0.6 && sources.text.risk < 0.2) {
      result.hasConflict = true;
      result.hasSignificantConflict = true;
      result.conflictLevel = 'significant';
      result.conflicts.push({
        sources: ['scale', 'text'],
        type: 'scale_high_text_low',
        sourceA: { name: '量表结果', risk: sources.scale.risk, level: sources.scale.level },
        sourceB: { name: '文本情绪', risk: sources.text.risk, level: sources.text.level },
        desc: '量表高风险但文本情绪积极',
        interpretation: '个体可能在文本表达中倾向积极掩饰，或量表结果存在过度报告',
        action: '建议人工复核时谨慎对待，结合行为模式综合判断'
      });
    }
  }

  // 合规性声明：命题要求不得仅依据不一致直接判断欺骗/伪装/疾病
  if (result.hasConflict) {
    result.disclaimer = '本分析仅作为多源信息一致性参考，不直接作为欺骗、伪装或心理疾病的诊断依据，仅供专业人员复核时参考';
  }

  return result;
}

// 计算等级差（low/medium/high/critical 之间）
function getLevelGap(levelA, levelB) {
  const order = { low: 0, medium: 1, high: 2, critical: 3 };
  return Math.abs((order[levelA] || 0) - (order[levelB] || 0));
}

function calculateTestTrend(testResults) {
  if (testResults.length < 2) return 'insufficient';
  
  const recent = testResults.slice(0, 3);
  const older = testResults.slice(3, 6);
  
  const recentAvg = recent.reduce((sum, t) => sum + (t.riskResult?.finalScore || 0), 0) / recent.length;
  const olderAvg = older.length > 0 
    ? older.reduce((sum, t) => sum + (t.riskResult?.finalScore || 0), 0) / older.length
    : recentAvg;

  if (recentAvg < olderAvg - 0.1) return 'improving';
  if (recentAvg > olderAvg + 0.1) return 'worsening';
  return 'stable';
}

function generateReportRecommendations(report) {
  const recommendations = [];

  // 基于风险等级的建议
  if (report.overallRisk === 'critical') {
    recommendations.push({
      priority: 'urgent',
      action: '立即寻求专业帮助',
      description: '综合评估显示较高风险，建议立即联系精神科医生'
    });
  } else if (report.overallRisk === 'high') {
    recommendations.push({
      priority: 'high',
      action: '预约心理咨询',
      description: '建议在1周内预约专业心理咨询师'
    });
  }

  // 基于情绪趋势的建议
  if (report.sections.emotion) {
    if (report.sections.emotion.trend === 'declining') {
      recommendations.push({
        priority: 'medium',
        action: '关注情绪变化',
        description: '近期情绪呈下降趋势，建议增加户外活动和社交'
      });
    }
    if (report.sections.emotion.volatility > 0.2) {
      recommendations.push({
        priority: 'medium',
        action: '情绪稳定性训练',
        description: '情绪波动较大，建议学习正念冥想等情绪调节技巧'
      });
    }
  }

  // 基于行为模式的建议
  if (report.sections.behavior) {
    report.sections.behavior.insights.forEach(insight => {
      recommendations.push({
        priority: 'low',
        action: '生活方式调整',
        description: insight
      });
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

function generateReportSummary(report) {
  const parts = [];

  if (report.sections.assessment) {
    parts.push(`测评风险等级: ${report.sections.assessment.latestRiskLevel}`);
  }
  if (report.sections.emotion) {
    const trendText = {
      improving: '情绪改善中',
      declining: '情绪下降中',
      stable: '情绪稳定',
      insufficient: '数据不足'
    };
    parts.push(`情绪趋势: ${trendText[report.sections.emotion.trend] || '未知'}`);
  }

  const riskText = {
    critical: '存在较高心理风险，建议立即寻求专业帮助',
    high: '心理健康需要关注，建议预约专业咨询',
    medium: '有轻微心理困扰，建议调整生活方式',
    low: '心理健康状况良好'
  };

  return `${parts.join('；')}。${riskText[report.overallRisk]}。`;
}

// 管理员仪表板数据
function generateAdminDashboard(allUsers, allTests, allAlerts) {
  const dashboard = {
    totalUsers: allUsers.length,
    activeUsers: 0,
    riskDistribution: { critical: 0, high: 0, medium: 0, low: 0 },
    recentAlerts: [],
    trends: {},
    topIssues: []
  };

  // 统计风险分布
  allTests.forEach(test => {
    if (test.riskResult?.riskLevel) {
      dashboard.riskDistribution[test.riskResult.riskLevel]++;
    }
  });

  // 最近预警
  dashboard.recentAlerts = allAlerts
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  // 活跃用户 (最近7天有测试)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  dashboard.activeUsers = allUsers.filter(user => {
    return allTests.some(t => t.userId === user.id && new Date(t.createdAt) > weekAgo);
  }).length;

  return dashboard;
}

module.exports = {
  analyzeEmotionTrend,
  analyzeBehaviorPatterns,
  generateComprehensiveReport,
  generateAdminDashboard
};
