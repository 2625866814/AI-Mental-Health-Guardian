import { useState, useEffect, useRef } from 'react';
import { personalityAPI } from '../services/api';

const SCENARIOS = [
  {
    id: 'work-pressure',
    name: '工作压力',
    icon: '💼',
    desc: '面对紧迫的工作截止日期',
    background: '你是一名项目经理，距离重要项目交付只剩3天，但团队遇到了重大技术难题。客户的催促电话不断，上司也在施压。',
    stressFactors: ['时间压力', '责任重大', '多方协调'],
    skills: ['时间管理', '压力应对', '沟通协调']
  },
  {
    id: 'social-anxiety',
    name: '社交焦虑',
    icon: '👥',
    desc: '大型社交场合中感到紧张',
    background: '你被邀请参加一个重要的行业峰会，需要在200多人面前做自我介绍。你认识的人很少，周围都是陌生人。',
    stressFactors: ['公众演讲', '社交恐惧', '陌生环境'],
    skills: ['社交技巧', '自信建立', '情绪调节']
  },
  {
    id: 'academic-stress',
    name: '学业压力',
    icon: '📚',
    desc: '面对重要的考试挑战',
    background: '期末考试周即将来临，你有4门课程需要复习，其中2门是你的弱项。同时还有一个小组作业需要完成。',
    stressFactors: ['学业负担', '时间分配', '成绩焦虑'],
    skills: ['学习方法', '时间规划', '焦虑管理']
  },
  {
    id: 'relationship-issues',
    name: '人际关系',
    icon: '💔',
    desc: '处理复杂的人际冲突',
    background: '你和最好的朋友因为一次误会产生了隔阂，对方似乎在回避你。同时，室友之间也因为生活习惯问题产生了矛盾。',
    stressFactors: ['情感冲突', '沟通障碍', '关系维护'],
    skills: ['沟通技巧', '情绪管理', '冲突解决']
  },
  {
    id: 'life-transitions',
    name: '生活转变',
    icon: '🔄',
    desc: '面对重大的生活变化',
    background: '你即将毕业，面临着多个选择：继续深造、就业、或者创业。家人有不同的期望，而你还在探索自己真正想要什么。',
    stressFactors: ['选择困难', '未来不确定', '外界期望'],
    skills: ['决策能力', '自我认知', '规划能力']
  },
  {
    id: 'family-pressure',
    name: '家庭压力',
    icon: '🏠',
    desc: '家庭期望与个人理想的冲突',
    background: '你的父母希望你回到家乡工作，但你更想留在大城市发展。每次通话都会谈到这个话题，让你感到很有压力。',
    stressFactors: ['代际冲突', '期望管理', '独立性'],
    skills: ['边界设定', '有效沟通', '自我坚定']
  },
  {
    id: 'financial-stress',
    name: '经济压力',
    icon: '💰',
    desc: '面对财务困境',
    background: '你的生活费快用完了，还有一笔意外支出需要处理。你需要在节省开支和维持生活质量之间找到平衡。',
    stressFactors: ['经济困难', '消费诱惑', '生活压力'],
    skills: ['财务管理', '延迟满足', '资源规划']
  },
  {
    id: 'health-concern',
    name: '健康焦虑',
    icon: '🏥',
    desc: '面对健康问题的担忧',
    background: '你最近感觉身体不太舒服，网上搜索后发现可能是一些严重的症状。你需要决定是否去医院，以及如何处理这种焦虑。',
    stressFactors: ['健康担忧', '信息过载', '不确定性'],
    skills: ['理性判断', '情绪调节', '健康管理']
  }
];

const MBTI_TYPES = [
  { type: 'INTJ', name: '建筑师', desc: '独立思考者，战略规划者' },
  { type: 'INTP', name: '逻辑学家', desc: '创新发明家，理论探索者' },
  { type: 'ENTJ', name: '指挥官', desc: '大胆领导者，战略决策者' },
  { type: 'ENTP', name: '辩论家', desc: '创新思维者，挑战者' },
  { type: 'INFJ', name: '提倡者', desc: '理想主义者，洞察者' },
  { type: 'INFP', name: '调停者', desc: '诗意的理想主义者' },
  { type: 'ENFJ', name: '主人公', desc: '鼓舞人心的领导者' },
  { type: 'ENFP', name: '竞选者', desc: '热情洋溢的创意者' },
  { type: 'ISTJ', name: '物流师', desc: '务实的事实主义者' },
  { type: 'ISFJ', name: '守卫者', desc: '专注的保护者' },
  { type: 'ESTJ', name: '总经理', desc: '高效的组织管理者' },
  { type: 'ESFJ', name: '执政官', desc: '热心的照顾者' },
  { type: 'ISTP', name: '鉴赏家', desc: '大胆的实验者' },
  { type: 'ISFP', name: '探险家', desc: '灵活有魅力的艺术家' },
  { type: 'ESTP', name: '企业家', desc: '精明的冒险家' },
  { type: 'ESFP', name: '表演者', desc: '自发的表演者' }
];

