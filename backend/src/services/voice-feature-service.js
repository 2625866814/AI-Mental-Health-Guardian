// 语音声学特征提取服务
// 对应命题参考方向1：基于语音和文本的心理状态辅助分析
// 在现有ASR基础上，从音频中提取韵律、语速、能量、停顿等声学特征
// 作为多源信息融合的新信息源

const fs = require('fs');
const path = require('path');

// ============ WAV文件解析 ============
// 纯Node.js实现，无需引入音频处理依赖
function parseWavFile(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    if (buffer.length < 44) {
      return { error: '文件过小，非有效WAV', samples: null };
    }

    // WAV文件头解析
    const riff = buffer.toString('ascii', 0, 4);
    if (riff !== 'RIFF') {
      return { error: '非WAV格式', samples: null };
    }

    const sampleRate = buffer.readUInt32LE(24);
    const bitsPerSample = buffer.readUInt16LE(34);
    const numChannels = buffer.readUInt16LE(22);
    const dataOffset = 44; // 标准WAV头
    const dataSize = buffer.length - dataOffset;
    const bytesPerSample = bitsPerSample / 8;

    if (bitsPerSample !== 16) {
      return { error: `暂不支持${bitsPerSample}位WAV`, samples: null };
    }

    // 读取采样数据（16位有符号整数）
    const samples = [];
    const sampleCount = Math.floor(dataSize / bytesPerSample);

    for (let i = 0; i < sampleCount; i++) {
      const offset = dataOffset + i * bytesPerSample;
      if (offset + 2 <= buffer.length) {
        const sample = buffer.readInt16LE(offset);
        samples.push(sample);
      }
    }

    return {
      samples,
      sampleRate,
      bitsPerSample,
      numChannels,
      duration: sampleCount / sampleRate,
      sampleCount
    };
  } catch (e) {
    return { error: e.message, samples: null };
  }
}

// ============ 声学特征提取 ============

/**
 * 从音频样本中提取心理状态相关声学特征
 * 主要特征：
 * 1. 语速（Speech Rate）：每分钟音节数估算
 * 2. 能量（Energy）：平均能量+能量变化
 * 3. 停顿（Pauses）：停顿次数+占比
 * 4. 基频估计（Pitch proxy）：通过零交叉率估计
 * 5. 韵律变化（Prosody variation）：能量标准差
 */
