import { useState, useEffect } from 'react';

const MOOD_TYPES = [
  { type: 'happy', icon: '😊', label: '开心', color: '#10b981', score: 9 },
  { type: 'good', icon: '😌', label: '平静', color: '#6366f1', score: 7 },
  { type: 'neutral', icon: '😐', label: '一般', color: '#94a3b8', score: 5 },
  { type: 'tired', icon: '😩', label: '疲惫', color: '#f59e0b', score: 3 },
  { type: 'sad', icon: '😢', label: '难过', color: '#3b82f6', score: 2 },
  { type: 'anxious', icon: '😰', label: '焦虑', color: '#f97316', score: 2 },
  { type: 'angry', icon: '😤', label: '生气', color: '#ef4444', score: 1 }
];

const MOOD_TAGS = ['学习', '工作', '社交', '运动', '休息', '娱乐', '家庭', '恋爱', '健康', '天气'];

export default function MoodCheckInPage() {
  const [todayMood, setTodayMood] = useState(null);
  const [selectedMood, setSelectedMood] = useState(null);
  const [note, setNote] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [calendar, setCalendar] = useState([]);
  const [stats, setStats] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, [currentMonth]);

  const getToken = () => localStorage.getItem('token');

  const loadData = async () => {
    try {
      const month = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
      const [todayRes, calendarRes, statsRes] = await Promise.all([
        fetch('/api/notification/mood/today', { headers: { 'Authorization': `Bearer ${getToken()}` } }).then(r => r.json()),
        fetch(`/api/notification/mood/calendar?month=${month}`, { headers: { 'Authorization': `Bearer ${getToken()}` } }).then(r => r.json()),
        fetch('/api/notification/mood/stats?days=30', { headers: { 'Authorization': `Bearer ${getToken()}` } }).then(r => r.json())
      ]);

      if (todayRes.success && todayRes.mood) {
        setTodayMood(todayRes.mood);
        setSelectedMood(todayRes.mood.moodType);
        setNote(todayRes.mood.note || '');
        setSelectedTags(todayRes.mood.tags || []);
      }
      if (calendarRes.success) setCalendar(calendarRes.moods);
      if (statsRes.success) setStats(statsRes.stats);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCheckIn = async () => {
    if (!selectedMood) return alert('请选择心情');
    setSaving(true);
    try {
      const moodInfo = MOOD_TYPES.find(m => m.type === selectedMood);
      const res = await fetch('/api/notification/mood/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ moodType: selectedMood, moodScore: moodInfo?.score || 5, note, tags: selectedTags })
      });
      const data = await res.json();
      if (data.success) {
        setTodayMood(data.mood);
        alert(data.created ? '打卡成功！' : '已更新心情');
        loadData();
      }
    } catch (e) { alert('打卡失败'); }
    finally { setSaving(false); }
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const renderCalendar = () => {
    const days = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const cells = [];

    // 空白填充
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} style={{ padding: 8 }}></div>);
    }

    // 日期格子
    for (let d = 1; d <= days; d++) {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const mood = calendar.find(m => m.moodDate === dateStr);
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      const moodInfo = mood ? MOOD_TYPES.find(m => m.type === mood.moodType) : null;

      cells.push(
        <div key={d} style={{
          padding: 8,
          borderRadius: 10,
          background: isToday ? '#eef2ff' : 'transparent',
          border: isToday ? '2px solid #6366f1' : '1px solid transparent',
          textAlign: 'center',
          minHeight: 60,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4
        }}>
          <div style={{ fontSize: 12, color: isToday ? '#6366f1' : '#64748b', fontWeight: isToday ? 700 : 400 }}>{d}</div>
          {moodInfo && <div style={{ fontSize: 20 }}>{moodInfo.icon}</div>}
        </div>
      );
    }

    return cells;
  };

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
        .mood-card { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; }
        .mood-btn { padding: 16px; border-radius: 12px; border: 2px solid #e2e8f0; cursor: pointer; transition: 0.2s; text-align: center; }
        .mood-btn:hover { border-color: #a5b4fc; background: #f5f3ff; }
        .mood-btn.selected { border-color: #6366f1; background: #eef2ff; }
      `}</style>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', margin: 0 }}>😊 心情打卡</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: '6px 0 0' }}>记录每天的心情，追踪情绪变化</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* 左侧：心情选择 */}
          <div>
            {/* 今日心情 */}
            <div className="mood-card" style={{ padding: 24, marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>
                {todayMood ? '今日心情（已打卡）' : '今日心情'}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
                {MOOD_TYPES.map(m => (
                  <div key={m.type}
                    className={`mood-btn ${selectedMood === m.type ? 'selected' : ''}`}
                    onClick={() => setSelectedMood(m.type)}>
                    <div style={{ fontSize: 32, marginBottom: 6 }}>{m.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: selectedMood === m.type ? '#6366f1' : '#475569' }}>{m.label}</div>
                  </div>
                ))}
              </div>

              {/* 标签 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 10 }}>添加标签（可选）</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {MOOD_TAGS.map(tag => (
                    <button key={tag}
                      onClick={() => toggleTag(tag)}
                      style={{
                        padding: '6px 14px', borderRadius: 20, border: 'none', fontSize: 12, fontWeight: 600,
                        background: selectedTags.includes(tag) ? '#6366f1' : '#f1f5f9',
                        color: selectedTags.includes(tag) ? '#fff' : '#475569',
                        cursor: 'pointer', transition: '0.2s'
                      }}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* 备注 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>写点什么（可选）</div>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="今天发生了什么..."
                  style={{ width: '100%', height: 80, padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, resize: 'none', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* 打卡按钮 */}
              <button
                onClick={handleCheckIn}
                disabled={!selectedMood || saving}
                style={{
                  width: '100%', padding: 14, borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 700,
                  background: !selectedMood ? '#e2e8f0' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: !selectedMood ? '#94a3b8' : '#fff',
                  cursor: !selectedMood ? 'not-allowed' : 'pointer'
                }}>
                {saving ? '保存中...' : todayMood ? '更新心情' : '✨ 打卡'}
              </button>
            </div>

            {/* 统计 */}
            {stats && (
              <div className="mood-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>📊 近30天统计</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                  <div style={{ padding: 16, background: '#f8fafc', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#6366f1' }}>{stats.totalDays}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>打卡天数</div>
                  </div>
                  <div style={{ padding: 16, background: '#f8fafc', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>{stats.avgScore}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>平均心情</div>
                  </div>
                  <div style={{ padding: 16, background: '#f8fafc', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b' }}>
                      {Object.entries(stats.typeCount).sort((a, b) => b[1] - a[1])[0]?.[0] ? MOOD_TYPES.find(m => m.type === Object.entries(stats.typeCount).sort((a, b) => b[1] - a[1])[0]?.[0])?.icon : '-'}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>最常心情</div>
                  </div>
                </div>

                {/* 心情分布 */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {Object.entries(stats.typeCount).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                    const mood = MOOD_TYPES.find(m => m.type === type);
                    return mood ? (
                      <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#f8fafc', borderRadius: 8 }}>
                        <span>{mood.icon}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{count}天</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 右侧：日历 */}
          <div className="mood-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 14 }}>←</button>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
              </h3>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 14 }}>→</button>
            </div>

            {/* 星期标题 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
              {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#94a3b8', padding: 8 }}>{d}</div>
              ))}
            </div>

            {/* 日历格子 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {renderCalendar()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
