import { useState, useEffect, useRef } from 'react';
import { mentalHealthAPI, enhancedAPI } from '../services/api';

export default function MentalHealthPage() {
  const [step, setStep] = useState('intro');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  
  // 语音识别状态
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  // 自动滚动到最新消息
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatLoading]);

  useEffect(() => { loadQuestions(); }, []);
  const loadQuestions = async () => { try { const r = await mentalHealthAPI.getQuestions(); setQuestions(r.questions); } catch {} };

  const startTest = () => { setStep('test'); setCurrentQuestion(0); setAnswers({}); };
  const handleAnswer = (id, score) => {
    setAnswers(p => ({ ...p, [id]: score }));
    if (currentQuestion < questions.length - 1) setCurrentQuestion(p => p + 1);
    else submitTest();
  };
  const submitTest = async () => {
    setLoading(true);
    try {
      let r;
      const answerList = Object.entries(answers).map(([id, s]) => ({ questionId: +id, score: s }));
      
      if (testType === 'phq9') {
        r = await enhancedAPI.submitPHQ9(answerList);
        setResult({ ...r.result, testType: 'phq9' });
      } else if (testType === 'gad7') {
        r = await enhancedAPI.submitGAD7(answerList);
        setResult({ ...r.result, testType: 'gad7' });
      } else {
        r = await mentalHealthAPI.submitTest({ scl90Answers: answerList, completionTime: 0, userSatisfaction: 3 });
        setResult(r.result);
      }
      setStep('result');
    } catch { alert('提交失败'); }
    finally { setLoading(false); }
  };
  const startChat = () => { setStep('chat'); setChatMessages([{ role: 'ai', text: '您好呀！我是您的心理健康评估助手。最近生活、工作或者学习上有什么让您感到困扰的事情吗？您可以随意和我聊聊，我会认真倾听您的感受。' }]); };
  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim(); setChatInput('');
    setChatMessages(p => [...p, { role: 'user', text: msg }]); setChatLoading(true);
    try { const r = await mentalHealthAPI.chat({ message: msg, conversationHistory: chatMessages }); setChatMessages(p => [...p, { role: 'ai', text: r.response }]); }
    catch { setChatMessages(p => [...p, { role: 'ai', text: '暂时无法回复。' }]); }
    finally { setChatLoading(false); }
  };

  // 结束对话测试
  const endChatTest = async () => {
    setLoading(true);
    try {
      const allText = chatMessages.map(m => m.text).join(' ');
      const r = await mentalHealthAPI.submitTest({ 
        scl90Answers: [], 
        textInput: allText,
        completionTime: 0, 
        userSatisfaction: 3 
      });
      setResult(r.result); 
      setStep('result');
    } catch {} finally { setLoading(false); }
  };

  // 语音识别功能
  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('您的浏览器不支持语音识别，请使用Chrome浏览器');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'zh-CN';
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onstart = () => {
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(p => p + 1);
      }, 1000);
    };

    recognitionRef.current.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setChatInput(prev => prev + finalTranscript);
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('语音识别错误:', event.error);
      stopRecording();
    };

    recognitionRef.current.onend = () => {
      stopRecording();
    };

    recognitionRef.current.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    setRecordingTime(0);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const riskColor = (l) => ({ critical: '#e53e3e', high: '#f97316', medium: '#f59e0b', low: '#22c55e' }[l] || '#22c55e');

  // PHQ-9 测试
  const startPHQ9 = async () => {
    setLoading(true);
    try {
      const r = await enhancedAPI.getScaleQuestions('phq9');
      setQuestions(r.questions);
      setTestType('phq9');
      setStep('test');
      setCurrentQuestion(0);
      setAnswers({});
    } catch { alert('加载失败'); }
    finally { setLoading(false); }
  };

  // GAD-7 测试
  const startGAD7 = async () => {
    setLoading(true);
    try {
      const r = await enhancedAPI.getScaleQuestions('gad7');
      setQuestions(r.questions);
      setTestType('gad7');
      setStep('test');
      setCurrentQuestion(0);
      setAnswers({});
    } catch { alert('加载失败'); }
    finally { setLoading(false); }
  };

  const [testType, setTestType] = useState('scl90');

  return (
    <div style={{maxWidth:800,margin:'0 auto'}}>
      {step === 'intro' && (
        <div className="card" style={{padding:32}}>
          <h2 style={{fontSize:24,fontWeight:700,color:'#1a1a2e',marginBottom:12}}>心理健康测试</h2>
          <p style={{fontSize:14,color:'#666',marginBottom:24}}>选择测试方式，了解您的心理健康状态</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
            <div onClick={startTest} className="card" style={{padding:24,cursor:'pointer',textAlign:'center'}}>
              <div style={{fontSize:48,marginBottom:12}}>📋</div>
              <h3 style={{fontSize:16,fontWeight:600,color:'#1a1a2e',marginBottom:8}}>SCL-90量表</h3>
              <p style={{fontSize:13,color:'#999'}}>综合心理健康评估</p>
            </div>
            <div onClick={startPHQ9} className="card" style={{padding:24,cursor:'pointer',textAlign:'center'}}>
              <div style={{fontSize:48,marginBottom:12}}>😔</div>
              <h3 style={{fontSize:16,fontWeight:600,color:'#1a1a2e',marginBottom:8}}>PHQ-9抑郁筛查</h3>
              <p style={{fontSize:13,color:'#999'}}>专业抑郁评估量表</p>
            </div>
            <div onClick={startGAD7} className="card" style={{padding:24,cursor:'pointer',textAlign:'center'}}>
              <div style={{fontSize:48,marginBottom:12}}>😰</div>
              <h3 style={{fontSize:16,fontWeight:600,color:'#1a1a2e',marginBottom:8}}>GAD-7焦虑筛查</h3>
              <p style={{fontSize:13,color:'#999'}}>专业焦虑评估量表</p>
            </div>
          </div>
          <div style={{marginTop:24,textAlign:'center'}}>
            <div onClick={startChat} style={{display:'inline-block',padding:'12px 24px',background:'#f5f5f5',borderRadius:10,cursor:'pointer',fontSize:14,color:'#666'}}>
              💬 或选择对话式评估，与AI助手自然交流
            </div>
          </div>
        </div>
      )}

      {step === 'test' && questions.length > 0 && (
        <div className="card" style={{padding:32}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
            <h2 style={{fontSize:20,fontWeight:700,color:'#1a1a2e'}}>SCL-90量表测试</h2>
            <span style={{padding:'4px 10px',background:'#f0f0ff',color:'#667eea',borderRadius:6,fontSize:12,fontWeight:600}}>{currentQuestion+1}/{questions.length}</span>
          </div>
          <div style={{width:'100%',height:4,background:'#f0f0f0',borderRadius:2,marginBottom:32,overflow:'hidden'}}>
            <div style={{height:'100%',background:'#667eea',borderRadius:2,transition:'width 0.3s',width:`${((currentQuestion+1)/questions.length)*100}%`}}></div>
          </div>
          <div style={{marginBottom:32}}>
            <div style={{fontSize:12,color:'#999',marginBottom:8}}>{questions[currentQuestion].category}</div>
            <p style={{fontSize:18,fontWeight:600,color:'#1a1a2e'}}>{questions[currentQuestion].text}</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
            {[1,2,3,4,5].map(s=>(
              <button key={s} onClick={()=>handleAnswer(questions[currentQuestion].id,s)} style={{padding:'16px 8px',borderRadius:8,border:'2px solid',borderColor:answers[questions[currentQuestion].id]===s?'#667eea':'#e8e8e8',background:answers[questions[currentQuestion].id]===s?'#667eea':'#fff',color:answers[questions[currentQuestion].id]===s?'#fff':'#666',cursor:'pointer',transition:'0.15s',fontWeight:600}}>
                <div style={{fontSize:18,marginBottom:4}}>{s}</div>
                <div style={{fontSize:11,opacity:0.8}}>{['没有','轻度','中度','偏重','严重'][s-1]}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'chat' && (
        <div className="card" style={{padding:32}}>
          <h2 style={{fontSize:20,fontWeight:700,color:'#1a1a2e',marginBottom:20}}>对话式评估</h2>
          <div ref={chatEndRef} style={{height:400,overflowY:'auto',marginBottom:16,padding:16,background:'#f5f5f5',borderRadius:12}}>
            {chatMessages.map((m,i)=>(
              <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start',marginBottom:12}}>
                <div style={{maxWidth:'80%',padding:'12px 16px',borderRadius:12,background:m.role==='user'?'#667eea':'#fff',color:m.role==='user'?'#fff':'#333',border:m.role==='user'?'none':'1px solid #e8e8e8'}}>{m.text}</div>
              </div>
            ))}
            {chatLoading && <div style={{padding:'12px 16px',borderRadius:12,background:'#fff',border:'1px solid #e8e8e8',display:'inline-block'}}><div style={{display:'flex',gap:4}}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,background:'#999',borderRadius:'50%',animation:`bounce 1.4s infinite ease-in-out ${i*0.16}s`}}></div>)}</div></div>}
            <div ref={chatEndRef}></div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <button 
              onClick={toggleRecording}
              style={{
                width:44, height:44, borderRadius:10, border:'none',
                background: isRecording ? '#e53e3e' : '#f5f5f5',
                color: isRecording ? '#fff' : '#666',
                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                transition:'0.2s', flexShrink:0
              }}
              title={isRecording ? '停止录音' : '语音输入'}
            >
              {isRecording ? (
                <div style={{display:'flex',alignItems:'center',gap:4}}>
                  <div style={{width:8,height:8,background:'#fff',borderRadius:2}}></div>
                  <span style={{fontSize:11}}>{recordingTime}s</span>
                </div>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              )}
            </button>
            <input 
              value={chatInput} 
              onChange={e=>setChatInput(e.target.value)} 
              onKeyPress={e=>e.key==='Enter'&&sendChat()} 
              placeholder={isRecording ? "正在录音，请说话..." : "输入您的感受或点击麦克风语音输入"} 
              className="input-field" 
              style={{flex:1, borderColor: isRecording ? '#e53e3e' : undefined}}
            />
            <button onClick={sendChat} disabled={!chatInput.trim()||chatLoading} className="btn-primary">发送</button>
          </div>
          
          {/* 结束测试按钮 - 对话4条后显示 */}
          {chatMessages.length >= 4 && (
            <div style={{marginTop:16,paddingTop:16,borderTop:'1px solid #e8e8e8'}}>
              <button 
                onClick={endChatTest} 
                disabled={loading}
                style={{
                  width:'100%', padding:'14px', borderRadius:10, border:'2px solid #667eea',
                  background:'#fff', color:'#667eea', fontWeight:600, fontSize:14, cursor:'pointer',
                  transition:'0.2s'
                }}
                onMouseEnter={e=>{e.target.style.background='#667eea';e.target.style.color='#fff';}}
                onMouseLeave={e=>{e.target.style.background='#fff';e.target.style.color='#667eea';}}
              >
                {loading ? '正在生成报告...' : '✓ 结束测试并查看报告'}
              </button>
              <p style={{textAlign:'center',fontSize:12,color:'#999',marginTop:8}}>已对话{Math.floor(chatMessages.length/2)}轮，点击结束测试获取评估报告</p>
            </div>
          )}
          {isRecording && (
            <div style={{marginTop:8,padding:'8px 12px',background:'#fff0f0',borderRadius:8,fontSize:12,color:'#e53e3e',display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:8,height:8,background:'#e53e3e',borderRadius:'50%',animation:'pulse 1s infinite'}}></div>
              正在录音中...请说话，完成后点击麦克风按钮停止
            </div>
          )}
          <style>{`
            @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
          `}</style>
        </div>
      )}

      {step === 'result' && result && (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div className="card" style={{padding:32}}>
            <h2 style={{fontSize:24,fontWeight:700,color:'#1a1a2e',marginBottom:24}}>
              {result.testType === 'phq9' ? 'PHQ-9 抑郁筛查结果' : 
               result.testType === 'gad7' ? 'GAD-7 焦虑筛查结果' : '测试结果'}
            </h2>
            
            {/* 风险等级显示 */}
            <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:24}}>
              <div style={{padding:'8px 16px',borderRadius:6,background:riskColor(result.riskLevel || result.severity === 'severe' ? 'critical' : result.severity === 'moderately_severe' ? 'high' : result.severity === 'moderate' ? 'medium' : 'low'),color:'#fff',fontSize:13,fontWeight:600}}>
                {result.interpretation || result.riskCategory || '评估完成'}
              </div>
              {result.totalScore !== undefined && (
                <div style={{fontSize:32,fontWeight:700,color:'#1a1a2e'}}>
                  {result.testType === 'phq9' ? `${result.totalScore}/27` : 
                   result.testType === 'gad7' ? `${result.totalScore}/21` : 
                   `${Math.round((result.finalScore || 0)*100)}分`}
                </div>
              )}
            </div>
            
            {/* PHQ-9 特殊显示 */}
            {result.testType === 'phq9' && (
              <div style={{marginBottom:24}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                  <div style={{padding:16,background:'#f5f5f5',borderRadius:8}}>
                    <div style={{fontSize:12,color:'#999',marginBottom:4}}>严重程度</div>
                    <div style={{fontSize:14,fontWeight:600,color:'#333'}}>{result.interpretation}</div>
                  </div>
                  <div style={{padding:16,background:result.suicideRisk !== 'none' ? '#fff0f0' : '#f5f5f5',borderRadius:8}}>
                    <div style={{fontSize:12,color:result.suicideRisk !== 'none' ? '#e53e3e' : '#999',marginBottom:4}}>自杀风险</div>
                    <div style={{fontSize:14,fontWeight:600,color:result.suicideRisk !== 'none' ? '#e53e3e' : '#333'}}>
                      {result.suicideRisk === 'high' ? '高风险' : result.suicideRisk === 'medium' ? '中风险' : result.suicideRisk === 'low' ? '低风险' : '无'}
                    </div>
                  </div>
                </div>
                {result.suicideRisk !== 'none' && (
                  <div style={{padding:12,background:'#fff0f0',borderRadius:8,marginBottom:16,fontSize:13,color:'#e53e3e'}}>
                    ⚠️ 如感到痛苦或有自杀想法，请立即拨打心理危机干预热线：400-161-9995
                  </div>
                )}
              </div>
            )}
            
            {/* GAD-7 特殊显示 */}
            {result.testType === 'gad7' && (
              <div style={{marginBottom:24}}>
                <div style={{padding:16,background:'#f5f5f5',borderRadius:8}}>
                  <div style={{fontSize:12,color:'#999',marginBottom:4}}>严重程度</div>
                  <div style={{fontSize:14,fontWeight:600,color:'#333'}}>{result.interpretation}</div>
                </div>
              </div>
            )}
            
            {/* 通用信息 */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:24}}>
              <div style={{padding:16,background:'#f5f5f5',borderRadius:8}}>
                <div style={{fontSize:12,color:'#999',marginBottom:4}}>风险等级</div>
                <div style={{fontSize:14,fontWeight:600,color:'#333'}}>{result.riskLevel || 'low'}</div>
              </div>
              <div style={{padding:16,background:'#f5f5f5',borderRadius:8}}>
                <div style={{fontSize:12,color:'#999',marginBottom:4}}>评估时间</div>
                <div style={{fontSize:14,fontWeight:600,color:'#333'}}>{new Date().toLocaleString('zh-CN')}</div>
              </div>
            </div>
            
            {/* 建议 */}
            {result.recommendations && result.recommendations.length > 0 && (
              <>
                <h3 style={{fontSize:16,fontWeight:600,color:'#1a1a2e',marginBottom:12}}>建议</h3>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {result.recommendations.map((r,i)=>(
                    <div key={i} style={{padding:16,borderLeft:`3px solid ${riskColor(r.priority==='urgent'?'critical':r.priority==='high'?'high':r.priority==='medium'?'medium':'low')}`,background:'#f5f5f5',borderRadius:'0 8px 8px 0'}}>
                      <div style={{fontSize:14,fontWeight:600,color:'#333',marginBottom:4}}>{r.action}</div>
                      <div style={{fontSize:13,color:'#666'}}>{r.description}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>{setStep('intro');setResult(null);setTestType('scl90');}} className="btn-secondary">重新测试</button>
            <button onClick={startChat} className="btn-primary">对话式评估</button>
          </div>
        </div>
      )}
    </div>
  );
}
