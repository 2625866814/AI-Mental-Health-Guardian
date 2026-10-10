import { useState, useRef, useEffect } from 'react';
import { artAPI } from '../services/api';

const NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C+'];
const NOTE_FREQ = { 'C': 261.63, 'D': 293.66, 'E': 329.63, 'F': 349.23, 'G': 392.00, 'A': 440.00, 'B': 493.88, 'C+': 523.25 };

export default function ArtTherapyPage() {
  const [tab, setTab] = useState('drawing');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  // 绘画状态
  const canvasRef = useRef(null);
  const [showCanvas, setShowCanvas] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [last, setLast] = useState({x:0,y:0});
  const [brushColor, setBrushColor] = useState('#667eea');
  const [brushSize, setBrushSize] = useState(5);
  const [brushTool, setBrushTool] = useState('pen');
  const [hasDrawing, setHasDrawing] = useState(false);
  
  // 音乐状态
  const [melody, setMelody] = useState([]);
  const [toneType, setToneType] = useState('sine');
  const [tempo, setTempo] = useState(120);
  const audioCtx = useRef(null);

  useEffect(() => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  }, []);

  // 打开画布弹窗
  const openCanvas = () => {
    setShowCanvas(true);
    setHasDrawing(false);
    // 延迟初始化画布，等待DOM更新
    setTimeout(() => {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }, 100);
  };

  // 关闭画布弹窗
  const closeCanvas = () => {
    setShowCanvas(false);
  };

  // 绘画功能
  const startDraw = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    setLast({
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    });
    setDrawing(true);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = brushTool === 'eraser' ? '#fff' : brushColor;
    ctx.lineWidth = brushTool === 'eraser' ? brushSize * 3 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    setLast({x, y});
    setHasDrawing(true);
  };

  const stopDraw = () => setDrawing(false);

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasDrawing(false);
  };

  const saveDrawing = async () => {
    if (!canvasRef.current || !hasDrawing) {
      alert('请先在画布上绘画');
      return;
    }
    setLoading(true);
    try {
      const imageData = canvasRef.current.toDataURL('image/png');
      const r = await artAPI.saveDrawing({ imageData, metadata: { width: 800, height: 600, colors: [brushColor], brushSize, tool: brushTool } });
      setResult(r);
      setShowCanvas(false);
    } catch { alert('保存失败'); }
    finally { setLoading(false); }
  };

  // 音乐功能
  const addNote = (note) => {
    setMelody(prev => [...prev, note]);
  };

  const playMelody = () => {
    if (melody.length === 0) return alert('请先创作一些音符');
    const ctx = audioCtx.current;
    const noteDuration = 60 / tempo;
    melody.forEach((note, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = toneType;
      osc.frequency.value = NOTE_FREQ[note];
      const startTime = ctx.currentTime + i * noteDuration;
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration * 0.9);
      osc.start(startTime);
      osc.stop(startTime + noteDuration);
    });
  };

  const clearMelody = () => setMelody([]);

  const saveMusic = async () => {
    if (melody.length === 0) return alert('请先创作一些音符');
    setLoading(true);
    try {
      const r = await artAPI.saveMusic({ 
        musicData: { notes: melody, toneType, tempo },
        metadata: { noteCount: melody.length, duration: melody.length * (60 / tempo) }
      });
      setResult(r);
    } catch { alert('保存失败'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{display:'grid',gridTemplateColumns:'320px 1fr',gap:24}}>
      {/* 左侧工具栏 */}
      <div className="card" style={{padding:24}}>
        <h2 style={{fontSize:20,fontWeight:700,color:'#1a1a2e',marginBottom:20}}>艺术疗愈</h2>
        
        {/* 标签切换 */}
        <div style={{display:'flex',gap:4,padding:4,background:'#f5f5f5',borderRadius:8,marginBottom:20}}>
          {[{id:'drawing',label:'绘画'},{id:'music',label:'音乐'}].map(t=>(
            <button key={t.id} onClick={()=>{setTab(t.id);setResult(null)}} style={{flex:1,padding:8,border:'none',borderRadius:6,background:tab===t.id?'#667eea':'transparent',color:tab===t.id?'#fff':'#999',fontWeight:600,fontSize:12,cursor:'pointer',transition:'0.15s'}}>{t.label}</button>
          ))}
        </div>

        {tab === 'drawing' ? (
          <div>
            <p style={{fontSize:13,color:'#999',marginBottom:16}}>用色彩和线条表达情绪</p>
            
            {/* 绘画工具设置 */}
            <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
              <div>
                <label style={{fontSize:11,color:'#999',display:'block',marginBottom:4}}>画笔颜色</label>
                <input type="color" value={brushColor} onChange={e=>setBrushColor(e.target.value)} style={{width:50,height:36,border:'1px solid #e8e8e8',borderRadius:6,cursor:'pointer'}}/>
              </div>
              <div style={{flex:1,minWidth:100}}>
                <label style={{fontSize:11,color:'#999',display:'block',marginBottom:4}}>画笔大小: {brushSize}px</label>
                <input type="range" min="1" max="20" value={brushSize} onChange={e=>setBrushSize(+e.target.value)} style={{width:'100%'}}/>
              </div>
              <div>
                <label style={{fontSize:11,color:'#999',display:'block',marginBottom:4}}>工具</label>
                <select value={brushTool} onChange={e=>setBrushTool(e.target.value)} style={{padding:'8px 12px',border:'1px solid #e8e8e8',borderRadius:6,fontSize:12}}>
                  <option value="pen">画笔</option>
                  <option value="eraser">橡皮擦</option>
                </select>
              </div>
            </div>

            {/* 开始绘画按钮 */}
            <button onClick={openCanvas} className="btn-primary" style={{width:'100%',fontSize:14,padding:'12px 20px'}}>
              🎨 开始绘画
            </button>
            
            <p style={{fontSize:11,color:'#bbb',marginTop:12,textAlign:'center'}}>点击上方按钮打开画布进行创作</p>
          </div>
        ) : (
          <div>
            <p style={{fontSize:13,color:'#999',marginBottom:12}}>点击音符按钮创作旋律</p>
            
            {/* 音乐设置 */}
            <div style={{display:'flex',gap:8,marginBottom:12}}>
              <div style={{flex:1}}>
                <label style={{fontSize:11,color:'#999',display:'block',marginBottom:4}}>音色</label>
                <select value={toneType} onChange={e=>setToneType(e.target.value)} style={{width:'100%',padding:'8px 12px',border:'1px solid #e8e8e8',borderRadius:6,fontSize:12}}>
                  <option value="sine">正弦波</option>
                  <option value="square">方波</option>
                  <option value="sawtooth">锯齿波</option>
                  <option value="triangle">三角波</option>
                </select>
              </div>
              <div style={{flex:1}}>
                <label style={{fontSize:11,color:'#999',display:'block',marginBottom:4}}>速度: {tempo}</label>
                <input type="range" min="60" max="180" value={tempo} onChange={e=>setTempo(+e.target.value)} style={{width:'100%'}}/>
              </div>
            </div>

            {/* 音符按钮 */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:12}}>
              {NOTES.map(note=>(
                <button key={note} onClick={()=>addNote(note)} style={{padding:'12px 4px',borderRadius:8,border:'1px solid #e8e8e8',background:'#fff',cursor:'pointer',fontWeight:600,fontSize:14,color:'#333',transition:'0.15s'}}
                  onMouseEnter={e=>{e.target.style.borderColor='#667eea';e.target.style.color='#667eea'}}
                  onMouseLeave={e=>{e.target.style.borderColor='#e8e8e8';e.target.style.color='#333'}}>
                  {note}
                </button>
              ))}
            </div>

            {/* 当前旋律 */}
            <div style={{padding:12,background:'#f5f5f5',borderRadius:8,marginBottom:12,minHeight:44,fontSize:13,color:'#666'}}>
              {melody.length > 0 ? melody.join(' - ') : '等待创作...'}
            </div>

            {/* 操作按钮 */}
            <div style={{display:'flex',gap:8}}>
              <button onClick={playMelody} className="btn-secondary" style={{flex:1,fontSize:12,padding:10}}>▶ 播放</button>
              <button onClick={clearMelody} className="btn-secondary" style={{flex:1,fontSize:12,padding:10}}>清空</button>
            </div>
            <button onClick={saveMusic} disabled={loading||melody.length===0} className="btn-primary" style={{width:'100%',marginTop:12,fontSize:12,padding:10}}>{loading?'分析中...':'保存并分析'}</button>
          </div>
        )}
      </div>

      {/* 右侧结果 */}
      <div className="card" style={{padding:32}}>
        {result ? (
          <div>
            <h2 style={{fontSize:20,fontWeight:700,color:'#1a1a2e',marginBottom:24}}>分析结果</h2>
            
            {result.analysis && (
              <div style={{marginBottom:20}}>
                <h3 style={{fontSize:14,fontWeight:600,color:'#333',marginBottom:12}}>情绪分析</h3>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div style={{padding:16,background:'#f5f5f5',borderRadius:8}}>
                    <div style={{fontSize:12,color:'#999',marginBottom:4}}>情绪状态</div>
                    <div style={{fontSize:16,fontWeight:600,color:'#333'}}>
                      {result.analysis.emotion === 'positive' ? '😊 积极' : result.analysis.emotion === 'negative' ? '😢 消极' : '😐 平静'}
                    </div>
                  </div>
                  <div style={{padding:16,background:'#f5f5f5',borderRadius:8}}>
                    <div style={{fontSize:12,color:'#999',marginBottom:4}}>情绪分数</div>
                    <div style={{fontSize:16,fontWeight:600,color:'#333'}}>{Math.round((result.analysis.emotionScore || 0.5) * 100)}%</div>
                  </div>
                </div>
                {result.analysis.analysis && (
                  <div style={{marginTop:12,padding:12,background:'#f5f5f5',borderRadius:8,fontSize:13,color:'#666'}}>{result.analysis.analysis}</div>
                )}
              </div>
            )}

            {result.healingTask && (
              <div style={{padding:20,background:'#f0f0ff',borderRadius:12}}>
                <h3 style={{fontSize:14,fontWeight:600,color:'#333',marginBottom:8}}>🎯 {result.healingTask.title}</h3>
                <p style={{fontSize:13,color:'#666',marginBottom:12}}>{result.healingTask.description}</p>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {result.healingTask.activities?.map((a,i)=>(
                    <div key={i} style={{fontSize:13,color:'#666'}}>• {a}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{textAlign:'center',padding:64}}>
            <div style={{fontSize:64,marginBottom:16,opacity:0.5}}>🎨</div>
            <h3 style={{fontSize:16,fontWeight:600,color:'#999',marginBottom:8}}>开始艺术疗愈</h3>
            <p style={{fontSize:13,color:'#bbb'}}>选择左侧的工具，通过创作表达情绪</p>
          </div>
        )}
      </div>

      {/* 画布弹窗 */}
      {showCanvas && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'#fff',borderRadius:16,padding:24,maxWidth:900,width:'95%',maxHeight:'95vh',overflow:'auto'}}>
            {/* 弹窗头部 */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <h3 style={{fontSize:18,fontWeight:700,color:'#1a1a2e'}}>🎨 绘画创作</h3>
              <button onClick={closeCanvas} style={{width:36,height:36,borderRadius:8,border:'1px solid #e8e8e8',background:'#fff',cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            </div>

            {/* 工具栏 */}
            <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center',padding:'12px',background:'#f5f5f5',borderRadius:8}}>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <label style={{fontSize:12,color:'#666'}}>颜色:</label>
                <input type="color" value={brushColor} onChange={e=>setBrushColor(e.target.value)} style={{width:36,height:32,border:'1px solid #e8e8e8',borderRadius:4,cursor:'pointer'}}/>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <label style={{fontSize:12,color:'#666'}}>大小:</label>
                <input type="range" min="1" max="20" value={brushSize} onChange={e=>setBrushSize(+e.target.value)} style={{width:100}}/>
                <span style={{fontSize:12,color:'#666',minWidth:30}}>{brushSize}px</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <label style={{fontSize:12,color:'#666'}}>工具:</label>
                <select value={brushTool} onChange={e=>setBrushTool(e.target.value)} style={{padding:'6px 10px',border:'1px solid #e8e8e8',borderRadius:6,fontSize:12}}>
                  <option value="pen">画笔</option>
                  <option value="eraser">橡皮擦</option>
                </select>
              </div>
              <div style={{flex:1}}></div>
              <button onClick={clearCanvas} style={{padding:'8px 16px',borderRadius:6,border:'1px solid #e8e8e8',background:'#fff',cursor:'pointer',fontSize:12,color:'#666'}}>清空画布</button>
            </div>

            {/* 画布 */}
            <div style={{display:'flex',justifyContent:'center',marginBottom:16}}>
              <canvas 
                ref={canvasRef} 
                width={800} 
                height={500}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={stopDraw}
                style={{width:'100%',maxWidth:800,height:'auto',border:'2px solid #e8e8e8',borderRadius:12,cursor:'crosshair',background:'#fff',touchAction:'none'}}
              />
            </div>

            {/* 底部按钮 */}
            <div style={{display:'flex',gap:12,justifyContent:'flex-end'}}>
              <button onClick={closeCanvas} style={{padding:'10px 24px',borderRadius:8,border:'1px solid #e8e8e8',background:'#fff',cursor:'pointer',fontSize:14,color:'#666'}}>取消</button>
              <button onClick={saveDrawing} disabled={loading||!hasDrawing} className="btn-primary" style={{padding:'10px 24px',fontSize:14}}>
                {loading?'分析中...':'保存并分析'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
