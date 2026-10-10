import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const menuItems = [
  { id: 'dashboard', label: '洞察报告', icon: '📊', path: '/dashboard' },
  { id: 'perception', label: '多维度感知', icon: '🔍', path: '/perception' },
  { id: 'mental-health', label: '心理健康测试', icon: '🧠', path: '/mental-health' },
  { id: 'astrology', label: '星盘分析', icon: '✨', path: '/astrology' },
  { id: 'art-therapy', label: '艺术疗愈', icon: '🎨', path: '/art-therapy' },
  { id: 'diary', label: '每日日记', icon: '📝', path: '/diary' },
  { id: 'dream', label: 'AI梦境解析', icon: '🌙', path: '/dream' },
  { id: 'personality', label: '平行人格剧场', icon: '🎭', path: '/personality' },
  { id: 'advisor', label: '数字心理医生', icon: '🩺', path: '/advisor' },
  { id: 'digital-human', label: '数字人', icon: '🤖', path: '/digital-human' },
  { id: 'admin', label: '管理员控制台', icon: '🛡️', path: '/admin' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPage = menuItems.find(item => item.path === location.pathname);

  return (
    <div style={{display:'flex',height:'100vh',background:'#f0f2f5'}}>
      {/* 侧边栏 */}
      <nav style={{width:280,background:'#fff',borderRight:'1px solid #e8e8e8',display:'flex',flexDirection:'column',flexShrink:0}}>
        <div style={{padding:24,borderBottom:'1px solid #e8e8e8',display:'flex',alignItems:'center',gap:14}}>
          <img src="/logo.png" alt="AI心理健康卫士" style={{width:48,height:48,borderRadius:14,objectFit:'cover'}}/>
          <div style={{fontSize:17,fontWeight:700,color:'#1a1a2e'}}>AI心理健康卫士</div>
        </div>
        <div style={{flex:1,padding:'16px 12px',overflowY:'auto'}}>
          <div style={{marginBottom:24}}>
            <div style={{fontSize:11,fontWeight:600,color:'#999',textTransform:'uppercase',letterSpacing:1,padding:'0 14px',marginBottom:8}}>核心</div>
            <div onClick={()=>navigate('/dashboard')} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderRadius:12,cursor:'pointer',background:location.pathname==='/dashboard'?'#667eea':'transparent',color:location.pathname==='/dashboard'?'#fff':'#666',fontWeight:500,fontSize:14,transition:'0.15s',marginBottom:4}}>
              <span style={{fontSize:22}}>📊</span>洞察报告
            </div>
          </div>
          <div style={{marginBottom:24}}>
            <div style={{fontSize:11,fontWeight:600,color:'#999',textTransform:'uppercase',letterSpacing:1,padding:'0 14px',marginBottom:8}}>心理健康</div>
            {[
              {icon:'🧠',label:'心理健康测试',path:'/mental-health'},
              {icon:'✨',label:'星盘分析',path:'/astrology'},
              {icon:'📝',label:'每日日记',path:'/diary'}
            ].map(item=>(
              <div key={item.path} onClick={()=>navigate(item.path)} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderRadius:12,cursor:'pointer',background:location.pathname===item.path?'#667eea':'transparent',color:location.pathname===item.path?'#fff':'#666',fontWeight:500,fontSize:14,transition:'0.15s',marginBottom:4}}>
                <span style={{fontSize:22}}>{item.icon}</span>{item.label}
              </div>
            ))}
          </div>
          <div style={{marginBottom:24}}>
            <div style={{fontSize:11,fontWeight:600,color:'#999',textTransform:'uppercase',letterSpacing:1,padding:'0 14px',marginBottom:8}}>艺术疗愈</div>
            {[
              {icon:'🎨',label:'艺术疗愈',path:'/art-therapy'},
              {icon:'🎭',label:'平行人格剧场',path:'/personality'}
            ].map(item=>(
              <div key={item.path} onClick={()=>navigate(item.path)} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderRadius:12,cursor:'pointer',background:location.pathname===item.path?'#667eea':'transparent',color:location.pathname===item.path?'#fff':'#666',fontWeight:500,fontSize:14,transition:'0.15s',marginBottom:4}}>
                <span style={{fontSize:22}}>{item.icon}</span>{item.label}
              </div>
            ))}
          </div>
          <div style={{marginBottom:24}}>
            <div style={{fontSize:11,fontWeight:600,color:'#999',textTransform:'uppercase',letterSpacing:1,padding:'0 14px',marginBottom:8}}>智能助手</div>
            <div onClick={()=>navigate('/dream')} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderRadius:12,cursor:'pointer',background:location.pathname==='/dream'?'#667eea':'transparent',color:location.pathname==='/dream'?'#fff':'#666',fontWeight:500,fontSize:14,transition:'0.15s',marginBottom:4}}>
              <span style={{fontSize:22}}>🌙</span>AI梦境解析
            </div>
            <div onClick={()=>navigate('/advisor')} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderRadius:12,cursor:'pointer',background:location.pathname==='/advisor'?'#667eea':'transparent',color:location.pathname==='/advisor'?'#fff':'#666',fontWeight:500,fontSize:14,transition:'0.15s',marginBottom:4}}>
              <span style={{fontSize:22}}>🩺</span>数字心理医生
            </div>
            <div onClick={()=>navigate('/digital-human')} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderRadius:12,cursor:'pointer',background:location.pathname==='/digital-human'?'#667eea':'transparent',color:location.pathname==='/digital-human'?'#fff':'#666',fontWeight:500,fontSize:14,transition:'0.15s',marginBottom:4}}>
              <span style={{fontSize:22}}>🤖</span>数字人
            </div>
            <div onClick={()=>navigate('/campus')} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderRadius:12,cursor:'pointer',background:location.pathname==='/campus'?'#667eea':'transparent',color:location.pathname==='/campus'?'#fff':'#666',fontWeight:500,fontSize:14,transition:'0.15s',marginBottom:4}}>
              <span style={{fontSize:22}}>🏫</span>校园数据
            </div>
            <div onClick={()=>navigate('/achievement')} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderRadius:12,cursor:'pointer',background:location.pathname==='/achievement'?'#667eea':'transparent',color:location.pathname==='/achievement'?'#fff':'#666',fontWeight:500,fontSize:14,transition:'0.15s',marginBottom:4}}>
              <span style={{fontSize:22}}>🏆</span>成就系统
            </div>
            <div onClick={()=>navigate('/dashboard-screen')} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderRadius:12,cursor:'pointer',background:location.pathname==='/dashboard-screen'?'#667eea':'transparent',color:location.pathname==='/dashboard-screen'?'#fff':'#666',fontWeight:500,fontSize:14,transition:'0.15s',marginBottom:4}}>
              <span style={{fontSize:22}}>📊</span>数据大屏
            </div>
            <div onClick={()=>navigate('/mood')} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderRadius:12,cursor:'pointer',background:location.pathname==='/mood'?'#667eea':'transparent',color:location.pathname==='/mood'?'#fff':'#666',fontWeight:500,fontSize:14,transition:'0.15s',marginBottom:4}}>
              <span style={{fontSize:22}}>😊</span>心情打卡
            </div>
            <div onClick={()=>navigate('/report')} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderRadius:12,cursor:'pointer',background:location.pathname==='/report'?'#667eea':'transparent',color:location.pathname==='/report'?'#fff':'#666',fontWeight:500,fontSize:14,transition:'0.15s',marginBottom:4}}>
              <span style={{fontSize:22}}>📊</span>周报月报
            </div>
          </div>
          {user?.role === 'admin' && (
            <div style={{marginBottom:24}}>
              <div style={{fontSize:11,fontWeight:600,color:'#999',textTransform:'uppercase',letterSpacing:1,padding:'0 14px',marginBottom:8}}>管理</div>
              <div onClick={()=>navigate('/admin')} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderRadius:12,cursor:'pointer',background:location.pathname==='/admin'?'#e53e3e':'transparent',color:location.pathname==='/admin'?'#fff':'#666',fontWeight:500,fontSize:14,transition:'0.15s',marginBottom:4}}>
                <span style={{fontSize:22}}>🛡️</span>管理员控制台
              </div>
            </div>
          )}
        </div>
        <div style={{padding:'16px 20px',borderTop:'1px solid #e8e8e8'}}>
          <div style={{display:'flex',alignItems:'center',gap:12,padding:12,background:'#f5f5f5',borderRadius:12}}>
            <div style={{width:40,height:40,background:'#667eea',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:16}}>{user?.username?.[0]?.toUpperCase()||'U'}</div>
            <div><div style={{fontSize:14,fontWeight:600,color:'#333'}}>{user?.username}</div><div style={{fontSize:12,color:'#999'}}>{user?.role==='admin'?'管理员':'用户'}</div></div>
          </div>
          <button onClick={()=>{logout();navigate('/login')}} style={{width:'100%',marginTop:8,padding:8,background:'none',border:'none',color:'#999',fontSize:13,cursor:'pointer',borderRadius:8}}>退出登录</button>
        </div>
      </nav>

      {/* 主内容 */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <header style={{height:68,background:'#fff',borderBottom:'1px solid #e8e8e8',padding:'0 32px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontSize:20,fontWeight:700,color:'#1a1a2e'}}>{currentPage?.label||'洞察报告'}</div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={()=>navigate('/settings')} style={{width:42,height:42,borderRadius:10,border:'1px solid #e8e8e8',background:'#fff',fontSize:20,cursor:'pointer'}}>⚙️</button>
          </div>
        </header>
        <main style={{flex:1,padding:'24px 32px',overflowY:'auto'}}>
          <Outlet/>
        </main>
      </div>
    </div>
  );
}
