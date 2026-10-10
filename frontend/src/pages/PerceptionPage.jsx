import { useState, useEffect } from 'react';
import { perceptionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PerceptionPage() {
  const { user } = useAuth();
  const [perception, setPerception] = useState(null);
  const [history, setHistory] = useState([]);
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    grade: '', major: '', college: '', dormitory: '',
    hometown: '', familySituation: '', financialStatus: '',
    relationshipStatus: '', academicRank: ''
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [p, h] = await Promise.all([
        perceptionAPI.getPerception(),
        perceptionAPI.getPerceptionHistory()
      ]);
      setPerception(p.perception);
      setHistory(h.results || []);
      
      // 加载学生档案
      try {
        const profileRes = await perceptionAPI.getStudentProfile();
        if (profileRes.profile) {
          setProfile(profileRes.profile);
          setProfileForm(profileRes.profile);
        }
      } catch {}
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const saveProfile = async () => {
    try {
      await perceptionAPI.saveStudentProfile(profileForm);
      setProfile(profileForm);
      setShowProfileModal(false);
      alert('档案保存成功');
    } catch (e) { alert('保存失败'); }
  };

  const getScoreColor = (score) => {
    if (score >= 0.7) return '#22c55e';
    if (score >= 0.4) return '#f59e0b';
    return '#e53e3e';
  };

  const getScoreLabel = (score) => {
    if (score >= 0.7) return '良好';
    if (score >= 0.4) return '一般';
    return '需关注';
  };

  if (loading) {
    return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:400}}>加载中...</div>;
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:24}}>
      {/* 欢迎横幅 */}
      <div style={{padding:32,background:'linear-gradient(135deg,#667eea,#764ba2)',borderRadius:20}}>
        <h2 style={{fontSize:24,fontWeight:800,color:'#fff',marginBottom:8}}>多维度心理感知</h2>
        <p style={{fontSize:14,color:'rgba(255,255,255,0.8)'}}>通过多个维度感知您的心理健康状态</p>
      </div>

      {/* 感知维度卡片 */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
        {[
          { icon: '📝', label: '文本感知', score: perception?.textScore || 0, desc: '日记与对话分析' },
          { icon: '📊', label: '量表感知', score: perception?.testScore || 0, desc: 'SCL-90测评结果' },
          { icon: '🔄', label: '行为感知', score: perception?.behaviorScore || 0, desc: '使用行为分析' },
          { icon: '👥', label: '社交感知', score: perception?.socialScore || 0, desc: '人际互动分析' }
        ].map((dim, i) => (
          <div key={i} className="card" style={{padding:20}}>
            <div style={{fontSize:28,marginBottom:8}}>{dim.icon}</div>
            <div style={{fontSize:12,color:'#999',marginBottom:4}}>{dim.label}</div>
            <div style={{fontSize:24,fontWeight:700,color:getScoreColor(dim.score)}}>
              {Math.round(dim.score * 100)}%
            </div>
            <div style={{fontSize:11,color:'#999',marginTop:4}}>{dim.desc}</div>
          </div>
        ))}
      </div>

      {/* 综合分析 */}
      <div className="card" style={{padding:24}}>
        <h3 style={{fontSize:16,fontWeight:700,color:'#333',marginBottom:16}}>综合分析</h3>
        <div style={{display:'flex',alignItems:'center',gap:20,marginBottom:16}}>
          <div style={{
            width:100, height:100, borderRadius:'50%',
            background: `conic-gradient(${getScoreColor(perception?.overallScore || 0)} ${Math.round((perception?.overallScore || 0) * 360)}deg, #f0f0f0 0deg)`,
            display:'flex', alignItems:'center', justifyContent:'center'
          }}>
            <div style={{width:80,height:80,borderRadius:'50%',background:'#fff',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
              <div style={{fontSize:20,fontWeight:700,color:getScoreColor(perception?.overallScore || 0)}}>
                {Math.round((perception?.overallScore || 0) * 100)}
              </div>
              <div style={{fontSize:10,color:'#999'}}>综合分</div>
            </div>
          </div>
          <div>
            <div style={{fontSize:14,fontWeight:600,color:'#333',marginBottom:4}}>
              {perception?.analysisReport?.summary || '暂无分析数据，请先进行心理测评'}
            </div>
            <div style={{fontSize:12,color:'#999'}}>
              最后更新：{perception?.createdAt ? new Date(perception.createdAt).toLocaleString('zh-CN') : '暂无'}
            </div>
          </div>
        </div>
      </div>

      {/* 学生档案 */}
      <div className="card" style={{padding:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <h3 style={{fontSize:16,fontWeight:700,color:'#333'}}>学生档案</h3>
          <button onClick={() => setShowProfileModal(true)} style={{padding:'6px 16px',borderRadius:6,border:'1px solid #e8e8e8',background:'#fff',cursor:'pointer',fontSize:13}}>
            编辑档案
          </button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {[
            { label: '年级', value: profile.grade },
            { label: '专业', value: profile.major },
            { label: '学院', value: profile.college },
            { label: '宿舍', value: profile.dormitory },
            { label: '籍贯', value: profile.hometown },
            { label: '恋爱状态', value: profile.relationshipStatus }
          ].map((item, i) => (
            <div key={i} style={{padding:12,background:'#f5f5f5',borderRadius:8}}>
              <div style={{fontSize:11,color:'#999',marginBottom:2}}>{item.label}</div>
              <div style={{fontSize:13,fontWeight:600,color:'#333'}}>{item.value || '未填写'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 感知历史 */}
      {history.length > 0 && (
        <div className="card" style={{padding:24}}>
          <h3 style={{fontSize:16,fontWeight:700,color:'#333',marginBottom:16}}>感知历史</h3>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {history.slice(0, 10).map((item, i) => (
              <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:12,background:'#f5f5f5',borderRadius:8}}>
                <div style={{fontSize:13,color:'#333'}}>
                  综合分数: {Math.round((item.overallScore || 0) * 100)}分
                </div>
                <div style={{display:'flex',gap:12,fontSize:12,color:'#999'}}>
                  <span>文本:{Math.round((item.textScore || 0) * 100)}%</span>
                  <span>量表:{Math.round((item.testScore || 0) * 100)}%</span>
                  <span>行为:{Math.round((item.behaviorScore || 0) * 100)}%</span>
                </div>
                <div style={{fontSize:12,color:'#999'}}>
                  {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 学生档案编辑弹窗 */}
      {showProfileModal && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'#fff',borderRadius:16,padding:32,maxWidth:520,width:'90%'}}>
            <h3 style={{fontSize:18,fontWeight:700,marginBottom:16}}>编辑学生档案</h3>
            
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:4}}>年级</label>
                <select value={profileForm.grade} onChange={e=>setProfileForm({...profileForm,grade:e.target.value})} style={{width:'100%',padding:'8px',border:'1px solid #e8e8e8',borderRadius:6}}>
                  <option value="">请选择</option>
                  <option value="大一">大一</option>
                  <option value="大二">大二</option>
                  <option value="大三">大三</option>
                  <option value="大四">大四</option>
                  <option value="研究生">研究生</option>
                </select>
              </div>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:4}}>专业</label>
                <input value={profileForm.major} onChange={e=>setProfileForm({...profileForm,major:e.target.value})} style={{width:'100%',padding:'8px',border:'1px solid #e8e8e8',borderRadius:6}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:4}}>学院</label>
                <input value={profileForm.college} onChange={e=>setProfileForm({...profileForm,college:e.target.value})} style={{width:'100%',padding:'8px',border:'1px solid #e8e8e8',borderRadius:6}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:4}}>宿舍</label>
                <input value={profileForm.dormitory} onChange={e=>setProfileForm({...profileForm,dormitory:e.target.value})} style={{width:'100%',padding:'8px',border:'1px solid #e8e8e8',borderRadius:6}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:4}}>籍贯</label>
                <input value={profileForm.hometown} onChange={e=>setProfileForm({...profileForm,hometown:e.target.value})} style={{width:'100%',padding:'8px',border:'1px solid #e8e8e8',borderRadius:6}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:4}}>恋爱状态</label>
                <select value={profileForm.relationshipStatus} onChange={e=>setProfileForm({...profileForm,relationshipStatus:e.target.value})} style={{width:'100%',padding:'8px',border:'1px solid #e8e8e8',borderRadius:6}}>
                  <option value="">请选择</option>
                  <option value="单身">单身</option>
                  <option value="恋爱中">恋爱中</option>
                  <option value="已婚">已婚</option>
                </select>
              </div>
            </div>
            
            <div style={{display:'flex',gap:12,justifyContent:'flex-end'}}>
              <button onClick={()=>setShowProfileModal(false)} style={{padding:'10px 20px',borderRadius:8,border:'1px solid #e8e8e8',background:'#fff',cursor:'pointer'}}>取消</button>
              <button onClick={saveProfile} className="btn-primary" style={{padding:'10px 20px'}}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