const DECISION_TYPES = [
  { id: 'assertive', label: '果断应对', icon: '⚔️', desc: '直接面对问题，主动出击' },
  { id: 'collaborative', label: '寻求合作', icon: '🤝', desc: '寻求他人帮助，团队协作' },
  { id: 'analytical', label: '分析思考', icon: '🔍', desc: '冷静分析，理性决策' },
  { id: 'avoidant', label: '暂时回避', icon: '🚶', desc: '暂时退一步，等待时机' }
];

export default function PersonalityPage() {
  const [step, setStep] = useState('select');
  const [scenario, setScenario] = useState(null);
  const [mbtiType, setMbtiType] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [stress, setStress] = useState(0.5);
  const [stressHistory, setStressHistory] = useState([]);
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [round, setRound] = useState(0);
  const [showDecision, setShowDecision] = useState(false);
  const [parallelStory, setParallelStory] = useState(null);
  const [report, setReport] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectedScenario = SCENARIOS.find(s => s.id === scenario);

  const start = async () => {
    if (!scenario) return alert('请选择一个场景');
    setLoading(true);
    try {
      const r = await personalityAPI.createSession({
        scenario,
        personalityType: mbtiType || 'INTJ'
      });
      setSessionId(r.sessionId);
      setStress(r.stressScore || 0.5);
      setStressHistory([r.stressScore || 0.5]);
      setMessages([{ role: 'ai', text: r.initialResponse }]);
      setRound(1);
      setStep('chat');
    } catch (e) {
      alert('创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    setMessages(p => [...p, { role: 'user', text: msg }]);
    setLoading(true);

    try {
      const r = await personalityAPI.getResponse({
        sessionId,
        userResponse: msg,
        decision: selectedDecision || 'constructive'
      });

      setMessages(p => [...p, { role: 'ai', text: r.response }]);
      const newStress = r.stressScore || stress;
      setStress(newStress);
      setStressHistory(p => [...p, newStress]);
      setRound(p => p + 1);
      setSelectedDecision(null);

      // 每3轮显示决策选项
      if (round % 3 === 0) {
        setShowDecision(true);
      }

      // 压力降到足够低时结束
      if (newStress < 0.2) {
        setTimeout(() => finishTraining(), 1000);
      }
    } catch (e) {
      setMessages(p => [...p, { role: 'ai', text: '抱歉，暂时无法回复。' }]);
    } finally {
      setLoading(false);
    }
  };

  const makeDecision = async (decisionType) => {
    setSelectedDecision(decisionType);
    setShowDecision(false);
    setLoading(true);

    try {
      const r = await personalityAPI.getResponse({
        sessionId,
        userResponse: `[选择${decisionType}策略]`,
        decision: decisionType
      });

      // 如果是回避策略，可能生成平行剧情
      if (decisionType === 'avoidant' && Math.random() > 0.5) {
        setParallelStory({
          yourChoice: '回避策略',
          alternative: '如果选择果断面对，结果可能会...',
          description: '有时候，退一步是为了更好地前进。但也要注意不要总是回避问题。'
        });
      }

      setMessages(p => [...p, { role: 'ai', text: r.response }]);
      const newStress = r.stressScore || stress;
      setStress(newStress);
      setStressHistory(p => [...p, newStress]);
    } catch (e) {
      setMessages(p => [...p, { role: 'ai', text: '暂时无法回复。' }]);
    } finally {
      setLoading(false);
    }
  };

  const finishTraining = () => {
    // 生成训练报告
    const avgStress = stressHistory.reduce((a, b) => a + b, 0) / stressHistory.length;
    const maxStress = Math.max(...stressHistory);
    const minStress = Math.min(...stressHistory);
    const stressReduction = stressHistory[0] - stress;

    setReport({
      scenario: selectedScenario?.name,
      mbtiType: mbtiType || '未选择',
      totalRounds: round,
      avgStress: Math.round(avgStress * 100),
      maxStress: Math.round(maxStress * 100),
      minStress: Math.round(minStress * 100),
      stressReduction: Math.round(stressReduction * 100),
      finalStress: Math.round(stress * 100),
      skillsImproved: selectedScenario?.skills || [],
      assessment: stressReduction > 0.3 ? 'excellent' : stressReduction > 0.1 ? 'good' : 'moderate'
    });
    setStep('result');
  };

  const stressColor = (s) => s > 0.7 ? '#ef4444' : s > 0.5 ? '#f97316' : s > 0.3 ? '#f59e0b' : '#10b981';
  const stressLabel = (s) => s > 0.7 ? '高压' : s > 0.5 ? '中等' : s > 0.3 ? '轻度' : '放松';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <style>{`
        .persona-card { background: #fff; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
        .persona-btn { padding: 10px 20px; border-radius: 10px; border: none; font-size: 14px; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .persona-btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; }
        .persona-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,0.3); }
        .persona-btn-secondary { background: #f1f5f9; color: #475569; }
        .persona-btn-secondary:hover { background: #e2e8f0; }
        .scenario-card { padding: 20px; border-radius: 14px; border: 2px solid #e2e8f0; cursor: pointer; transition: 0.2s; text-align: center; }
        .scenario-card:hover { border-color: #a5b4fc; background: #f5f3ff; }
        .scenario-card.selected { border-color: #6366f1; background: #eef2ff; box-shadow: 0 4px 15px rgba(99,102,241,0.2); }
        .decision-card { padding: 16px; border-radius: 12px; border: 2px solid #e2e8f0; cursor: pointer; transition: 0.2s; }
        .decision-card:hover { border-color: #a5b4fc; transform: translateY(-2px); }
        .chat-bubble { max-width: 75%; padding: 14px 18px; border-radius: 16px; line-height: 1.6; font-size: 14px; }
        .chat-bubble-ai { background: #fff; color: #334155; border: 1px solid #e2e8f0; border-bottom-left-radius: 4px; }
        .chat-bubble-user { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border-bottom-right-radius: 4px; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .slide-in { animation: slideIn 0.3s ease; }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        .stress-pulse { animation: pulse 2s infinite; }
      `}</style>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        {/* 场景选择 */}
        {step === 'select' && (
          <div className="slide-in">
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>🎭 平行人格剧场</h1>
              <p style={{ fontSize: 15, color: '#64748b' }}>选择压力场景，通过角色扮演训练心理韧性</p>
            </div>

            {/* 场景选择 */}
            <div className="persona-card" style={{ padding: 28, marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 20 }}>选择场景</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {SCENARIOS.map(s => (
                  <div key={s.id}
                    className={`scenario-card ${scenario === s.id ? 'selected' : ''}`}
                    onClick={() => setScenario(s.id)}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>{s.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 场景详情 */}
            {selectedScenario && (
              <div className="persona-card slide-in" style={{ padding: 28, marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>
                  {selectedScenario.icon} {selectedScenario.name} - 场景详情
                </h3>
                <div style={{ padding: 20, background: '#f8fafc', borderRadius: 14, marginBottom: 20, borderLeft: '4px solid #6366f1' }}>
                  <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.8, margin: 0 }}>{selectedScenario.background}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 600, color: '#6366f1', marginBottom: 10 }}>压力因素</h4>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {selectedScenario.stressFactors.map((f, i) => (
                        <span key={i} style={{ padding: '6px 12px', background: '#fef2f2', color: '#ef4444', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>{f}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 600, color: '#10b981', marginBottom: 10 }}>训练技能</h4>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {selectedScenario.skills.map((s, i) => (
                        <span key={i} style={{ padding: '6px 12px', background: '#ecfdf5', color: '#10b981', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MBTI选择 */}
            <div className="persona-card" style={{ padding: 28, marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>选择人格类型（可选）</h3>
              <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>选择与你相似的类型，AI会根据该类型的特点进行互动</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {MBTI_TYPES.map(t => (
                  <div key={t.type}
                    onClick={() => setMbtiType(mbtiType === t.type ? '' : t.type)}
                    style={{
                      padding: '12px 10px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                      border: `2px solid ${mbtiType === t.type ? '#6366f1' : '#e2e8f0'}`,
                      background: mbtiType === t.type ? '#eef2ff' : '#fff',
                      transition: '0.2s'
                    }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: mbtiType === t.type ? '#6366f1' : '#1e293b' }}>{t.type}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{t.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 开始按钮 */}
            <button onClick={start} disabled={!scenario || loading}
              className="persona-btn persona-btn-primary"
              style={{ width: '100%', padding: 16, fontSize: 16 }}>
              {loading ? '创建中...' : '🎭 开始训练'}
            </button>
          </div>
        )}

        {/* 对话界面 */}
        {step === 'chat' && (
          <div className="slide-in">
            {/* 顶部信息栏 */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <div className="persona-card" style={{ flex: 1, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                      {selectedScenario?.icon} {selectedScenario?.name}
                    </h2>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>
                      第 {round} 轮对话 {mbtiType && `· ${mbtiType}`}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>压力水平</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 100, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${stress * 100}%`, background: stressColor(stress), borderRadius: 4, transition: 'all 0.5s' }}></div>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: stressColor(stress), minWidth: 40 }}>{Math.round(stress * 100)}%</span>
                    </div>
                    <div style={{ fontSize: 11, color: stressColor(stress), marginTop: 2 }}>{stressLabel(stress)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 聊天区域 */}
            <div className="persona-card" style={{ marginBottom: 16 }}>
              <div style={{ height: 420, overflowY: 'auto', padding: 24 }}>
                {messages.map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
                    {m.role === 'ai' && (
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 10, flexShrink: 0, fontSize: 16 }}>🎭</div>
                    )}
                    <div className={`chat-bubble ${m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ display: 'flex', marginBottom: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 10, fontSize: 16 }}>🎭</div>
                    <div className="chat-bubble chat-bubble-ai">
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, background: '#94a3b8', borderRadius: '50%', animation: `bounce 1.4s infinite ease-in-out ${i * 0.16}s` }}></div>)}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef}></div>
              </div>

              {/* 决策选项 */}
              {showDecision && (
                <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 12 }}>选择你的应对方式：</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    {DECISION_TYPES.map(d => (
                      <div key={d.id} className="decision-card" onClick={() => makeDecision(d.id)}>
                        <div style={{ fontSize: 24, marginBottom: 6 }}>{d.icon}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{d.label}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{d.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 输入区域 */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input value={input} onChange={e => setInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && send()}
                    placeholder="输入你的想法和应对方式..."
                    style={{ flex: 1, padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }} />
                  <button onClick={send} disabled={!input.trim() || loading}
                    className="persona-btn persona-btn-primary">发送</button>
                  <button onClick={finishTraining}
                    className="persona-btn persona-btn-secondary">结束训练</button>
                </div>
              </div>
            </div>

            {/* 压力趋势 */}
            {stressHistory.length > 1 && (
              <div className="persona-card" style={{ padding: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 12 }}>压力变化趋势</h4>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
                  {stressHistory.map((s, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '100%', height: `${s * 50}px`, background: stressColor(s), borderRadius: '4px 4px 0 0', transition: '0.3s' }}></div>
                      <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 4 }}>{i + 1}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 训练报告 */}
        {step === 'result' && report && (
          <div className="slide-in">
            <div className="persona-card" style={{ padding: 40, textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>
                {report.assessment === 'excellent' ? '🌟' : report.assessment === 'good' ? '👍' : '💪'}
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>
                {report.assessment === 'excellent' ? '训练出色！' : report.assessment === 'good' ? '训练良好！' : '继续加油！'}
              </h2>
              <p style={{ fontSize: 15, color: '#64748b' }}>
                {report.assessment === 'excellent' ? '你展现了优秀的心理韧性和应对能力' :
                  report.assessment === 'good' ? '你的表现不错，还有提升空间' :
                    '心理韧性需要持续训练，不要气馁'}
              </p>
            </div>

            {/* 统计数据 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { label: '最终压力', value: `${report.finalStress}%`, color: stressColor(report.finalStress / 100) },
                { label: '压力降低', value: `${report.stressReduction > 0 ? '+' : ''}${report.stressReduction}%`, color: report.stressReduction > 0 ? '#10b981' : '#ef4444' },
                { label: '对话轮数', value: report.totalRounds, color: '#6366f1' },
                { label: '平均压力', value: `${report.avgStress}%`, color: '#f59e0b' }
              ].map((s, i) => (
                <div key={i} className="persona-card" style={{ padding: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* 压力变化图 */}
            <div className="persona-card" style={{ padding: 24, marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>压力变化曲线</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100 }}>
                {stressHistory.map((s, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>{Math.round(s * 100)}%</div>
                    <div style={{ width: '100%', height: `${s * 80}px`, background: `linear-gradient(to top, ${stressColor(s)}, ${stressColor(s)}80)`, borderRadius: '6px 6px 0 0', transition: '0.3s' }}></div>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{i + 1}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 训练详情 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div className="persona-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>训练详情</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: '训练场景', value: report.scenario },
                    { label: '人格类型', value: report.mbtiType },
                    { label: '最高压力', value: `${report.maxStress}%` },
                    { label: '最低压力', value: `${report.minStress}%` }
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: 13, color: '#64748b' }}>{item.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="persona-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>提升技能</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {report.skillsImproved.map((skill, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: '#ecfdf5', borderRadius: 10 }}>
                      <span style={{ fontSize: 18 }}>✅</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#10b981' }}>{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => { setStep('select'); setScenario(null); setMessages([]); setStress(0.5); setStressHistory([]); setRound(0); setReport(null); }}
                className="persona-btn persona-btn-primary">再次训练</button>
              <button onClick={() => window.location.href = '/dashboard'}
                className="persona-btn persona-btn-secondary">返回仪表盘</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
