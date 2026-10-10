import { useState, useEffect } from 'react';
import { format, subDays, addDays } from 'date-fns';
import { diaryAPI } from '../services/api';

export default function DiaryPage() {
  const [date, setDate] = useState(new Date());
  const [entries, setEntries] = useState({});
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [trend, setTrend] = useState(null);

  useEffect(() => { load(); loadTrend(); }, [date]);
  const load = async () => { try { const d = format(date,'yyyy-MM-dd'); const r = await diaryAPI.getHistory({startDate:d,endDate:d}); if(r.entries.length){const e=r.entries[0]; setEntries(p=>({...p,[d]:{morning:e.morningText||'',afternoon:e.afternoonText||'',evening:e.eveningText||'',analysis:e.emotionAnalysis}}));}} catch {} };
  const loadTrend = async () => { try { const r = await diaryAPI.getTrend({days:7}); setTrend(r); } catch {} };
  const setText = (t,v) => { const d = format(date,'yyyy-MM-dd'); setEntries(p=>({...p,[d]:{...p[d]||{morning:'',afternoon:'',evening:''},[t]:v}})); };
  const save = async () => { setLoading(true); try { const d=format(date,'yyyy-MM-dd'); const e=entries[d]||{morning:'',afternoon:'',evening:''}; await diaryAPI.save({entryDate:d,morningText:e.morning,afternoonText:e.afternoon,eveningText:e.evening}); alert('保存成功'); } catch { alert('保存失败'); } finally { setLoading(false); } };
  const analyze = async () => { setAnalyzing(true); try { const d=format(date,'yyyy-MM-dd'); const e=entries[d]||{morning:'',afternoon:'',evening:''}; const txt=[e.morning,e.afternoon,e.evening].filter(Boolean).join('\n'); if(!txt){alert('请先填写日记');setAnalyzing(false);return;} const r=await diaryAPI.analyze({entryDate:d,text:txt}); setEntries(p=>({...p,[d]:{...p[d],analysis:r.analysis}})); loadTrend(); } catch { alert('分析失败'); } finally { setAnalyzing(false); } };

  const d = format(date,'yyyy-MM-dd');
  const cur = entries[d]||{morning:'',afternoon:'',evening:''};

  return (
    <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:24}}>
      <div>
        <div className="card" style={{padding:24}}>
          <h2 style={{fontSize:20,fontWeight:700,color:'#1a1a2e',marginBottom:20}}>每日日记</h2>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <button onClick={()=>setDate(p=>subDays(p,1))} style={{width:32,height:32,borderRadius:6,border:'1px solid #e8e8e8',background:'#fff',color:'#666',cursor:'pointer'}}>←</button>
            <div style={{textAlign:'center'}}><div style={{fontSize:24,fontWeight:700,color:'#1a1a2e'}}>{format(date,'dd')}</div><div style={{fontSize:12,color:'#999'}}>{format(date,'yyyy年MM月')}</div></div>
            <button onClick={()=>setDate(p=>addDays(p,1))} style={{width:32,height:32,borderRadius:6,border:'1px solid #e8e8e8',background:'#fff',color:'#666',cursor:'pointer'}}>→</button>
          </div>
          <div style={{display:'flex',gap:4}}>
            {[0,1,2,3,4,5,6].map(i=>{const dt=subDays(new Date(),i);const sel=format(dt,'yyyy-MM-dd')===d;return(<button key={i} onClick={()=>setDate(dt)} style={{flex:1,padding:'6px 2px',borderRadius:4,border:'none',background:sel?'#667eea':'#f5f5f5',color:sel?'#fff':'#999',fontSize:10,fontWeight:600,cursor:'pointer',transition:'0.15s'}}>{format(dt,'MM/dd')}</button>);})}
          </div>
        </div>
        {trend&&trend.trend.length>0&&<div className="card" style={{padding:20,marginTop:16}}><h3 style={{fontSize:14,fontWeight:600,color:'#333',marginBottom:12}}>情绪趋势</h3><div style={{display:'flex',alignItems:'flex-end',gap:4,height:80}}>{trend.trend.map((t,i)=>(<div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center'}}><div style={{width:'100%',height:`${Math.max(t.score*100,8)}%`,background:t.emotion==='positive'?'#22c55e':t.emotion==='negative'?'#e53e3e':'#999',borderRadius:'2px 2px 0 0'}}></div><div style={{fontSize:9,color:'#999',marginTop:4}}>{format(new Date(t.date),'MM/dd')}</div></div>))}</div></div>}
      </div>
      <div>
        <div className="card" style={{padding:24}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
            <h2 style={{fontSize:18,fontWeight:700,color:'#1a1a2e'}}>{format(date,'yyyy年MM月dd日')}</h2>
            <div style={{display:'flex',gap:8}}>
              <button onClick={save} disabled={loading} className="btn-secondary" style={{fontSize:12,padding:'8px 16px'}}>{loading?'保存中...':'保存'}</button>
              <button onClick={analyze} disabled={analyzing} className="btn-primary" style={{fontSize:12,padding:'8px 16px'}}>{analyzing?'分析中...':'分析情绪'}</button>
            </div>
          </div>
          {[{t:'morning',i:'🌅',l:'早晨'},{t:'afternoon',i:'☀️',l:'下午'},{t:'evening',i:'🌙',l:'晚上'}].map(s=>(
            <div key={s.t} style={{marginBottom:16}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}><span style={{fontSize:14}}>{s.i}</span><span style={{fontSize:13,fontWeight:600,color:'#666'}}>{s.l}</span></div>
              <textarea value={cur[s.t]} onChange={e=>setText(s.t,e.target.value)} placeholder={`记录${s.l}的心情...`} style={{width:'100%',height:100,padding:12,background:'#f5f5f5',border:'1px solid #e8e8e8',borderRadius:8,color:'#333',fontSize:13,resize:'none',outline:'none',transition:'0.15s'}} onFocus={e=>e.target.style.borderColor='#667eea'} onBlur={e=>e.target.style.borderColor='#e8e8e8'}/>
            </div>
          ))}
        </div>
        {cur.analysis&&<div className="card" style={{padding:20,marginTop:16}}><h3 style={{fontSize:14,fontWeight:600,color:'#333',marginBottom:12}}>情绪分析</h3><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}><div style={{padding:12,background:'#f5f5f5',borderRadius:8}}><div style={{fontSize:11,color:'#999',marginBottom:4}}>情绪状态</div><div style={{fontSize:14,fontWeight:600,color:'#333'}}>{cur.analysis.emotion==='positive'?'😊 积极':cur.analysis.emotion==='negative'?'😢 消极':'😐 平静'}</div></div><div style={{padding:12,background:'#f5f5f5',borderRadius:8}}><div style={{fontSize:11,color:'#999',marginBottom:4}}>情绪分数</div><div style={{fontSize:14,fontWeight:600,color:'#333'}}>{Math.round((cur.analysis.emotionScore||0.5)*100)}%</div></div></div>{cur.analysis.aiAnalysis&&<div style={{padding:12,background:'#f5f5f5',borderRadius:8}}><div style={{fontSize:12,fontWeight:600,color:'#333',marginBottom:6}}>AI分析</div><p style={{fontSize:12,color:'#666',lineHeight:1.6}}>{cur.analysis.aiAnalysis}</p></div>}</div>}
      </div>
    </div>
  );
}