function extractVoiceFeatures(filePath, asrText = '') {
  const parsed = parseWavFile(filePath);
  if (parsed.error || !parsed.samples) {
    return {
      success: false,
      error: parsed.error || '音频解析失败',
      features: null
    };
  }

  const { samples, sampleRate, duration, sampleCount } = parsed;

  // === 特征1: 能量分析 ===
  // 计算短时能量（按帧）
  const frameSize = Math.floor(sampleRate * 0.025); // 25ms帧
  const frames = [];
  for (let i = 0; i + frameSize <= sampleCount; i += frameSize) {
    const frame = samples.slice(i, i + frameSize);
    const energy = frame.reduce((sum, s) => sum + (s * s), 0) / frameSize;
    frames.push({
      energy: Math.sqrt(energy), // RMS能量
      startTime: i / sampleRate,
      endTime: (i + frameSize) / sampleRate
    });
  }

  // 平均能量
  const avgEnergy = frames.reduce((sum, f) => sum + f.energy, 0) / frames.length;
  // 能量标准差（韵律变化）
  const energyVariance = frames.reduce((sum, f) => sum + Math.pow(f.energy - avgEnergy, 2), 0) / frames.length;
  const energyStdDev = Math.sqrt(energyVariance);

  // === 特征2: 停顿检测 ===
  // 能量低于阈值的帧视为停顿
  const energyThreshold = avgEnergy * 0.3; // 30%平均能量作为静音阈值
  let pauseFrames = 0;
  let pauseSegments = [];
  let currentPauseStart = null;

  frames.forEach(f => {
    if (f.energy < energyThreshold) {
      pauseFrames++;
      if (currentPauseStart === null) {
        currentPauseStart = f.startTime;
      }
    } else {
      if (currentPauseStart !== null) {
        const pauseDuration = f.startTime - currentPauseStart;
        if (pauseDuration > 0.3) { // 仅记录>300ms的停顿
          pauseSegments.push({
            start: currentPauseStart,
            end: f.startTime,
            duration: pauseDuration
          });
        }
        currentPauseStart = null;
      }
    }
  });

  const totalPauseDuration = pauseSegments.reduce((sum, p) => sum + p.duration, 0);
  const pauseRatio = totalPauseDuration / duration; // 停顿占比
  const longPauseCount = pauseSegments.filter(p => p.duration > 1.0).length; // 长停顿数

  // === 特征3: 基频估计（零交叉率法）===
  // 简化版：通过零交叉率估计基频
  const zcrFrames = [];
  for (let i = 0; i + frameSize <= sampleCount; i += frameSize) {
    let zeroCrossings = 0;
    for (let j = 1; j < frameSize; j++) {
      if ((samples[i + j - 1] >= 0 && samples[i + j] < 0) ||
          (samples[i + j - 1] < 0 && samples[i + j] >= 0)) {
        zeroCrossings++;
      }
    }
    zcrFrames.push(zeroCrossings / frameSize); // 零交叉率
  }

  // 平均零交叉率 → 估计基频
  const avgZCR = zcrFrames.reduce((a, b) => a + b, 0) / zcrFrames.length;
  const estimatedPitch = avgZCR * sampleRate / 2; // 简化估计

  // 基频变化（韵律平坦度）
  const zcrVariance = zcrFrames.reduce((sum, z) => sum + Math.pow(z - avgZCR, 2), 0) / zcrFrames.length;
  const pitchVariation = Math.sqrt(zcrVariance);

  // === 特征4: 语速估算 ===
  // 语速 = 文本字数 / 语音时长(秒) * 60
  // 如果有ASR文本，使用字数；否则用活跃帧数估算
  let speechRate;
  if (asrText && asrText.length > 0) {
    const charCount = asrText.replace(/\s/g, '').length;
    speechRate = (charCount / duration) * 60; // 字/分钟
  } else {
    // 通过非停顿帧数估算
    const activeFrames = frames.length - pauseFrames;
    const activeDuration = (activeFrames * frameSize) / sampleRate;
    speechRate = activeDuration > 0 ? (activeDuration * 60) / duration : 0;
  }

  // === 特征5: 活跃度（非静音比例）===
  const activeRatio = 1 - pauseRatio;

  // === 综合心理状态相关指标 ===
  const indicators = calculatePsychologicalIndicators({
    duration,
    avgEnergy,
    energyStdDev,
    pauseRatio,
    longPauseCount,
    speechRate,
    estimatedPitch,
    pitchVariation,
    activeRatio
  });

  return {
    success: true,
    features: {
      duration: parseFloat(duration.toFixed(2)),
      energy: {
        average: parseFloat(avgEnergy.toFixed(2)),
        stdDev: parseFloat(energyStdDev.toFixed(2)),
        variation: parseFloat((energyStdDev / (avgEnergy || 1)).toFixed(3))
      },
      pause: {
        count: pauseSegments.length,
        longPauseCount,
        totalDuration: parseFloat(totalPauseDuration.toFixed(2)),
        ratio: parseFloat(pauseRatio.toFixed(3))
      },
      speechRate: parseFloat(speechRate.toFixed(1)), // 字/分钟
      pitch: {
        estimated: parseFloat(estimatedPitch.toFixed(1)),
        variation: parseFloat(pitchVariation.toFixed(4))
      },
      activeRatio: parseFloat(activeRatio.toFixed(3))
    },
    indicators,
    rawFrameCount: frames.length,
    asrText
  };
}

