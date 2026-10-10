import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!username || !password) { setError('请输入用户名和密码'); setLoading(false); return; }
    if (!isLogin) {
      if (password.length < 6) { setError('密码至少6位'); setLoading(false); return; }
      if (password !== confirmPassword) { setError('密码不一致'); setLoading(false); return; }
    }
    try {
      const result = isLogin ? await login(username, password) : await register(username, password, email);
      if (!result.success) setError(result.error);
    } catch { setError('操作失败'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)'}}>
      <div style={{width:440,background:'#fff',borderRadius:24,padding:48,boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>
        <div style={{textAlign:'center',marginBottom:36}}>
          <img src="/logo.png" alt="AI心理健康卫士" style={{width:80,height:80,margin:'0 auto 16px',borderRadius:20,objectFit:'cover'}}/>
          <div style={{fontSize:26,fontWeight:800,color:'#1a1a2e'}}>AI心理健康卫士</div>
          <div style={{fontSize:14,color:'#999',marginTop:6}}>智能心理健康服务平台</div>
        </div>
        <div style={{display:'flex',background:'#f5f5f5',borderRadius:10,padding:4,marginBottom:28}}>
          <button onClick={()=>{setIsLogin(true);setError('')}} style={{flex:1,padding:10,border:'none',borderRadius:8,background:isLogin?'#667eea':'transparent',color:isLogin?'#fff':'#999',fontWeight:600,fontSize:14,cursor:'pointer',transition:'0.2s'}}>登录</button>
          <button onClick={()=>{setIsLogin(false);setError('')}} style={{flex:1,padding:10,border:'none',borderRadius:8,background:!isLogin?'#667eea':'transparent',color:!isLogin?'#fff':'#999',fontWeight:600,fontSize:14,cursor:'pointer',transition:'0.2s'}}>注册</button>
        </div>
        {error && <div style={{padding:'10px 14px',background:'#fff0f0',borderRadius:8,color:'#e53e3e',fontSize:13,marginBottom:16}}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom:18}}>
            <label style={{display:'block',fontSize:13,fontWeight:600,color:'#555',marginBottom:6}}>用户名</label>
            <input value={username} onChange={e=>setUsername(e.target.value)} className="input-field" placeholder="请输入用户名"/>
          </div>
          <div style={{marginBottom:18}}>
            <label style={{display:'block',fontSize:13,fontWeight:600,color:'#555',marginBottom:6}}>密码</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="input-field" placeholder="请输入密码"/>
          </div>
          {!isLogin && <>
            <div style={{marginBottom:18}}>
              <label style={{display:'block',fontSize:13,fontWeight:600,color:'#555',marginBottom:6}}>确认密码</label>
              <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="input-field" placeholder="再次输入密码"/>
            </div>
            <div style={{marginBottom:18}}>
              <label style={{display:'block',fontSize:13,fontWeight:600,color:'#555',marginBottom:6}}>邮箱（可选）</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="input-field" placeholder="请输入邮箱"/>
            </div>
          </>}
          <button type="submit" disabled={loading} className="btn-primary" style={{width:'100%'}}>
            {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
          </button>
        </form>
      </div>
    </div>
  );
}
