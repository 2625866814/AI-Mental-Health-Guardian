import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mentalHealthAPI, diaryAPI, enhancedAPI } from '../services/api';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444'];
const RISK_LABELS = { low: '低风险', medium: '中风险', high: '中高风险', critical: '高风险' };

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalTests: 0, totalDiary: 0, avgScore: 0, trend: 'stable', riskLevel: 'low' });
  const [emotionTrend, setEmotionTrend] = useState([]);
  const [riskDistribution, setRiskDistribution] = useState([]);
  const [recentTests, setRecentTests] = useState([]);
  const [recentDiary, setRecentDiary] = useState([]);
  const [aiReport, setAiReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => { loadAllData(); }, []);

  const loadAllData = async () => {
    try {
      const [testRes, testHistory, diaryRes] = await Promise.all([
        mentalHealthAPI.getStats().catch(() => ({ stats: {} })),
        mentalHealthAPI.getHistory().catch(() => ({ results: [] })),
        diaryAPI.getHistory({ limit: 30 }).catch(() => ({ entries: [] }))
      ]);

      const tests = testHistory.results || [];
      const diaries = diaryRes.entries || [];

      setStats({
        totalTests: tests.length,
        totalDiary: diaries.length,
        avgScore: testRes.stats?.averageRisk ? Math.round(testRes.stats.averageRisk * 100) : 0,
        trend: testRes.stats?.trend || 'stable',
        riskLevel: tests[0]?.riskResult?.riskLevel || 'low'
      });

      setRecentTests(tests.slice(0, 4));
      setRecentDiary(diaries.slice(0, 4));
      setEmotionTrend(buildEmotionTrend(diaries));
      setRiskDistribution(buildRiskDistribution(tests));
    } catch (e) {
      console.error('加载失败:', e);
    } finally {
      setLoading(false);
    }
  };

  const buildEmotionTrend = (diaries) => {
    return diaries.slice(0, 7).reverse().map(d => ({
      date: d.entryDate ? new Date(d.entryDate).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) : '',
      score: Math.round((d.emotionAnalysis?.emotionScore || 0.5) * 100)
    }));
  };

  const buildRiskDistribution = (tests) => {
    const dist = { low: 0, medium: 0, high: 0, critical: 0 };
    tests.forEach(t => { dist[t.riskResult?.riskLevel || 'low']++; });
    return Object.entries(dist).filter(([, v]) => v > 0).map(([k, v]) => ({ name: RISK_LABELS[k], value: v }));
  };

  const generateAIReport = async () => {
    setReportLoading(true);
    try {
      const res = await enhancedAPI.getReport();
      setAiReport(res.report);
    } catch {
      setAiReport({
        summary: '暂无足够数据生成报告，请多使用系统功能后重试。',
        recommendations: [{ priority: 'low', action: '增加使用', description: '多进行心理测试、写日记、与AI对话，系统会为您生成更准确的分析报告。' }]
      });
    } finally { setReportLoading(false); }
  };

  const getRiskColor = (level) => ({ critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981' }[level] || '#10b981');
  const getTrendIcon = (trend) => ({ improving: '📈', declining: '📉', stable: '📊' }[trend] || '📊');
  const getTrendText = (trend) => ({ improving: '改善中', declining: '需关注', stable: '稳定' }[trend] || '稳定');

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #f0f0f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <style>{`
        .dash-card { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; transition: all 0.3s ease; }
        .dash-card:hover { box-shadow: 0 10px 40px rgba(0,0,0,0.06); transform: translateY(-2px); }
        .stat-card { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 24px; transition: all 0.3s ease; cursor: pointer; }
        .stat-card:hover { box-shadow: 0 10px 40px rgba(0,0,0,0.08); transform: translateY(-4px); }
        .quick-btn { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 20px 12px; border-radius: 14px; background: #fff; border: 1px solid #e2e8f0; cursor: pointer; transition: all 0.3s ease; }
        .quick-btn:hover { border-color: #6366f1; box-shadow: 0 8px 25px rgba(99,102,241,0.15); transform: translateY(-3px); }
        .quick-btn:hover .quick-icon { transform: scale(1.15); }
        .quick-icon { font-size: 32px; transition: transform 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.5s ease forwards; }
        .fade-in-delay-1 { animation-delay: 0.1s; opacity: 0; }
        .fade-in-delay-2 { animation-delay: 0.2s; opacity: 0; }
        .fade-in-delay-3 { animation-delay: 0.3s; opacity: 0; }
        .report-tag { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* 顶部欢迎 */}
        <div className="fade-in" style={{ marginBottom: 32 }}>
          <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)', borderRadius: 24, padding: '40px 48px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -30, top: -30, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }}></div>
            <div style={{ position: 'absolute', right: 80, bottom: -50, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}></div>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, backdropFilter: 'blur(10px)' }}>
                  👋
                </div>
                <div>
                  <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0 }}>你好，{user?.username}</h1>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: '4px 0 0' }}>
                    {getTrendIcon(stats.trend)} 情绪状态{getTrendText(stats.trend)}，今天也要照顾好自己哦
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="fade-in fade-in-delay-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 28 }}>
          {[
            { icon: '🧠', val: stats.totalTests, lbl: '测试次数', sub: '心理健康评估', color: '#6366f1', bg: '#eef2ff' },
            { icon: '💚', val: stats.avgScore + '%', lbl: '健康评分', sub: '综合评估结果', color: getRiskColor(stats.riskLevel), bg: stats.riskLevel === 'low' ? '#ecfdf5' : '#fef2f2' },
            { icon: '📝', val: stats.totalDiary, lbl: '日记记录', sub: '情绪追踪', color: '#f59e0b', bg: '#fffbeb' },
            { icon: getTrendIcon(stats.trend), val: getTrendText(stats.trend), lbl: '情绪趋势', sub: '近7天变化', color: '#8b5cf6', bg: '#f5f3ff' }
          ].map((s, i) => (
            <div key={i} className="stat-card" onClick={() => i === 0 ? navigate('/mental-health') : i === 2 ? navigate('/diary') : null}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{s.icon}</div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginTop: 6 }}>{s.lbl}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* 图表区域 */}
        <div className="fade-in fade-in-delay-2" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20, marginBottom: 28 }}>
          {/* 情绪趋势 */}
          <div className="dash-card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>情绪趋势</h3>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>近7天情绪指数变化</p>
              </div>
              <div style={{ padding: '6px 12px', borderRadius: 8, background: '#eef2ff', fontSize: 12, fontWeight: 600, color: '#6366f1' }}>7天</div>
            </div>
            {emotionTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={emotionTrend}>
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 13 }} />
                  <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fill="url(#gradient)" dot={{ r: 4, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13, gap: 8 }}>
                <span style={{ fontSize: 32 }}>📊</span>
                写日记后可查看情绪趋势
              </div>
            )}
          </div>

          {/* 风险分布 */}
          <div className="dash-card" style={{ padding: 28 }}>
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>风险分布</h3>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>测试结果统计</p>
            </div>
            {riskDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={riskDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                    {riskDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v}次`, '测试']} />
                  <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13, gap: 8 }}>
                <span style={{ fontSize: 32 }}>🧪</span>
                暂无测试数据
              </div>
            )}
          </div>
        </div>

        {/* AI 分析 */}
        <div className="fade-in fade-in-delay-3" style={{ marginBottom: 28 }}>
          <div className="dash-card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>AI 智能分析</h3>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>基于您的数据生成个性化报告</p>
              </div>
              <button onClick={generateAIReport} disabled={reportLoading}
                style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: reportLoading ? '#e2e8f0' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: reportLoading ? 'not-allowed' : 'pointer', transition: '0.2s' }}>
                {reportLoading ? '⏳ 分析中...' : '✨ 生成报告'}
              </button>
            </div>
            {aiReport ? (
              <div>
                <div style={{ padding: 20, background: 'linear-gradient(135deg, #eef2ff, #f5f3ff)', borderRadius: 14, marginBottom: 20, border: '1px solid #e0e7ff' }}>
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.8, margin: 0 }}>{aiReport.summary}</p>
                </div>
                {aiReport.recommendations?.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    {aiReport.recommendations.map((r, i) => (
                      <div key={i} style={{ padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span className="report-tag" style={{ background: r.priority === 'urgent' ? '#fef2f2' : r.priority === 'high' ? '#fff7ed' : '#ecfdf5', color: r.priority === 'urgent' ? '#ef4444' : r.priority === 'high' ? '#f97316' : '#10b981' }}>
                            {r.priority === 'urgent' ? '紧急' : r.priority === 'high' ? '重要' : '建议'}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{r.action}</span>
                        </div>
                        <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.6 }}>{r.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
                点击"生成报告"按钮，AI将为您生成个性化分析
              </div>
            )}
          </div>
        </div>

        {/* 最近记录 */}
        <div className="fade-in fade-in-delay-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
          <div className="dash-card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>最近测试</h3>
              <span onClick={() => navigate('/mental-health')} style={{ fontSize: 13, color: '#6366f1', cursor: 'pointer', fontWeight: 600 }}>查看全部 →</span>
            </div>
            {recentTests.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recentTests.map((t, i) => (
                  <div key={i} onClick={() => navigate('/mental-health')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, background: '#f8fafc', borderRadius: 12, cursor: 'pointer', transition: '0.2s', border: '1px solid transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#eef2ff'; e.currentTarget.style.borderColor = '#c7d2fe'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = 'transparent'; }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: getRiskColor(t.riskResult?.riskLevel), boxShadow: `0 0 8px ${getRiskColor(t.riskResult?.riskLevel)}40` }}></div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{t.testType === 'phq9' ? 'PHQ-9 抑郁筛查' : t.testType === 'gad7' ? 'GAD-7 焦虑筛查' : 'SCL-90 综合测试'}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{new Date(t.createdAt).toLocaleDateString('zh-CN')}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: getRiskColor(t.riskResult?.riskLevel) }}>{Math.round((t.riskResult?.finalScore || 0) * 100)}</div>
                </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 13 }}>暂无测试记录</div>
            )}
          </div>

          <div className="dash-card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>最近日记</h3>
              <span onClick={() => navigate('/diary')} style={{ fontSize: 13, color: '#6366f1', cursor: 'pointer', fontWeight: 600 }}>查看全部 →</span>
            </div>
            {recentDiary.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recentDiary.map((d, i) => (
                  <div key={i} onClick={() => navigate('/diary')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, background: '#f8fafc', borderRadius: 12, cursor: 'pointer', transition: '0.2s', border: '1px solid transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#eef2ff'; e.currentTarget.style.borderColor = '#c7d2fe'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = 'transparent'; }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{d.entryDate}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                      {d.morningText || d.afternoonText || d.eveningText || '无内容'}
                    </div>
                  </div>
                  <div style={{ fontSize: 22 }}>
                    {d.emotionAnalysis?.emotion === 'positive' ? '😊' : d.emotionAnalysis?.emotion === 'negative' ? '😢' : '😐'}
                  </div>
                </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 13 }}>暂无日记记录</div>
            )}
          </div>
        </div>

        {/* 快捷入口 */}
        <div className="fade-in fade-in-delay-3">
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>快捷入口</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
            {[
              { icon: '🧠', title: '心理测试', path: '/mental-health', color: '#6366f1' },
              { icon: '✨', title: '星盘分析', path: '/astrology', color: '#8b5cf6' },
              { icon: '🎨', title: '艺术疗愈', path: '/art-therapy', color: '#ec4899' },
              { icon: '📝', title: '每日日记', path: '/diary', color: '#f59e0b' },
              { icon: '🌙', title: '梦境解析', path: '/dream', color: '#6366f1' },
              { icon: '🤖', title: '数字人', path: '/digital-human', color: '#14b8a6' }
            ].map((a, i) => (
              <div key={i} className="quick-btn" onClick={() => navigate(a.path)}>
                <span className="quick-icon">{a.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: a.color }}>{a.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
