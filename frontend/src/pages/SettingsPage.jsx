import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({
    username: '', email: '', phone: '', nickname: '', bio: '', avatar: ''
  });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [preferences, setPreferences] = useState({
    theme: 'light', notifications: true, emailNotify: false, language: 'zh-CN'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || '',
        email: user.email || '',
        phone: user.profile?.phone || '',
        nickname: user.profile?.nickname || '',
        bio: user.profile?.bio || '',
        avatar: user.profile?.avatar || ''
      });
      if (user.profile?.preferences) {
        setPreferences(prev => ({ ...prev, ...user.profile.preferences }));
      }
    }
  }, [user]);

  const getToken = () => localStorage.getItem('token');

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({
          profile: {
            phone: profileForm.phone,
            nickname: profileForm.nickname,
            bio: profileForm.bio,
            avatar: profileForm.avatar,
            preferences
          }
        })
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('success', '资料更新成功');
        if (updateUser) updateUser({ ...user, profile: { ...user.profile, ...data.profile } });
      } else {
        showMessage('error', data.error || '更新失败');
      }
    } catch (e) { showMessage('error', '网络错误'); }
    finally { setLoading(false); }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      showMessage('error', '请填写完整信息');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showMessage('error', '新密码长度至少6位');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('error', '两次密码不一致');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('success', '密码修改成功');
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showMessage('error', data.error || '修改失败');
      }
    } catch (e) { showMessage('error', '网络错误'); }
    finally { setLoading(false); }
  };

  const tabs = [
    { key: 'profile', label: '个人资料', icon: '👤' },
    { key: 'password', label: '修改密码', icon: '🔒' },
    { key: 'preferences', label: '偏好设置', icon: '⚙️' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <style>{`
        .settings-card { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; }
        .settings-input { width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid #e2e8f0; font-size: 14px; outline: none; transition: 0.2s; box-sizing: border-box; }
        .settings-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        .settings-btn { padding: 12px 24px; border-radius: 10px; border: none; font-size: 14px; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .settings-btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; }
        .settings-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,0.3); }
        .settings-btn-secondary { background: #f1f5f9; color: #475569; }
        .settings-btn-secondary:hover { background: #e2e8f0; }
      `}</style>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', margin: 0 }}>⚙️ 设置</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: '6px 0 0' }}>管理您的个人资料和偏好设置</p>
        </div>

        {/* 消息提示 */}
        {message.text && (
          <div style={{
            padding: '12px 20px', borderRadius: 10, marginBottom: 20,
            background: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
            borderLeft: `4px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: message.type === 'success' ? '#10b981' : '#ef4444',
            fontSize: 13, fontWeight: 600
          }}>
            {message.type === 'success' ? '✅ ' : '❌ '}{message.text}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20 }}>
          {/* 左侧标签 */}
          <div className="settings-card" style={{ padding: 16, height: 'fit-content' }}>
            {tabs.map(tab => (
              <div key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10,
                  cursor: 'pointer', transition: '0.2s', marginBottom: 4,
                  background: activeTab === tab.key ? '#eef2ff' : 'transparent',
                  color: activeTab === tab.key ? '#6366f1' : '#475569',
                  fontWeight: activeTab === tab.key ? 600 : 400
                }}>
                <span style={{ fontSize: 18 }}>{tab.icon}</span>
                <span style={{ fontSize: 13 }}>{tab.label}</span>
              </div>
            ))}
          </div>

          {/* 右侧内容 */}
          <div className="settings-card" style={{ padding: 28 }}>
            {/* 个人资料 */}
            {activeTab === 'profile' && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 24 }}>个人资料</h2>
                
                {/* 头像 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: 20,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 32, color: '#fff', fontWeight: 700
                  }}>
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>{profileForm.nickname || profileForm.username}</div>
                    <div style={{ fontSize: 13, color: '#94a3b8' }}>{user?.role === 'admin' ? '管理员' : '用户'}</div>
                  </div>
                </div>

                {/* 表单 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>用户名</label>
                    <input className="settings-input" value={profileForm.username} disabled style={{ background: '#f8fafc', color: '#94a3b8' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>昵称</label>
                    <input className="settings-input" value={profileForm.nickname}
                      onChange={e => setProfileForm(f => ({ ...f, nickname: e.target.value }))}
                      placeholder="设置一个昵称" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>邮箱</label>
                    <input className="settings-input" value={profileForm.email}
                      onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="your@email.com" type="email" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>手机号</label>
                    <input className="settings-input" value={profileForm.phone}
                      onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="请输入手机号" />
                  </div>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>个人简介</label>
                  <textarea className="settings-input" value={profileForm.bio}
                    onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))}
                    placeholder="介绍一下自己..."
                    style={{ height: 80, resize: 'none' }} />
                </div>
                <button onClick={handleUpdateProfile} disabled={loading} className="settings-btn settings-btn-primary">
                  {loading ? '保存中...' : '保存修改'}
                </button>
              </div>
            )}

            {/* 修改密码 */}
            {activeTab === 'password' && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 24 }}>修改密码</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>当前密码</label>
                    <input className="settings-input" type="password" value={passwordForm.oldPassword}
                      onChange={e => setPasswordForm(f => ({ ...f, oldPassword: e.target.value }))}
                      placeholder="请输入当前密码" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>新密码</label>
                    <input className="settings-input" type="password" value={passwordForm.newPassword}
                      onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                      placeholder="至少6位" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>确认新密码</label>
                    <input className="settings-input" type="password" value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                      placeholder="再次输入新密码" />
                  </div>
                  <button onClick={handleChangePassword} disabled={loading} className="settings-btn settings-btn-primary" style={{ width: 'fit-content' }}>
                    {loading ? '修改中...' : '修改密码'}
                  </button>
                </div>
              </div>
            )}

            {/* 偏好设置 */}
            {activeTab === 'preferences' && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 24 }}>偏好设置</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* 主题 */}
                  <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>主题模式</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>选择界面主题</div>
                      </div>
                      <select value={preferences.theme}
                        onChange={e => setPreferences(p => ({ ...p, theme: e.target.value }))}
                        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none' }}>
                        <option value="light">浅色模式</option>
                        <option value="dark">深色模式</option>
                        <option value="auto">跟随系统</option>
                      </select>
                    </div>
                  </div>

                  {/* 通知 */}
                  <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>站内通知</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>接收系统通知和预警</div>
                      </div>
                      <div onClick={() => setPreferences(p => ({ ...p, notifications: !p.notifications }))}
                        style={{
                          width: 48, height: 26, borderRadius: 13, cursor: 'pointer', transition: '0.2s',
                          background: preferences.notifications ? '#6366f1' : '#cbd5e1',
                          position: 'relative'
                        }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: 11, background: '#fff',
                          position: 'absolute', top: 2, left: preferences.notifications ? 24 : 2,
                          transition: '0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                        }}></div>
                      </div>
                    </div>
                  </div>

                  {/* 邮件通知 */}
                  <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>邮件通知</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>通过邮件接收重要通知</div>
                      </div>
                      <div onClick={() => setPreferences(p => ({ ...p, emailNotify: !p.emailNotify }))}
                        style={{
                          width: 48, height: 26, borderRadius: 13, cursor: 'pointer', transition: '0.2s',
                          background: preferences.emailNotify ? '#6366f1' : '#cbd5e1',
                          position: 'relative'
                        }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: 11, background: '#fff',
                          position: 'absolute', top: 2, left: preferences.emailNotify ? 24 : 2,
                          transition: '0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                        }}></div>
                      </div>
                    </div>
                  </div>

                  {/* 语言 */}
                  <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>语言</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>选择界面语言</div>
                      </div>
                      <select value={preferences.language}
                        onChange={e => setPreferences(p => ({ ...p, language: e.target.value }))}
                        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none' }}>
                        <option value="zh-CN">简体中文</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button onClick={handleUpdateProfile} disabled={loading} className="settings-btn settings-btn-primary" style={{ marginTop: 24 }}>
                  {loading ? '保存中...' : '保存设置'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
