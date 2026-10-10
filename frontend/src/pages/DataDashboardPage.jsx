import { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444'];
const RISK_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' };

export default function DataDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({});
  const [riskDistribution, setRiskDistribution] = useState({});
  const [collegeDistribution, setCollegeDistribution] = useState([]);
  const [collegeRisk, setCollegeRisk] = useState([]);
  const [trends, setTrends] = useState({});
  const [emotionDistribution, setEmotionDistribution] = useState({});
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const refreshTimer = setInterval(loadData, 60000); // 每分钟刷新
    return () => { clearInterval(timer); clearInterval(refreshTimer); };
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [overviewRes, trendsRes, emotionRes, collegeRiskRes] = await Promise.all([
        fetch('/api/dashboard/overview', { headers }).then(r => r.json()),
        fetch('/api/dashboard/trends?days=14', { headers }).then(r => r.json()),
        fetch('/api/dashboard/emotion-stats', { headers }).then(r => r.json()),
        fetch('/api/dashboard/college-risk', { headers }).then(r => r.json())
      ]);

      if (overviewRes.success) {
        setOverview(overviewRes.overview);
        setRiskDistribution(overviewRes.riskDistribution);
        setCollegeDistribution(overviewRes.collegeDistribution);
        setRecentAlerts(overviewRes.recentAlerts);
      }
      if (trendsRes.success) setTrends(trendsRes.trends);
      if (emotionRes.success) setEmotionDistribution(emotionRes.emotionDistribution);
      if (collegeRiskRes.success) setCollegeRisk(collegeRiskRes.collegeRisk);
    } catch (e) {
      console.error('加载大屏数据失败:', e);
    } finally {
      setLoading(false);
    }
  };

  // 处理趋势数据
  const processTrendData = (data) => {
    if (!data || data.length === 0) return [];
    return data.map(d => ({
      date: d.date ? new Date(d.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) : '',
      count: parseInt(d.count) || 0
    }));
  };

  // 处理风险分布数据
  const riskPieData = [
    { name: '低风险', value: riskDistribution.low || 0 },
    { name: '中风险', value: riskDistribution.medium || 0 },
    { name: '中高风险', value: riskDistribution.high || 0 },
    { name: '高风险', value: riskDistribution.critical || 0 }
  ].filter(d => d.value > 0);

  // 处理情绪分布数据
  const emotionPieData = [
    { name: '积极', value: emotionDistribution.positive || 0 },
    { name: '中性', value: emotionDistribution.neutral || 0 },
    { name: '消极', value: emotionDistribution.negative || 0 }
  ].filter(d => d.value > 0);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, border: '4px solid #1e293b', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
          <div style={{ color: '#94a3b8', fontSize: 16 }}>加载中...</div>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', padding: 20, overflow: 'hidden' }}>
      <style>{`
        .dashboard-card { background: linear-gradient(135deg, #1e293b, #1e293b80); border-radius: 16px; border: 1px solid #334155; backdrop-filter: blur(10px); }
        .stat-card { background: linear-gradient(135deg, #1e293b, #1e293b80); border-radius: 14px; border: 1px solid #334155; padding: 20px; text-align: center; }
        .alert-item { padding: 12px 16px; background: #1e293b; border-radius: 10px; border-left: 3px solid #ef4444; margin-bottom: 8px; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .pulse { animation: pulse 2s infinite; }
        @keyframes glow { 0%, 100% { box-shadow: 0 0 5px rgba(99,102,241,0.3); } 50% { box-shadow: 0 0 20px rgba(99,102,241,0.6); } }
        .glow { animation: glow 3s infinite; }
      `}</style>

      {/* 顶部标题栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} className="pulse"></div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AI心理健康卫士 · 数据大屏
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontSize: 14, color: '#94a3b8' }}>
            实时数据 · 每分钟自动刷新
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#6366f1', fontFamily: 'monospace' }}>
            {currentTime.toLocaleTimeString('zh-CN')}
          </div>
        </div>
      </div>

      {/* 核心指标卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: '学生总数', value: overview.students || 0, icon: '👥', color: '#6366f1' },
          { label: '今日活跃', value: overview.todayActive || 0, icon: '🔥', color: '#f59e0b' },
          { label: '本周活跃', value: overview.weekActive || 0, icon: '📊', color: '#10b981' },
          { label: '测试总数', value: overview.tests || 0, icon: '🧪', color: '#8b5cf6' },
          { label: '日记总数', value: overview.diary || 0, icon: '📝', color: '#ec4899' },
          { label: '对话总数', value: overview.chat || 0, icon: '💬', color: '#14b8a6' }
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* 中间图表区 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* 活动趋势 */}
        <div className="dashboard-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', margin: '0 0 16px' }}>📈 近14天活动趋势</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart>
              <defs>
                <linearGradient id="gradientTest" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradientDiary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#475569" fontSize={11} />
              <YAxis stroke="#475569" fontSize={11} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
              <Area type="monotone" data={processTrendData(trends.tests)} dataKey="count" stroke="#6366f1" strokeWidth={2} fill="url(#gradientTest)" name="测试" />
              <Area type="monotone" data={processTrendData(trends.diary)} dataKey="count" stroke="#10b981" strokeWidth={2} fill="url(#gradientDiary)" name="日记" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 风险分布 */}
        <div className="dashboard-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', margin: '0 0 16px' }}>⚠️ 风险分布</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={riskPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                {riskPieData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 情绪分布 */}
        <div className="dashboard-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', margin: '0 0 16px' }}>😊 情绪分布</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={emotionPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                <Cell fill="#10b981" />
                <Cell fill="#94a3b8" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 底部区域 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {/* 学院风险对比 */}
        <div className="dashboard-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', margin: '0 0 16px' }}>🏫 学院风险对比</h3>
          {collegeRisk.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={collegeRisk.slice(0, 6)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#475569" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="#475569" fontSize={11} width={60} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
                <Bar dataKey="riskRate" fill="#ef4444" name="风险率%" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>暂无数据</div>
          )}
        </div>

        {/* 学院人数分布 */}
        <div className="dashboard-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', margin: '0 0 16px' }}>📊 学院人数分布</h3>
          {collegeDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={collegeDistribution.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="college" stroke="#475569" fontSize={10} angle={-30} textAnchor="end" height={50} />
                <YAxis stroke="#475569" fontSize={11} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
                <Bar dataKey="count" fill="#6366f1" name="人数" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>暂无数据</div>
          )}
        </div>

        {/* 实时预警 */}
        <div className="dashboard-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', margin: '0 0 16px' }}>
            🚨 实时预警
            <span style={{ marginLeft: 8, padding: '2px 8px', background: '#ef4444', borderRadius: 10, fontSize: 11, color: '#fff' }}>
              {recentAlerts.length}
            </span>
          </h3>
          <div style={{ height: 200, overflowY: 'auto' }}>
            {recentAlerts.length > 0 ? recentAlerts.map((a, i) => (
              <div key={i} className="alert-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>用户 {a.userId}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                      {new Date(a.createdAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <span style={{
                    padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                    background: a.riskResult?.riskLevel === 'critical' ? '#fef2f2' : '#fff7ed',
                    color: a.riskResult?.riskLevel === 'critical' ? '#ef4444' : '#f97316'
                  }}>
                    {a.riskResult?.riskLevel === 'critical' ? '高危' : '中高风险'}
                  </span>
                </div>
              </div>
            )) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                  <div>暂无预警</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 底部版权 */}
      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#475569' }}>
        AI心理健康卫士 · 数据驱动的心理健康守护
      </div>
    </div>
  );
}
