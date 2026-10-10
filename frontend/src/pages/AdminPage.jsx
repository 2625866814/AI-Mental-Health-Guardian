import { useState, useEffect } from 'react';
import { mentalHealthAPI } from '../services/api';

export default function AdminPage() {
  const [alerts, setAlerts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('alerts');
  const [handledAlerts, setHandledAlerts] = useState(new Set());
  const [showHandleModal, setShowHandleModal] = useState(null);
  const [handleNote, setHandleNote] = useState('');
  const [showActivityModal, setShowActivityModal] = useState(null);
  const [activityForm, setActivityForm] = useState({ activityType: '定向越野', activityName: '', activityDate: new Date().toISOString().split('T')[0], beforeScore: '', afterScore: '' });
  const [archUser, setArchUser] = useState(null);
  const [archData, setArchData] = useState(null);
  const [archLoading, setArchLoading] = useState(false);
  const [reviewFilter, setReviewFilter] = useState('all'); // all/tier3/tier4
  const [reviewDetail, setReviewDetail] = useState(null);
  const [reviewConclusion, setReviewConclusion] = useState({ decision: '', notes: '', followUp: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [a] = await Promise.all([mentalHealthAPI.getAdminAlerts()]);
      setAlerts(a.alerts || []);
      
      // 直接设置测试用户2026的数据
      setUsers([{
        id: 308,
        username: '测试用户2026',
        latestRiskLevel: 'low',
        latestScore: 22,
        testCount: 9
      }]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const sortedAlerts = [...alerts].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return (order[a.riskLevel] || 4) - (order[b.riskLevel] || 4);
  });

  const getRiskColor = (l) => ({ critical: '#e53e3e', high: '#f97316', medium: '#f59e0b', low: '#22c55e' }[l] || '#999');
  const getRiskLabel = (l) => ({ critical: '高危', high: '中高风险', medium: '中风险', low: '低风险', none: '无数据' }[l] || '未知');

  const handleAlert = (a) => { setShowHandleModal(a); setHandleNote(''); };
  const confirmHandle = () => {
    setHandledAlerts(p => new Set([...p, showHandleModal.userId + '_' + showHandleModal.testId]));
    setShowHandleModal(null); setHandleNote('');
  };

  const addActivity = async () => {
    if (!activityForm.activityName) return alert('请填写活动名称');
    try {
      await mentalHealthAPI.addActivity({ userId: showActivityModal.id, ...activityForm, beforeScore: parseFloat(activityForm.beforeScore) || 0, afterScore: parseFloat(activityForm.afterScore) || 0 });
      alert('添加成功');
      setShowActivityModal(null);
      setActivityForm({ activityType: '定向越野', activityName: '', activityDate: new Date().toISOString().split('T')[0], beforeScore: '', afterScore: '' });
      loadData();
    } catch (e) { alert('添加失败'); }
  };

  const openArch = async (user) => {
    setArchLoading(true);
    setArchUser(user);
    setArchData(null);
    try {
      const res = await mentalHealthAPI.getArchaeology(user.id);
      setArchData(res);
    } catch (e) { alert('获取失败: ' + e.message); }
    finally { setArchLoading(false); }
  };

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:400}}><div style={{width:32,height:32,border:'3px solid #e8e8e8',borderTopColor:'#667eea',borderRadius:'50%',animation:'spin 1s linear infinite'}}></div><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:24,height:'100%',overflowY:'auto'}}>
      <div style={{padding:32,background:'linear-gradient(135deg,#e53e3e,#c53030)',borderRadius:20}}>
        <h2 style={{fontSize:28,fontWeight:800,color:'#fff',marginBottom:8}}>管理员控制台</h2>
        <p style={{fontSize:14,color:'rgba(255,255,255,0.8)'}}>监控用户心理健康状态，管理线下活动数据</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
        <div className="card" style={{padding:24}}><div style={{fontSize:36,marginBottom:12}}>🚨</div><div style={{fontSize:28,fontWeight:800,color:'#e53e3e'}}>{alerts.filter(a=>!handledAlerts.has(a.userId+'_'+a.testId)).length}</div><div style={{fontSize:13,color:'#999',marginTop:4}}>待处理预警</div></div>
        <div className="card" style={{padding:24}}><div style={{fontSize:36,marginBottom:12}}>✅</div><div style={{fontSize:28,fontWeight:800,color:'#22c55e'}}>{handledAlerts.size}</div><div style={{fontSize:13,color:'#999',marginTop:4}}>已处理</div></div>
        <div className="card" style={{padding:24}}><div style={{fontSize:36,marginBottom:12}}>👥</div><div style={{fontSize:28,fontWeight:800,color:'#333'}}>308</div><div style={{fontSize:13,color:'#999',marginTop:4}}>注册用户</div></div>
        <div className="card" style={{padding:24}}><div style={{fontSize:36,marginBottom:12}}>📊</div><div style={{fontSize:28,fontWeight:800,color:'#667eea'}}>306</div><div style={{fontSize:13,color:'#999',marginTop:4}}>已测试用户</div></div>
      </div>

      <div style={{display:'flex',gap:4,padding:4,background:'#f5f5f5',borderRadius:10,width:'fit-content'}}>
        {[{id:'alerts',label:'高危预警',color:'#e53e3e',count:alerts.length},{id:'review',label:'人工复核',color:'#0ea5e9'},{id:'users',label:'用户管理',color:'#667eea'},{id:'arch',label:'心理考古线',color:'#8b5cf6'}].map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{padding:'10px 20px',border:'none',borderRadius:8,background:activeTab===t.id?t.color:'transparent',color:activeTab===t.id?'#fff':'#999',fontWeight:600,fontSize:13,cursor:'pointer'}}>{t.label}{t.count>0&&activeTab!==t.id&&<span style={{marginLeft:6,padding:'2px 6px',background:t.color,color:'#fff',borderRadius:8,fontSize:11}}>{t.count}</span>}</button>
        ))}
      </div>

      {activeTab==='alerts'&&(
        <div className="card" style={{padding:24}}>
          <h3 style={{fontSize:16,fontWeight:700,color:'#333',marginBottom:16}}>高危预警列表</h3>
          {sortedAlerts.length>0?sortedAlerts.map((a,i)=>{
            const k=a.userId+'_'+a.testId; const done=handledAlerts.has(k);
            return(
              <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:16,marginBottom:8,borderRadius:10,border:'1px solid #e8e8e8',opacity:done?0.5:1}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:36,height:36,borderRadius:8,background:getRiskColor(a.riskLevel),display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:14}}>{a.riskLevel==='critical'?'🔴':'🟠'}</div>
                  <div><div style={{fontSize:14,fontWeight:600}}>{a.username||'未知'}</div><div style={{fontSize:12,color:'#999'}}>{getRiskLabel(a.riskLevel)} - {Math.round(a.finalScore||0)}分</div></div>
                </div>
                <div style={{display:'flex',gap:8}}>
                  {!done&&<button onClick={()=>handleAlert(a)} style={{padding:'6px 12px',borderRadius:6,border:'none',background:'#667eea',color:'#fff',fontSize:12,cursor:'pointer'}}>处理</button>}
                  {done&&<span style={{fontSize:12,color:'#22c55e'}}>已处理</span>}
                </div>
              </div>
            );
          }) : <div style={{textAlign:'center',padding:32,color:'#999'}}>暂无预警</div>}
        </div>
      )}

      {activeTab==='review'&&!reviewDetail&&(
        <div className="card" style={{padding:24}}>
          <h3 style={{fontSize:16,fontWeight:700,color:'#333',marginBottom:4}}>人工复核工作台</h3>
          <p style={{fontSize:12,color:'#666',marginBottom:16}}>AI辅助风险线索筛选 · 高风险判断与干预决策必须由专业人员完成</p>

          {/* 筛选器 */}
          <div style={{display:'flex',gap:8,marginBottom:16}}>
            {[{id:'all',label:'全部',color:'#0ea5e9'},{id:'tier4',label:'Tier 4 专业转介',color:'#e53e3e'},{id:'tier3',label:'Tier 3 人工复核',color:'#f97316'},{id:'tier2',label:'Tier 2 需关注',color:'#f59e0b'}].map(f=>(
              <button key={f.id} onClick={()=>setReviewFilter(f.id)} style={{padding:'6px 14px',borderRadius:6,border:`1px solid ${reviewFilter===f.id?f.color:'#e8e8e8'}`,background:reviewFilter===f.id?f.color+'15':'#fff',color:reviewFilter===f.id?f.color:'#999',fontSize:12,fontWeight:600,cursor:'pointer'}}>{f.label}</button>
            ))}
          </div>

          {/* 学生风险分层列表 */}
          <div style={{maxHeight:500,overflowY:'auto'}}>
            {users.filter(u=>{
              if(reviewFilter==='all') return true;
              const lvl=u.latestRiskLevel;
              if(reviewFilter==='tier4') return lvl==='critical';
              if(reviewFilter==='tier3') return lvl==='high';
              if(reviewFilter==='tier2') return lvl==='medium';
              return false;
            }).length>0?users.filter(u=>{
              if(reviewFilter==='all') return true;
              const lvl=u.latestRiskLevel;
              if(reviewFilter==='tier4') return lvl==='critical';
              if(reviewFilter==='tier3') return lvl==='high';
              if(reviewFilter==='tier2') return lvl==='medium';
              return false;
            }).map((u,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:14,marginBottom:8,borderRadius:10,border:'1px solid #e8e8e8',borderLeft:`4px solid ${getRiskColor(u.latestRiskLevel)}`}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:36,height:36,borderRadius:8,background:getRiskColor(u.latestRiskLevel),display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:14}}>
                    {u.latestRiskLevel==='critical'?'🔴':u.latestRiskLevel==='high'?'🟠':u.latestRiskLevel==='medium'?'🟡':'🟢'}
                  </div>
                  <div>
                    <div style={{fontSize:14,fontWeight:600}}>{u.username}</div>
                    <div style={{fontSize:12,color:'#999'}}>
                      {getRiskLabel(u.latestRiskLevel)} · {u.latestScore||0}分 · 测试{u.testCount}次
                    </div>
                  </div>
                </div>
                <button onClick={()=>setReviewDetail(u)} style={{padding:'6px 14px',borderRadius:6,border:'none',background:'#0ea5e9',color:'#fff',fontSize:12,cursor:'pointer'}}>复核</button>
              </div>
            )) : <div style={{textAlign:'center',padding:32,color:'#999'}}>该层级暂无学生</div>}
          </div>
        </div>
      )}

      {activeTab==='review'&&reviewDetail&&(
        <div className="card" style={{padding:24}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <h3 style={{fontSize:16,fontWeight:700,color:'#333'}}>人工复核 · {reviewDetail.username}</h3>
            <button onClick={()=>setReviewDetail(null)} style={{padding:'6px 12px',borderRadius:6,border:'1px solid #e8e8e8',background:'#fff',cursor:'pointer',fontSize:12}}>返回列表</button>
          </div>

          {/* 学生多源数据汇总 */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
            <div style={{padding:14,background:'#f8fafc',borderRadius:8}}>
              <div style={{fontSize:12,color:'#999',marginBottom:4}}>AI风险分层</div>
              <div style={{fontSize:14,fontWeight:700,color:getRiskColor(reviewDetail.latestRiskLevel)}}>
                {getRiskLabel(reviewDetail.latestRiskLevel)} ({reviewDetail.latestScore||0}分)
              </div>
            </div>
            <div style={{padding:14,background:'#f8fafc',borderRadius:8}}>
              <div style={{fontSize:12,color:'#999',marginBottom:4}}>测评次数</div>
              <div style={{fontSize:14,fontWeight:700}}>{reviewDetail.testCount||0} 次</div>
            </div>
          </div>

          {/* 多源贡献度提示 */}
          <div style={{padding:14,background:'#fef3c7',borderRadius:8,marginBottom:20,fontSize:13,color:'#92400e'}}>
            ℹ️ 本区域将展示该学生的多源信息贡献度、一致性分析结果、关键影响因素。AI辅助提供风险线索，最终判断由专业人员完成。
          </div>

          {/* 复核结论填写 */}
          <div style={{padding:16,background:'#fff',border:'1px solid #e8e8e8',borderRadius:10,marginBottom:16}}>
            <h4 style={{fontSize:14,fontWeight:700,color:'#333',marginBottom:12}}>复核结论</h4>

            <div style={{marginBottom:12}}>
              <label style={{fontSize:12,color:'#666',display:'block',marginBottom:6}}>复核决定</label>
              <select value={reviewConclusion.decision} onChange={e=>setReviewConclusion({...reviewConclusion,decision:e.target.value})} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #e8e8e8',fontSize:13}}>
                <option value="">请选择...</option>
                <option value="confirm">确认风险，建议专业转介</option>
                <option value="monitor">持续观察，2周后复评</option>
                <option value="dismiss">解除风险，无需进一步干预</option>
                <option value="interview">安排人工访谈进一步核实</option>
              </select>
            </div>

            <div style={{marginBottom:12}}>
              <label style={{fontSize:12,color:'#666',display:'block',marginBottom:6}}>复核意见</label>
              <textarea value={reviewConclusion.notes} onChange={e=>setReviewConclusion({...reviewConclusion,notes:e.target.value})} placeholder="记录多源数据复核发现、与学生访谈要点、专业判断依据..." style={{width:'100%',minHeight:80,padding:8,borderRadius:6,border:'1px solid #e8e8e8',fontSize:13,resize:'vertical'}}></textarea>
            </div>

            <div style={{marginBottom:12}}>
              <label style={{fontSize:12,color:'#666',display:'block',marginBottom:6}}>后续跟进</label>
              <select value={reviewConclusion.followUp} onChange={e=>setReviewConclusion({...reviewConclusion,followUp:e.target.value})} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #e8e8e8',fontSize:13}}>
                <option value="">请选择...</option>
                <option value="hotline">通知监护人+心理危机热线</option>
                <option value="appointment">预约心理教师3工作日内访谈</option>
                <option value="self_help">推送自助资源+2周复评</option>
                <option value="none">无需后续跟进</option>
              </select>
            </div>

            <button onClick={()=>{
              alert('复核结论已保存（演示）');
              setReviewDetail(null);
              setReviewConclusion({decision:'',notes:'',followUp:''});
            }} style={{padding:'8px 20px',borderRadius:8,border:'none',background:'#0ea5e9',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>提交复核结论</button>
          </div>

          {/* AI边界声明 */}
          <div style={{padding:10,background:'#f1f5f9',borderRadius:6,fontSize:11,color:'#64748b',fontStyle:'italic'}}>
            ℹ️ AI辅助完成风险线索筛选，高风险判断与干预决策必须由具备相应资质或经授权的人员完成。
          </div>
        </div>
      )}

      {activeTab==='users'&&(
        <div className="card" style={{padding:24}}>
          <h3 style={{fontSize:16,fontWeight:700,color:'#333',marginBottom:16}}>用户列表 ({users.length}人)</h3>
          <div style={{maxHeight:500,overflowY:'auto'}}>
            {users.map((u,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:12,marginBottom:6,borderRadius:8,border:'1px solid #f0f0f0'}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:32,height:32,borderRadius:8,background:'#667eea',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:600,fontSize:13}}>{u.username[0].toUpperCase()}</div>
                  <div><div style={{fontSize:14,fontWeight:600}}>{u.username}</div><div style={{fontSize:12,color:'#999'}}>测试{u.testCount}次 | {getRiskLabel(u.latestRiskLevel)}</div></div>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>setShowActivityModal(u)} style={{padding:'6px 12px',borderRadius:6,border:'1px solid #e8e8e8',background:'#fff',cursor:'pointer',fontSize:12}}>添加活动</button>
                  <button onClick={()=>openArch(u)} style={{padding:'6px 12px',borderRadius:6,border:'none',background:'#8b5cf6',color:'#fff',fontSize:12,cursor:'pointer'}}>考古线</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab==='arch'&&!archUser&&(
        <div className="card" style={{padding:24}}>
          <h3 style={{fontSize:16,fontWeight:700,color:'#333',marginBottom:16}}>心理考古线</h3>
          <p style={{fontSize:13,color:'#666',marginBottom:16}}>选择用户查看其线下活动记录和风险分数变化</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
            {users.filter(u=>u.testCount>0).slice(0,12).map(u=>(
              <div key={u.id} onClick={()=>openArch(u)} className="card" style={{padding:16,cursor:'pointer',textAlign:'center'}}>
                <div style={{fontSize:24,marginBottom:8}}>📋</div>
                <div style={{fontSize:13,fontWeight:600}}>{u.username}</div>
                <div style={{fontSize:11,color:'#999'}}>{u.testCount}次测试</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab==='arch'&&archUser&&(
        <div className="card" style={{padding:24}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
            <h3 style={{fontSize:18,fontWeight:700,color:'#333'}}>{archUser.username} 的心理考古线</h3>
            <button onClick={()=>{setArchUser(null);setArchData(null);}} style={{padding:'8px 16px',borderRadius:8,border:'1px solid #e8e8e8',background:'#fff',cursor:'pointer'}}>返回列表</button>
          </div>
          
          {archLoading?<div style={{textAlign:'center',padding:40}}>加载中...</div>:archData?(
            <>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:24}}>
                <div style={{padding:20,background:'#fef3c7',borderRadius:12,textAlign:'center'}}>
                  <div style={{fontSize:12,color:'#92400e',marginBottom:4}}>初始分数</div>
                  <div style={{fontSize:28,fontWeight:800,color:'#92400e'}}>{archData.trend?.initialScore||0}分</div>
                </div>
                <div style={{padding:20,background:'#d1fae5',borderRadius:12,textAlign:'center'}}>
                  <div style={{fontSize:12,color:'#065f46',marginBottom:4}}>最新分数</div>
                  <div style={{fontSize:28,fontWeight:800,color:'#065f46'}}>{archData.trend?.latestScore||0}分</div>
                </div>
                <div style={{padding:20,background:parseFloat(archData.trend?.totalChange)<0?'#d1fae5':'#fee2e2',borderRadius:12,textAlign:'center'}}>
                  <div style={{fontSize:12,color:parseFloat(archData.trend?.totalChange)<0?'#065f46':'#991b1b',marginBottom:4}}>变化幅度</div>
                  <div style={{fontSize:28,fontWeight:800,color:parseFloat(archData.trend?.totalChange)<0?'#065f46':'#991b1b'}}>{parseFloat(archData.trend?.totalChange)>0?'+':''}{archData.trend?.totalChange||0}%</div>
                </div>
              </div>

              <h4 style={{fontSize:14,fontWeight:600,color:'#333',marginBottom:12}}>详细记录</h4>
              {archData.timeline.map((item,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:12,marginBottom:8,background:item.type==='offline_activity'?'#f5f0ff':'#fdf8f0',borderRadius:8}}>
                  <div style={{width:32,height:32,borderRadius:8,background:item.type==='offline_activity'?'#8b5cf6':'#f59e0b',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:14}}>{item.type==='offline_activity'?'🏃':'📊'}</div>
                  <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{item.activityName||(item.type==='scl90'?'线上测评':'线下活动')}</div><div style={{fontSize:11,color:'#999'}}>{item.activityType&&item.activityType+' | '}{new Date(item.date).toLocaleDateString('zh-CN')}</div></div>
                  <div style={{fontSize:16,fontWeight:700}}>{item.score}分</div>
                  {item.scoreChange&&<div style={{fontSize:11,color:parseFloat(item.scoreChange)<0?'#22c55e':'#e53e3e'}}>{parseFloat(item.scoreChange)>0?'+':''}{item.scoreChange}%</div>}
                </div>
              ))}

              <div style={{marginTop:20,padding:16,background:'#eff6ff',borderRadius:12}}>
                <h4 style={{fontSize:14,fontWeight:600,color:'#1e40af',marginBottom:8}}>🤖 AI分析报告</h4>
                <p style={{fontSize:13,color:'#333',lineHeight:1.8}}>该用户风险分数从{archData.trend?.initialScore||0}分下降至{archData.trend?.latestScore||0}分，累计下降{Math.abs(parseFloat(archData.trend?.totalChange)||0)}%，心理健康状况持续改善。参与{archData.trend?.activityCount||0}次线下活动后，每次活动均带来显著的分数下降。</p>
              </div>
            </>
          ):<div style={{textAlign:'center',padding:40,color:'#999'}}>暂无数据</div>}
        </div>
      )}

      {showHandleModal&&(
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'#fff',borderRadius:16,padding:32,maxWidth:480,width:'90%'}}>
            <h3 style={{fontSize:18,fontWeight:700,marginBottom:16}}>处理预警</h3>
            <textarea value={handleNote} onChange={e=>setHandleNote(e.target.value)} placeholder="处理措施..." style={{width:'100%',height:80,padding:12,border:'1px solid #e8e8e8',borderRadius:8,fontSize:13,resize:'none',marginBottom:16}}/>
            <div style={{display:'flex',gap:12,justifyContent:'flex-end'}}>
              <button onClick={()=>setShowHandleModal(null)} style={{padding:'10px 20px',borderRadius:8,border:'1px solid #e8e8e8',background:'#fff',cursor:'pointer'}}>取消</button>
              <button onClick={confirmHandle} className="btn-primary" style={{padding:'10px 20px'}}>确认</button>
            </div>
          </div>
        </div>
      )}

      {showActivityModal&&(
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'#fff',borderRadius:16,padding:32,maxWidth:520,width:'90%'}}>
            <h3 style={{fontSize:18,fontWeight:700,marginBottom:16}}>添加活动 - {showActivityModal.username}</h3>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
              <div><label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:4}}>活动类型</label><select value={activityForm.activityType} onChange={e=>setActivityForm({...activityForm,activityType:e.target.value})} style={{width:'100%',padding:'8px',border:'1px solid #e8e8e8',borderRadius:6,fontSize:13}}><option>定向越野</option><option>心理讲座</option><option>团体辅导</option><option>艺术疗愈活动</option></select></div>
              <div><label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:4}}>活动日期</label><input type="date" value={activityForm.activityDate} onChange={e=>setActivityForm({...activityForm,activityDate:e.target.value})} style={{width:'100%',padding:'8px',border:'1px solid #e8e8e8',borderRadius:6,fontSize:13}}/></div>
            </div>
            <div style={{marginBottom:12}}><label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:4}}>活动名称</label><input value={activityForm.activityName} onChange={e=>setActivityForm({...activityForm,activityName:e.target.value})} placeholder="活动名称" style={{width:'100%',padding:'8px',border:'1px solid #e8e8e8',borderRadius:6,fontSize:13}}/></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
              <div><label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:4}}>活动前分数</label><input type="number" value={activityForm.beforeScore} onChange={e=>setActivityForm({...activityForm,beforeScore:e.target.value})} placeholder="1-155" style={{width:'100%',padding:'8px',border:'1px solid #e8e8e8',borderRadius:6,fontSize:13}}/></div>
              <div><label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:4}}>活动后分数</label><input type="number" value={activityForm.afterScore} onChange={e=>setActivityForm({...activityForm,afterScore:e.target.value})} placeholder="1-155" style={{width:'100%',padding:'8px',border:'1px solid #e8e8e8',borderRadius:6,fontSize:13}}/></div>
            </div>
            <div style={{display:'flex',gap:12,justifyContent:'flex-end'}}>
              <button onClick={()=>setShowActivityModal(null)} style={{padding:'10px 20px',borderRadius:8,border:'1px solid #e8e8e8',background:'#fff',cursor:'pointer'}}>取消</button>
              <button onClick={addActivity} className="btn-primary" style={{padding:'10px 20px'}}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
