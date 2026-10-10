import { useState } from 'react';
import { astrologyAPI } from '../services/api';

const MBTI_TYPES = ['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'];

export default function AstrologyPage() {
  const [tab, setTab] = useState('mbti');
  const [mbti, setMbti] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [place, setPlace] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const analyze = async () => {
    if (!mbti) return alert('请选择MBTI类型');
    setLoading(true);
    try { const r = await astrologyAPI.analyzeMBTI({ mbtiType: mbti }); setResult(r.data); }
    catch { alert('分析失败'); } finally { setLoading(false); }
  };

  const test = async () => {
    if (!date||!time||!place) return alert('请填写完整信息');
    setLoading(true);
    try { const r = await astrologyAPI.testAstrology({ birthDate: date, birthTime: time, birthPlace: place }); setResult({ analysis: r.data.analysis }); }
    catch { alert('测试失败'); } finally { setLoading(false); }
  };

  return (
    <div style={{display:'grid',gridTemplateColumns:'320px 1fr',gap:24}}>
      <div className="card" style={{padding:24}}>
        <h2 style={{fontSize:20,fontWeight:700,color:'#1a1a2e',marginBottom:20}}>星盘分析</h2>
        <div style={{display:'flex',gap:4,padding:4,background:'#f5f5f5',borderRadius:8,marginBottom:20}}>
          {[{id:'mbti',label:'MBTI'},{id:'test',label:'星盘'}].map(t=>(
            <button key={t.id} onClick={()=>{setTab(t.id);setResult(null)}} style={{flex:1,padding:8,border:'none',borderRadius:6,background:tab===t.id?'#667eea':'transparent',color:tab===t.id?'#fff':'#999',fontWeight:600,fontSize:12,cursor:'pointer',transition:'0.15s'}}>{t.label}</button>
          ))}
        </div>
        {tab==='mbti'?(
          <div>
            <label style={{display:'block',fontSize:12,fontWeight:600,color:'#666',marginBottom:8}}>MBTI类型</label>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:16}}>
              {MBTI_TYPES.map(t=>(
                <button key={t} onClick={()=>setMbti(t)} style={{padding:'8px 4px',borderRadius:6,border:'1px solid',borderColor:mbti===t?'#667eea':'#e8e8e8',background:mbti===t?'#667eea':'#fff',color:mbti===t?'#fff':'#666',fontSize:11,fontWeight:600,cursor:'pointer',transition:'0.15s'}}>{t}</button>
              ))}
            </div>
            <button onClick={analyze} disabled={loading||!mbti} className="btn-primary" style={{width:'100%'}}>{loading?'分析中...':'开始分析'}</button>
          </div>
        ):(
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div><label style={{display:'block',fontSize:12,fontWeight:600,color:'#666',marginBottom:6}}>出生日期</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="input-field"/></div>
            <div><label style={{display:'block',fontSize:12,fontWeight:600,color:'#666',marginBottom:6}}>出生时间</label><input type="time" value={time} onChange={e=>setTime(e.target.value)} className="input-field"/></div>
            <div><label style={{display:'block',fontSize:12,fontWeight:600,color:'#666',marginBottom:6}}>出生地点</label><input value={place} onChange={e=>setPlace(e.target.value)} placeholder="例如：北京" className="input-field"/></div>
            <button onClick={test} disabled={loading||!date||!time||!place} className="btn-primary" style={{width:'100%'}}>{loading?'分析中...':'开始测试'}</button>
          </div>
        )}
      </div>
      <div className="card" style={{padding:32}}>
        {result?(
          <div>
            <h2 style={{fontSize:20,fontWeight:700,color:'#1a1a2e',marginBottom:24}}>分析结果</h2>
            {result.mbtiType&&<div style={{padding:20,background:'#f5f5f5',borderRadius:12,marginBottom:20,textAlign:'center'}}><div style={{fontSize:12,color:'#999',marginBottom:8}}>您的MBTI类型</div><div style={{fontSize:32,fontWeight:700,color:'#667eea'}}>{result.mbtiType}</div></div>}
            {result.dominantSign&&<div style={{padding:20,background:'#f5f5f5',borderRadius:12,marginBottom:20,textAlign:'center'}}><div style={{fontSize:12,color:'#999',marginBottom:8}}>最匹配的星座</div><div style={{fontSize:24,fontWeight:700,color:'#667eea'}}>{result.dominantSign}</div></div>}
            {result.topMatches&&<div style={{marginBottom:20}}><h3 style={{fontSize:14,fontWeight:600,color:'#333',marginBottom:12}}>星座匹配度</h3><div style={{display:'flex',flexDirection:'column',gap:8}}>{result.topMatches.map((m,i)=>(<div key={i} style={{display:'flex',alignItems:'center',gap:12}}><div style={{width:60,fontSize:13,fontWeight:600,color:'#333'}}>{m.sign}</div><div style={{flex:1,height:6,background:'#f0f0f0',borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',width:`${m.probability}%`,background:'#667eea',borderRadius:3,transition:'width 0.5s'}}></div></div><div style={{width:40,fontSize:12,color:'#999',textAlign:'right'}}>{m.probability}%</div></div>))}</div></div>}
            {result.personalityTraits&&<div style={{marginBottom:20}}><h3 style={{fontSize:14,fontWeight:600,color:'#333',marginBottom:8}}>性格特质</h3><div style={{display:'flex',flexWrap:'wrap',gap:6}}>{result.personalityTraits.map((t,i)=><span key={i} style={{padding:'4px 10px',background:'#f0f0ff',color:'#667eea',borderRadius:6,fontSize:12,fontWeight:600}}>{t}</span>)}</div></div>}
            {result.recommendation&&<div style={{padding:16,background:'#f5f5f5',borderRadius:8}}><h3 style={{fontSize:14,fontWeight:600,color:'#333',marginBottom:8}}>建议</h3><p style={{fontSize:13,color:'#666',lineHeight:1.6}}>{result.recommendation}</p></div>}
            {result.analysis&&<div style={{marginTop:16,padding:16,background:'#f5f5f5',borderRadius:8}}><h3 style={{fontSize:14,fontWeight:600,color:'#333',marginBottom:8}}>详细分析</h3><p style={{fontSize:13,color:'#666',lineHeight:1.6,whiteSpace:'pre-line'}}>{result.analysis}</p></div>}
          </div>
        ):<div style={{textAlign:'center',padding:64}}><div style={{fontSize:64,marginBottom:16,opacity:0.5}}>✨</div><h3 style={{fontSize:16,fontWeight:600,color:'#999'}}>选择分析方式</h3></div>}
      </div>
    </div>
  );
}
