import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const RARITY_COLORS = {
  common: { bg: '#f1f5f9', border: '#cbd5e1', text: '#64748b', label: '普通' },
  uncommon: { bg: '#ecfdf5', border: '#86efac', text: '#16a34a', label: '稀有' },
  rare: { bg: '#eff6ff', border: '#93c5fd', text: '#2563eb', label: '珍贵' },
  epic: { bg: '#faf5ff', border: '#c4b5fd', text: '#7c3aed', label: '史诗' },
  legendary: { bg: '#fefce8', border: '#fde047', text: '#ca8a04', label: '传说' }
};

export default function AchievementPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState({ total: 0, unlocked: 0, percentage: 0 });
  const [checkInHistory, setCheckInHistory] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showCheckIn, setShowCheckIn] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [pointsRes, achievementsRes] = await Promise.all([
        fetch('/api/achievement/points', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/achievement/achievements', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json())
      ]);

      if (pointsRes.success) setPoints(pointsRes.points);
      if (achievementsRes.success) {
        setAchievements(achievementsRes.achievements);
        setStats(achievementsRes.stats);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCheckIn = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/achievement/checkin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setShowCheckIn(true);
        setTimeout(() => setShowCheckIn(false), 3000);
        loadData();
      } else {
        alert(data.message || '签到失败');
      }
    } catch (e) { alert('签到失败'); }
  };

  const categories = ['all', ...new Set(achievements.map(a => a.category))];
  const filtered = activeCategory === 'all' ? achievements : achievements.filter(a => a.category === activeCategory);

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
        .ach-card { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; }
        .ach-btn { padding: 10px 20px; border-radius: 10px; border: none; font-size: 14px; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .ach-btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; }
        .ach-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,0.3); }
        .achievement-card { padding: 16px; border-radius: 12px; border: 2px solid #e2e8f0; transition: 0.2s; }
        .achievement-card.unlocked { border-color: #6366f1; background: #faf5ff; }
        .achievement-card.locked { opacity: 0.6; filter: grayscale(0.5); }
        @keyframes bounce { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        .bounce { animation: bounce 0.5s ease; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .slide-up { animation: slideUp 0.3s ease; }
      `}</style>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
        {/* 签到弹窗 */}
        {showCheckIn && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="slide-up" style={{ background: '#fff', borderRadius: 24, padding: 40, textAlign: 'center', maxWidth: 360 }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>签到成功！</h2>
              <p style={{ fontSize: 15, color: '#64748b', margin: 0 }}>连续签到 {points?.streak || 1} 天</p>
            </div>
          </div>
        )}

        {/* 顶部卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
          {/* 积分等级 */}
          <div className="ach-card" style={{ padding: 28, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 4 }}>我的等级</div>
                <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1 }}>Lv.{points?.level || 1}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 4 }}>总积分</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{points?.totalPoints || 0}</div>
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 8, height: 10, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(points?.progress || 0) * 100}%`, background: '#fff', borderRadius: 8, transition: '0.5s' }}></div>
            </div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6, textAlign: 'right' }}>
              距下一级还需 {Math.round((1 - (points?.progress || 0)) * ((points?.nextLevelPoints || 100) - (points?.totalPoints || 0)))} 积分
            </div>
          </div>

          {/* 签到卡片 */}
          <div className="ach-card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 14, color: '#64748b', marginBottom: 4 }}>连续签到</div>
                <div style={{ fontSize: 48, fontWeight: 800, color: '#1e293b' }}>{points?.streak || 0}<span style={{ fontSize: 16, color: '#94a3b8' }}>天</span></div>
              </div>
              <button
                onClick={handleCheckIn}
                disabled={points?.todayCheckedIn}
                style={{
                  padding: '14px 28px', borderRadius: 14, border: 'none', fontSize: 16, fontWeight: 700,
                  background: points?.todayCheckedIn ? '#e2e8f0' : 'linear-gradient(135deg, #f59e0b, #f97316)',
                  color: points?.todayCheckedIn ? '#94a3b8' : '#fff',
                  cursor: points?.todayCheckedIn ? 'not-allowed' : 'pointer'
                }}>
                {points?.todayCheckedIn ? '✓ 已签到' : '✨ 签到'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[1, 2, 3, 4, 5, 6, 7].map(d => (
                <div key={d} style={{
                  flex: 1, height: 8, borderRadius: 4,
                  background: d <= (points?.streak || 0) % 7 || (points?.streak || 0) >= 7 ? '#f59e0b' : '#e2e8f0'
                }}></div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>连续7天签到获得额外奖励</div>
          </div>
        </div>

        {/* 成就统计 */}
        <div className="ach-card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>🏆 成就收集</h3>
            <div style={{ fontSize: 14, color: '#6366f1', fontWeight: 600 }}>{stats.unlocked}/{stats.total} ({stats.percentage}%)</div>
          </div>
          <div style={{ background: '#f1f5f9', borderRadius: 8, height: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${stats.percentage}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: 8, transition: '0.5s' }}></div>
          </div>
        </div>

        {/* 分类标签 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: activeCategory === cat ? '#6366f1' : '#fff',
                color: activeCategory === cat ? '#fff' : '#475569',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: '0.2s',
                boxShadow: activeCategory === cat ? '0 2px 8px rgba(99,102,241,0.3)' : '0 1px 3px rgba(0,0,0,0.1)'
              }}>
              {cat === 'all' ? '全部' : cat}
            </button>
          ))}
        </div>

        {/* 成就列表 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {filtered.map(a => {
            const rarity = RARITY_COLORS[a.rarity] || RARITY_COLORS.common;
            return (
              <div key={a.id}
                className={`achievement-card ${a.unlocked ? 'unlocked' : 'locked'}`}
                title={a.description}>
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>{a.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: a.unlocked ? '#1e293b' : '#94a3b8' }}>{a.name}</div>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', textAlign: 'center', marginBottom: 10, minHeight: 32 }}>
                  {a.description}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                    background: rarity.bg, color: rarity.text, border: `1px solid ${rarity.border}`
                  }}>
                    {rarity.label}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#6366f1' }}>+{a.points}</span>
                </div>
                {a.unlocked && (
                  <div style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', marginTop: 8 }}>
                    ✓ {new Date(a.unlockedAt).toLocaleDateString('zh-CN')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