// ============ 心理状态相关指标计算 ============
// 基于声学特征推断心理状态相关辅助指标
function calculatePsychologicalIndicators(features) {
  const indicators = {
    depressionRisk: 0,    // 抑郁风险线索 (0-1)
    anxietyRisk: 0,        // 焦虑风险线索 (0-1)
    fatigueRisk: 0,        // 疲惫/耗竭风险 (0-1)
    stressLevel: 0,        // 压力水平 (0-1)
    overallVoiceRisk: 0,   // 综合语音风险 (0-1)
    flags: [],
    interpretation: ''
  };

  // 抑郁风险线索：
  // - 语速慢（speechRate < 120字/分钟）
  // - 停顿多（pauseRatio > 0.4）
  // - 能量低（avgEnergy相对偏低）
  // - 韵律平坦（pitchVariation低）
  if (features.speechRate > 0 && features.speechRate < 120) {
    indicators.depressionRisk += 0.25;
    indicators.flags.push('语速偏慢');
  }
  if (features.pauseRatio > 0.4) {
    indicators.depressionRisk += 0.25;
    indicators.flags.push('停顿较多');
  }
  if (features.longPauseCount > 3) {
    indicators.depressionRisk += 0.15;
    indicators.flags.push('存在长停顿');
  }
  if (features.pitchVariation < 0.01) {
    indicators.depressionRisk += 0.15;
    indicators.flags.push('韵律平淡');
  }

  // 焦虑风险线索：
  // - 语速快（speechRate > 200字/分钟）
  // - 能量变化大（energyStdDev/avgEnergy高）
  // - 基频高（estimatedPitch偏高）
  if (features.speechRate > 200) {
    indicators.anxietyRisk += 0.25;
    indicators.flags.push('语速偏快');
  }
  if (features.energy.variation > 0.5) {
    indicators.anxietyRisk += 0.2;
    indicators.flags.push('能量波动大');
  }

  // 疲惫风险线索：
  // - 能量低
  // - 活跃度低
  if (features.avgEnergy < 500) { // 阈值需根据实际数据校准
    indicators.fatigueRisk += 0.3;
    indicators.flags.push('语音能量低');
  }
  if (features.activeRatio < 0.5) {
    indicators.fatigueRisk += 0.2;
    indicators.flags.push('活跃度低');
  }

  // 压力水平：
  // - 基频高+变化小（紧张但单调）
  if (features.estimatedPitch > 300 && features.pitchVariation < 0.015) {
    indicators.stressLevel += 0.3;
    indicators.flags.push('声音紧张单调');
  }

  // 综合风险
  indicators.depressionRisk = Math.min(1, indicators.depressionRisk);
  indicators.anxietyRisk = Math.min(1, indicators.anxietyRisk);
  indicators.fatigueRisk = Math.min(1, indicators.fatigueRisk);
  indicators.stressLevel = Math.min(1, indicators.stressLevel);

  // 综合语音风险（取最大值加权）
  indicators.overallVoiceRisk = Math.min(1, Math.max(
    indicators.depressionRisk * 0.4,
    indicators.anxietyRisk * 0.3,
    indicators.fatigueRisk * 0.2,
    indicators.stressLevel * 0.1
  ));

  // 解读
  const parts = [];
  if (indicators.depressionRisk > 0.3) parts.push('抑郁倾向');
  if (indicators.anxietyRisk > 0.3) parts.push('焦虑倾向');
  if (indicators.fatigueRisk > 0.3) parts.push('疲惫状态');
  if (indicators.stressLevel > 0.3) parts.push('压力状态');

  indicators.interpretation = parts.length > 0
    ? `语音特征提示：${parts.join('、')}（${indicators.flags.join('、')}）`
    : '语音特征在正常范围内';

  // 合规声明
  indicators.disclaimer = '语音特征仅作为辅助参考线索，不直接作为心理疾病诊断依据';

  return indicators;
}

module.exports = {
  parseWavFile,
  extractVoiceFeatures,
  calculatePsychologicalIndicators
};
