import { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api';

export default function AdvisorPage() {
  const [messages, setMessages] = useState([{ role: 'ai', text: '您好！我是您的数字心理医生，可以为您提供心理咨询和情绪支持。请问有什么可以帮您的？' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [sessionId] = useState('session-' + Date.now());
  const chatEnd = useRef(null);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    try {
      const r = await chatAPI.getSessions();
      setHistory(r.sessions || []);
    } catch {}
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const r = await chatAPI.send({ message: msg, sessionId, moduleType: 'advisor' });
      setMessages(prev => [...prev, { role: 'ai', text: r.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: '抱歉，暂时无法回复。' }]);
    } finally { setLoading(false); }
  };

  const clearChat = async () => {
    try {
      await chatAPI.clearHistory({ sessionId });
      setMessages([{ role: 'ai', text: '对话已清空。请问有什么可以帮您的？' }]);
    } catch {}
  };

  const quickActions = [
    { label: '学习方法', msg: '请给我一些高效学习方法的建议' },
    { label: '时间管理', msg: '如何更好地管理时间？' },
    { label: '考试压力', msg: '我最近考试压力很大，怎么办？' },
    { label: '人际关系', msg: '如何改善人际关系？' },
    { label: '情绪调节', msg: '心情不好时如何调节情绪？' },
    { label: '职业规划', msg: '如何进行职业规划？' }
  ];

  return (
    <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:24,height:'100%'}}>
      {/* 左侧：历史和快捷操作 */}
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div className="card" style={{padding:20}}>
          <h3 style={{fontSize:14,fontWeight:600,color:'#333',marginBottom:12}}>快捷操作</h3>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {quickActions.map((a,i)=>(
              <button key={i} onClick={()=>setInput(a.msg)} style={{padding:'10px 12px',background:'#f5f5f5',border:'1px solid #e8e8e8',borderRadius:8,cursor:'pointer',fontSize:13,color:'#666',textAlign:'left',transition:'0.15s'}}
                onMouseEnter={e=>{e.target.style.borderColor='#667eea';e.target.style.color='#667eea'}}
                onMouseLeave={e=>{e.target.style.borderColor='#e8e8e8';e.target.style.color='#666'}}>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{padding:20,flex:1,overflowY:'auto'}}>
          <h3 style={{fontSize:14,fontWeight:600,color:'#333',marginBottom:12}}>对话历史</h3>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {history.length > 0 ? history.map((h,i)=>(
              <div key={i} style={{padding:'8px 10px',background:'#f5f5f5',borderRadius:6,fontSize:12,color:'#666',cursor:'pointer'}}>
                {new Date(h.lastMessage).toLocaleDateString('zh-CN')}
              </div>
            )) : <div style={{fontSize:12,color:'#999'}}>暂无历史记录</div>}
          </div>
        </div>

        <button onClick={clearChat} className="btn-secondary" style={{fontSize:12}}>清空对话</button>
      </div>

      {/* 右侧：聊天区 */}
      <div className="card" style={{padding:0,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        {/* 聊天头部 */}
        <div style={{padding:'16px 24px',borderBottom:'1px solid #e8e8e8',display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:40,height:40,background:'linear-gradient(135deg,#667eea,#764ba2)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>🩺</div>
          <div>
            <div style={{fontSize:15,fontWeight:600,color:'#333'}}>数字心理医生</div>
            <div style={{fontSize:12,color:'#22c55e'}}>在线</div>
          </div>
        </div>

        {/* 消息区 */}
        <div style={{flex:1,overflowY:'auto',padding:24}}>
          {messages.map((m,i)=>(
            <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start',marginBottom:16}}>
              {m.role==='ai'&&<div style={{width:36,height:36,background:'linear-gradient(135deg,#667eea,#764ba2)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,marginRight:10,flexShrink:0}}>🩺</div>}
              <div style={{maxWidth:'70%',padding:'12px 16px',borderRadius:12,background:m.role==='user'?'#667eea':'#f5f5f5',color:m.role==='user'?'#fff':'#333',fontSize:14,lineHeight:1.6}}>
                {m.text}
              </div>
            </div>
          ))}
          {loading&&(
            <div style={{display:'flex',justifyContent:'flex-start',marginBottom:16}}>
              <div style={{width:36,height:36,background:'linear-gradient(135deg,#667eea,#764ba2)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,marginRight:10,flexShrink:0}}>🩺</div>
              <div style={{padding:'12px 16px',borderRadius:12,background:'#f5f5f5'}}>
                <div style={{display:'flex',gap:4}}>{[0,1,2].map(j=><div key={j} style={{width:6,height:6,background:'#999',borderRadius:'50%',animation:`bounce 1.4s infinite ease-in-out ${j*0.16}s`}}></div>)}</div>
              </div>
            </div>
          )}
          <div ref={chatEnd}/>
        </div>
        <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}`}</style>

        {/* 输入区 */}
        <div style={{padding:'16px 24px',borderTop:'1px solid #e8e8e8',display:'flex',gap:10}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyPress={e=>e.key==='Enter'&&send()}
            placeholder="输入您的问题..." className="input-field" style={{flex:1}}/>
          <button onClick={send} disabled={!input.trim()||loading} className="btn-primary">发送</button>
        </div>
      </div>
    </div>
  );
}
