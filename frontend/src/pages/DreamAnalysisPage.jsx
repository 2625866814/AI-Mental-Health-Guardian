import { useState } from 'react';
import { dreamAPI } from '../services/api';

export default function DreamAnalysisPage() {
  const [dreamText, setDreamText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const analyzeDream = async () => {
    if (!dreamText.trim()) return alert('请输入梦境内容');
    setLoading(true);
    try {
      const response = await dreamAPI.analyze({ dreamText: dreamText.trim() });
      setResult(response.report);
    } catch (error) {
      alert('分析失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    const colors = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' };
    return colors[level] || '#999';
  };

  const getRiskBg = (level) => {
    const colors = { low: '#f0fdf4', medium: '#fffbeb', high: '#fef2f2' };
    return colors[level] || '#f5f5f5';
  };

  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24,height:'100%'}}>
      {/* 左侧：输入区 */}
      <div className="card" style={{padding:24,display:'flex',flexDirection:'column'}}>
        <h2 style={{fontSize:20,fontWeight:700,color:'#1a1a2e',marginBottom:8}}>🧠 AI梦境解析</h2>
        <p style={{fontSize:13,color:'#999',marginBottom:20}}>输入您的梦境内容，AI将为您分析潜在心理状态</p>
        
        <textarea
          value={dreamText}
          onChange={e => setDreamText(e.target.value)}
          placeholder="请描述您最近的梦境内容...&#10;&#10;例如：我梦见自己在一片黑暗中奔跑，后面有什么东西在追我，我跑得很快但怎么也跑不掉..."
          style={{
            flex:1, minHeight:200, padding:16, border:'1px solid #e8e8e8', borderRadius:12,
            fontSize:14, lineHeight:1.6, resize:'none', outline:'none', fontFamily:'inherit'
          }}
        />
        
        <div style={{marginTop:16}}>
          <button 
            onClick={analyzeDream} 
            disabled={loading || !dreamText.trim()}
            className="btn-primary"
            style={{width:'100%',padding:14}}
          >
            {loading ? '正在解析中...' : '🔍 开始解析'}
          </button>
        </div>
        
        <div style={{marginTop:16,padding:12,background:'#f8f9fa',borderRadius:8}}>
          <p style={{fontSize:12,color:'#999',margin:0}}>
            💡 提示：描述越详细，分析越准确。可以包含梦境中的场景、人物、情绪、动作等元素。
          </p>
        </div>
      </div>

      {/* 右侧：结果区 */}
      <div className="card" style={{padding:24,overflowY:'auto'}}>
        {result ? (
          <div>
            <h2 style={{fontSize:20,fontWeight:700,color:'#1a1a2e',marginBottom:20}}>解析报告</h2>
            
            {/* 风险等级 */}
            <div style={{padding:20,borderRadius:12,background:getRiskBg(result.risk.level),marginBottom:20}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                <div>
                  <div style={{fontSize:14,color:'#666',marginBottom:4}}>心理风险等级</div>
                  <div style={{fontSize:20,fontWeight:700,color:getRiskColor(result.risk.level)}}>{result.risk.label}</div>
                </div>
                <div style={{width:60,height:60,borderRadius:'50%',background:getRiskColor(result.risk.level),display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:18,fontWeight:700}}>
                  {result.analysis.riskScore}%
                </div>
              </div>
            </div>

            {/* 梦境核心元素 */}
            <div style={{marginBottom:20}}>
              <h3 style={{fontSize:14,fontWeight:600,color:'#333',marginBottom:12}}>梦境核心元素</h3>
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                {result.analysis.coreElements.map((el, i) => (
                  <span key={i} style={{padding:'6px 12px',background:'#f0f0ff',color:'#667eea',borderRadius:20,fontSize:13,fontWeight:500}}>
                    {el}
                  </span>
                ))}
              </div>
            </div>

            {/* 心理投射分析 */}
            <div style={{marginBottom:20}}>
              <h3 style={{fontSize:14,fontWeight:600,color:'#333',marginBottom:12}}>心理投射分析</h3>
              <div style={{padding:16,background:'#f8f9fa',borderRadius:10,fontSize:13,color:'#666',lineHeight:1.8}}>
                {result.analysis.psychologicalProjection || '暂无分析结果'}
              </div>
            </div>

            {/* 情绪状态 */}
            <div style={{marginBottom:20}}>
              <h3 style={{fontSize:14,fontWeight:600,color:'#333',marginBottom:12}}>情绪状态</h3>
              <div style={{padding:16,background:'#f8f9fa',borderRadius:10,fontSize:14,color:'#333'}}>
                {result.analysis.emotionState}
              </div>
            </div>

            {/* 干预建议 */}
            <div>
              <h3 style={{fontSize:14,fontWeight:600,color:'#333',marginBottom:12}}>干预建议</h3>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {result.interventions.map((item, i) => (
                  <div key={i} style={{padding:14,background:'#f8f9fa',borderRadius:10,borderLeft:'3px solid #667eea'}}>
                    <div style={{fontSize:14,fontWeight:600,color:'#333',marginBottom:4}}>{item.title}</div>
                    <div style={{fontSize:12,color:'#666'}}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',textAlign:'center'}}>
            <div style={{fontSize:64,marginBottom:16,opacity:0.3}}>🌙</div>
            <h3 style={{fontSize:16,fontWeight:600,color:'#999',marginBottom:8}}>等待解析</h3>
            <p style={{fontSize:13,color:'#bbb'}}>输入梦境内容后，AI将为您生成心理分析报告</p>
          </div>
        )}
      </div>
    </div>
  );
}
