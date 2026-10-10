import { useState, useEffect } from 'react';

export default function ReportPage() {
  const [activeTab, setActiveTab] = useState('weekly');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadReport(); }, [activeTab]);

  const getToken = () => localStorage.getItem('token');

  const loadReport = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'weekly' ? '/api/notification/report/weekly' : '/api/notification/report/monthly';
      const res = await fetch(endpoint, { headers: { 'Authorization': `Bearer ${getToken()}` } });
      const data = await res.json();
      if (data.success) setReport(data.report);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const getEmotionColor = (score) => {
    if (score >= 70) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getRiskColor = (level) => ({
    critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981'
  }[level] || '#10b981');

  const getRiskLabel = (level) => ({
    critical: '高风险', high: '中高风险', medium: '中风险', low: '低风险'
  }[level] || '低风险');

  // 风险分层颜色映射
  const getTierColor = (color) => ({
    red: '#ef4444',
    orange: '#f97316',
    yellow: '#f59e0b',
    green: '#10b981'
  }[color] || '#6366f1');

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #f0f0f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <style>{`
        .report-card { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; }
      `}</style>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', margin: 0 }}>📊 个人报告</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: '6px 0 0' }}>查看您的心理健康周报和月报</p>
        </div>

        {/* 标签切换 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[
            { key: 'weekly', label: '周报' },
            { key: 'monthly', label: '月报' }
          ].map(tab => (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 24px', borderRadius: 10, border: 'none',
                background: activeTab === tab.key ? '#6366f1' : '#fff',
                color: activeTab === tab.key ? '#fff' : '#475569',
                fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: '0.2s',
                boxShadow: activeTab === tab.key ? '0 4px 12px rgba(99,102,241,0.3)' : '0 1px 3px rgba(0,0,0,0.1)'
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {report && (
          <>
            {/* 报告周期 */}
            <div className="report-card" style={{ padding: 20, marginBottom: 20, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}>
              <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 4 }}>报告周期</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{report.period}</div>
            </div>

            {/* 数据概览 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
              {[
                { label: '测试次数', value: report.summary?.testCount || 0, icon: '🧪', color: '#6366f1' },
                { label: '日记篇数', value: report.summary?.diaryCount || 0, icon: '📝', color: '#10b981' },
                { label: '心情打卡', value: report.summary?.moodCount || 0, icon: '😊', color: '#f59e0b' },
                { label: 'AI对话', value: report.summary?.chatCount || 0, icon: '💬', color: '#8b5cf6' }
              ].map((s, i) => (
                <div key={i} className="report-card" style={{ padding: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* 情绪和风险 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              {/* 情绪指数 */}
              <div className="report-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>😊 情绪指数</h3>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{
                    width: 100, height: 100, borderRadius: '50%', margin: '0 auto',
                    background: `conic-gradient(${getEmotionColor(report.emotion?.avgScore || 50)} ${Math.round((report.emotion?.avgScore || 50) * 3.6)}deg, #f1f5f9 0deg)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 24, fontWeight: 800, color: getEmotionColor(report.emotion?.avgScore || 50) }}>{report.emotion?.avgScore || 50}%</span>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', fontSize: 13, color: '#64748b' }}>
                  趋势：{report.emotion?.trend === 'improving' ? '📈 改善中' : report.emotion?.trend === 'declining' ? '📉 下降中' : '➡️ 稳定'}
                </div>
              </div>

              {/* 风险等级 */}
              <div className="report-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>⚠️ 风险等级</h3>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{
                    display: 'inline-block', padding: '12px 24px', borderRadius: 12,
                    background: getRiskColor(report.riskLevel) + '15',
                    border: `2px solid ${getRiskColor(report.riskLevel)}`
                  }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: getRiskColor(report.riskLevel) }}>
                      {getRiskLabel(report.riskLevel)}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', fontSize: 13, color: '#64748b' }}>
                  基于最新测评结果
                </div>
              </div>
            </div>

            {/* === 新增：4级风险分层 === */}
            {report.riskTier && (
              <div className="report-card" style={{
                padding: 24, marginBottom: 20,
                borderLeft: `4px solid ${getTierColor(report.riskTier.color)}`
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>
                  🎯 风险分层 · {report.riskTier.levelLabel}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                  <div style={{
                    padding: '8px 20px', borderRadius: 8,
                    background: getTierColor(report.riskTier.color) + '15',
                    border: `1px solid ${getTierColor(report.riskTier.color)}`,
                    color: getTierColor(report.riskTier.color),
                    fontWeight: 700, fontSize: 14
                  }}>
                    Tier {report.riskTier.tier} · {report.riskTier.action}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: '#334155', marginBottom: 12, lineHeight: 1.6 }}>
                  {report.riskTier.description}
                </div>
                <div style={{
                  padding: 12, background: '#f8fafc', borderRadius: 8, marginBottom: 12,
                  fontSize: 13, color: '#475569'
                }}>
                  <strong style={{ color: '#1e293b' }}>下一步：</strong>{report.riskTier.nextStep}
                </div>
                {report.riskTier.resources && report.riskTier.resources.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    {report.riskTier.resources.map((r, i) => (
                      <div key={i} style={{
                        padding: '6px 12px', background: '#f1f5f9', borderRadius: 6,
                        fontSize: 12, color: '#475569'
                      }}>
                        {r.name}{r.contact ? ` (${r.contact})` : ''}
                      </div>
                    ))}
                  </div>
                )}
                <div style={{
                  padding: '8px 12px', background: '#fef3c7', borderRadius: 6,
                  fontSize: 11, color: '#92400e', fontStyle: 'italic'
                }}>
                  ℹ️ {report.riskTier.aiBoundary}
                </div>
              </div>
            )}

            {/* === 新增：多源贡献度可视化 === */}
            {report.sourceContributions && Object.keys(report.sourceContributions).length > 0 && (
              <div className="report-card" style={{ padding: 24, marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>
                  📊 多源信息贡献度
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {Object.entries(report.sourceContributions).map(([source, data]) => {
                    const sourceLabels = {
                      scl90: 'SCL-90量表',
                      phq9: 'PHQ-9抑郁量表',
                      gad7: 'GAD-7焦虑量表',
                      text: '文本情绪分析',
                      behavior: '行为模式'
                    };
                    const pct = parseFloat(data.percentage) || 0;
                    return (
                      <div key={source}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>
                            {sourceLabels[source] || source}
                          </span>
                          <span style={{ fontSize: 13, color: '#1e293b', fontWeight: 700 }}>
                            {data.percentage}
                          </span>
                        </div>
                        <div style={{ height: 10, background: '#f1f5f9', borderRadius: 5, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.min(100, pct)}%`,
                            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                            borderRadius: 5,
                            transition: 'width 0.5s'
                          }}></div>
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                          分数 {(data.score * 100).toFixed(0)}% · 权重 {(data.weight * 100).toFixed(0)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* === 新增：一致性分析 === */}
            {report.sections?.consistency && report.sections.consistency.analyzed && (
              <div className="report-card" style={{ padding: 24, marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>
                  🔍 多源信息一致性分析
                </h3>
                <div style={{
                  padding: 12, borderRadius: 8, marginBottom: 12,
                  background: report.sections.consistency.hasSignificantConflict ? '#fee2e2' :
                             report.sections.consistency.hasConflict ? '#fef3c7' : '#dcfce7',
                  fontSize: 13, color: '#1e293b'
                }}>
                  {report.sections.consistency.hasSignificantConflict ? '⚠️ 检测到显著不一致' :
                   report.sections.consistency.hasConflict ? 'ℹ️ 存在轻微差异' :
                   '✅ 各信息源结果一致'}
                  <span style={{ marginLeft: 8, color: '#64748b' }}>
                    (等级: {report.sections.consistency.conflictLevel})
                  </span>
                </div>
                {report.sections.consistency.conflicts && report.sections.consistency.conflicts.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {report.sections.consistency.conflicts.map((c, i) => (
                      <div key={i} style={{
                        padding: 12, background: '#f8fafc', borderRadius: 8,
                        borderLeft: `3px solid ${c.levelGap >= 2 ? '#ef4444' : '#f59e0b'}`
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>
                          {c.desc}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                          解读：{c.interpretation}
                        </div>
                        <div style={{ fontSize: 12, color: '#6366f1' }}>
                          建议：{c.action}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {report.sections.consistency.disclaimer && (
                  <div style={{
                    padding: '8px 12px', background: '#f1f5f9', borderRadius: 6,
                    fontSize: 11, color: '#64748b', fontStyle: 'italic', marginTop: 12
                  }}>
                    ℹ️ {report.sections.consistency.disclaimer}
                  </div>
                )}
              </div>
            )}

            {/* === 新增：可解释性分析 === */}
            {report.explainability && (
              <div className="report-card" style={{ padding: 24, marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>
                  💡 模型可解释性
                </h3>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div style={{
                    padding: '8px 16px', borderRadius: 8,
                    background: report.explainability.confidence === 'high' ? '#dcfce7' :
                               report.explainability.confidence === 'medium' ? '#fef3c7' : '#fee2e2',
                    fontSize: 13, fontWeight: 600
                  }}>
                    置信度: {report.explainability.confidence}
                    <span style={{ marginLeft: 6, fontSize: 11, color: '#64748b' }}>
                      ({Math.round((parseFloat(report.explainability.confidenceScore) || 0) * 100)}%)
                    </span>
                  </div>
                </div>
                {report.explainability.keyFactors && report.explainability.keyFactors.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>
                      关键影响因素：
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {report.explainability.keyFactors.map((f, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '6px 10px', background: '#f8fafc', borderRadius: 6
                        }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: 4, fontSize: 11,
                            background: f.impact === 'high' ? '#fee2e2' :
                                       f.impact === 'medium' ? '#fef3c7' : '#f1f5f9',
                            color: f.impact === 'high' ? '#dc2626' :
                                   f.impact === 'medium' ? '#d97706' : '#475569'
                          }}>
                            {f.impact === 'high' ? '高' : f.impact === 'medium' ? '中' : '低'}
                          </span>
                          <span style={{ fontSize: 13, color: '#334155' }}>{f.factor}</span>
                          <span style={{ fontSize: 12, color: '#64748b' }}>— {f.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {report.explainability.interpretation && (
                  <div style={{
                    padding: 12, background: '#f8fafc', borderRadius: 8,
                    fontSize: 13, color: '#1e293b', lineHeight: 1.6
                  }}>
                    <strong>综合解释：</strong>{report.explainability.interpretation}
                  </div>
                )}
              </div>
            )}

            {/* === 新增：隐私声明 === */}
            {report.privacyNotice && (
              <div className="report-card" style={{
                padding: 16, marginBottom: 20,
                background: '#f8fafc', border: '1px dashed #cbd5e1'
              }}>
                <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
                  🔒 {report.privacyNotice}
                </div>
                {report.dataHandling && (
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
                    · {report.dataHandling.deidentification}<br/>
                    · {report.dataHandling.accessControl}<br/>
                    · {report.dataHandling.aiBoundary}<br/>
                    · {report.dataHandling.retention}
                  </div>
                )}
              </div>
            )}

            {/* 心情分布 */}
            {report.moodDistribution && Object.keys(report.moodDistribution).length > 0 && (
              <div className="report-card" style={{ padding: 24, marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>😊 心情分布</h3>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {Object.entries(report.moodDistribution).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                    const moodMap = { happy: '😊', good: '😌', neutral: '😐', tired: '😩', sad: '😢', anxious: '😰', angry: '😤' };
                    const labelMap = { happy: '开心', good: '平静', neutral: '一般', tired: '疲惫', sad: '难过', anxious: '焦虑', angry: '生气' };
                    return (
                      <div key={type} style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 10, textAlign: 'center', minWidth: 60 }}>
                        <div style={{ fontSize: 24, marginBottom: 4 }}>{moodMap[type] || '❓'}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{count}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{labelMap[type] || type}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 建议 */}
            {report.recommendations && report.recommendations.length > 0 && (
              <div className="report-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>💡 建议</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {report.recommendations.map((rec, i) => (
                    <div key={i} style={{
                      padding: 14, borderRadius: 10,
                      borderLeft: `3px solid ${rec.type === 'alert' ? '#ef4444' : rec.type === 'warning' ? '#f59e0b' : rec.type === 'positive' ? '#10b981' : '#6366f1'}`,
                      background: '#f8fafc'
                    }}>
                      <div style={{ fontSize: 13, color: '#334155' }}>{rec.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
