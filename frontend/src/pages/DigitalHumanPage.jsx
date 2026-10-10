import { useState, useEffect, useRef } from 'react';
import { digitalHumanAPI, chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';

export default function DigitalHumanPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [emotion, setEmotion] = useState('neutral');
  const [speechSupported, setSpeechSupported] = useState(true);
  const chatEndRef = useRef(null);
  const audioRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    loadHistory();
    // 检查浏览器是否支持语音识别
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadHistory = async () => {
    try {
      const res = await digitalHumanAPI.getHistory();
      if (res.history && res.history.length > 0) {
        const historyMessages = [];
        res.history.reverse().forEach(h => {
          historyMessages.push({ role: 'user', text: h.userMessage });
          historyMessages.push({ role: 'ai', text: h.aiResponse });
        });
        setMessages(historyMessages);
      } else {
        setMessages([{
          role: 'ai',
          text: `您好${user?.username}！我是您的专属数字心理医生。很高兴见到您，今天有什么想聊的吗？`
        }]);
      }
    } catch (e) {
      setMessages([{
        role: 'ai',
        text: `您好${user?.username}！我是您的专属数字心理医生。很高兴见到您！`
      }]);
    }
  };

  const sendTextMessage = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const res = await chatAPI.send({ message: msg, sessionId: 'digital-human', moduleType: 'advisor' });
      setMessages(prev => [...prev, { role: 'ai', text: res.response }]);
      setEmotion('happy');
      playText(res.response);
    } catch (e) {
      console.error('发送失败:', e);
      setMessages(prev => [...prev, { role: 'ai', text: '抱歉，暂时无法回复。' }]);
    } finally {
      setLoading(false);
    }
  };

  // 语音识别 - 使用浏览器原生 SpeechRecognition API
  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('您的浏览器不支持语音识别，请使用Chrome浏览器');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      // 实时显示识别中的文字
      if (interimTranscript) {
        setInput(interimTranscript);
      }
      
      // 识别完成，发送消息
      if (finalTranscript) {
        setInput(finalTranscript);
        // 自动发送
        setTimeout(() => {
          sendVoiceMessage(finalTranscript);
        }, 300);
      }
    };

    recognition.onerror = (event) => {
      console.error('语音识别错误:', event.error);
      if (event.error === 'not-allowed') {
        alert('请允许浏览器使用麦克风');
      } else if (event.error === 'no-speech') {
        alert('未检测到语音，请重试');
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const sendVoiceMessage = async (text) => {
    if (!text.trim() || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);
    try {
      const res = await chatAPI.send({ message: text, sessionId: 'digital-human', moduleType: 'advisor' });
      setMessages(prev => [...prev, { role: 'ai', text: res.response }]);
      setEmotion('happy');
      playText(res.response);
    } catch (e) {
      console.error('发送失败:', e);
      setMessages(prev => [...prev, { role: 'ai', text: '抱歉，暂时无法回复。' }]);
    } finally {
      setLoading(false);
    }
  };

  const playText = async (text) => {
    if (!text) return;
    
    try {
      setIsSpeaking(true);
      
      const response = await fetch('/api/digital-human/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ text })
      });
      
      if (!response.ok) throw new Error('TTS请求失败');
      
      const blob = await response.blob();
      if (blob.size < 100) throw new Error('TTS返回空音频');
      
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
        setEmotion('neutral');
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
        fallbackTTS(text);
      };
      
      await audio.play();
    } catch (e) {
      console.error('TTS失败:', e.message);
      fallbackTTS(text);
    }
  };

  const fallbackTTS = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.onend = () => { setIsSpeaking(false); setEmotion('neutral'); };
      utterance.onerror = () => { setIsSpeaking(false); };
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(false);
    }
  };

  return (
    <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:24,height:'100%'}}>
      {/* 左侧：虚拟形象 */}
      <div className="card" style={{padding:24,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
        <Avatar isSpeaking={isSpeaking} emotion={emotion} />
        
        <div style={{marginTop:16,textAlign:'center'}}>
          <div style={{fontSize:16,fontWeight:600,color:'#333'}}>数字心理医生</div>
          <div style={{fontSize:12,color:isSpeaking?'#667eea':'#999',marginTop:4}}>
            {isSpeaking ? '正在说话...' : isRecording ? '正在聆听...' : '等待您的提问'}
          </div>
        </div>

        {isSpeaking && (
          <div style={{marginTop:12,display:'flex',gap:4,justifyContent:'center'}}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                width:4, height:20, background:'#667eea', borderRadius:2,
                animation:`soundBar 0.8s infinite ease-in-out ${i*0.1}s`
              }}></div>
            ))}
          </div>
        )}

        <style>{`
          @keyframes soundBar {
            0%,100% { height: 8px; }
            50% { height: 24px; }
          }
        `}</style>
      </div>

      {/* 右侧：聊天区 */}
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div className="card" style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',padding:0}}>
          {/* 聊天头部 */}
          <div style={{padding:'16px 24px',borderBottom:'1px solid #e8e8e8',display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:40,height:40,background:'linear-gradient(135deg,#667eea,#764ba2)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>🤖</div>
            <div>
              <div style={{fontSize:15,fontWeight:600,color:'#333'}}>数字心理医生</div>
              <div style={{fontSize:12,color:'#22c55e'}}>在线</div>
            </div>
          </div>

          {/* 消息区 */}
          <div style={{flex:1,overflowY:'auto',padding:24}}>
            {messages.map((m,i)=>(
              <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start',marginBottom:16}}>
                {m.role==='ai'&&<div style={{width:36,height:36,background:'linear-gradient(135deg,#667eea,#764ba2)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,marginRight:10,flexShrink:0}}>🤖</div>}
                <div style={{maxWidth:'70%',padding:'12px 16px',borderRadius:12,background:m.role==='user'?'#667eea':'#f5f5f5',color:m.role==='user'?'#fff':'#333',fontSize:14,lineHeight:1.6}}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading&&(
              <div style={{display:'flex',marginBottom:16}}>
                <div style={{width:36,height:36,background:'linear-gradient(135deg,#667eea,#764ba2)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,marginRight:10,flexShrink:0}}>🤖</div>
                <div style={{padding:'12px 16px',borderRadius:12,background:'#f5f5f5'}}>
                  <div style={{display:'flex',gap:4}}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,background:'#999',borderRadius:'50%',animation:`bounce 1.4s infinite ease-in-out ${i*0.16}s`}}></div>)}</div>
                </div>
              </div>
            )}
            <div ref={chatEndRef}></div>
          </div>

          {/* 输入区 */}
          <div style={{padding:'16px 24px',borderTop:'1px solid #e8e8e8',display:'flex',gap:8,alignItems:'center'}}>
            <button 
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!speechSupported}
              style={{
                width:44, height:44, borderRadius:10, border:'none',
                background: isRecording ? '#e53e3e' : speechSupported ? '#f5f5f5' : '#ddd',
                color: isRecording ? '#fff' : speechSupported ? '#666' : '#999',
                cursor: speechSupported ? 'pointer' : 'not-allowed',
                display:'flex', alignItems:'center', justifyContent:'center',
                transition:'0.2s', flexShrink:0
              }}
              title={!speechSupported ? '浏览器不支持语音识别' : isRecording ? '停止录音' : '语音输入'}
            >
              {isRecording ? (
                <div style={{display:'flex',alignItems:'center',gap:2}}>
                  <div style={{width:8,height:8,background:'#fff',borderRadius:2}}></div>
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
              value={input} 
              onChange={e=>setInput(e.target.value)} 
              onKeyPress={e=>e.key==='Enter'&&sendTextMessage()} 
              placeholder={isRecording ? "正在聆听，请说话..." : "输入消息或点击麦克风语音输入"} 
              className="input-field" 
              style={{flex:1, borderColor: isRecording ? '#e53e3e' : undefined}}
            />
            <button onClick={sendTextMessage} disabled={!input.trim()||loading} className="btn-primary">发送</button>
          </div>
          
          {isRecording && (
            <div style={{padding:'8px 24px',background:'#fff0f0',fontSize:12,color:'#e53e3e',display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:8,height:8,background:'#e53e3e',borderRadius:'50%',animation:'pulse 1s infinite'}}></div>
              正在录音中...说完后会自动识别发送
            </div>
          )}
          <style>{`
            @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
            @keyframes bounce { 0%,80%,100% { transform:translateY(0) } 40% { transform:translateY(-6px) } }
          `}</style>
        </div>
      </div>
    </div>
  );
}
