import { useState, useEffect, useRef } from 'react';

export default function Avatar({ isSpeaking, emotion = 'neutral', imageUrl }) {
  const [blinkState, setBlinkState] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);

  // 眨眼动画
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinkState(true);
      setTimeout(() => setBlinkState(false), 150);
    }, 3000 + Math.random() * 2000);
    
    return () => clearInterval(blinkInterval);
  }, []);

  // 说话嘴巴动画
  useEffect(() => {
    if (isSpeaking) {
      const mouthInterval = setInterval(() => {
        setMouthOpen(prev => !prev);
      }, 200);
      return () => clearInterval(mouthInterval);
    } else {
      setMouthOpen(false);
    }
  }, [isSpeaking]);

  // 如果有自定义图片，使用图片
  if (imageUrl) {
    return (
      <div style={{
        width: 200, height: 200, borderRadius: '50%', overflow: 'hidden',
        border: '4px solid #667eea', boxShadow: '0 8px 32px rgba(102,126,234,0.3)'
      }}>
        <img src={imageUrl} alt="虚拟形象" style={{width: '100%', height: '100%', objectFit: 'cover'}}/>
      </div>
    );
  }

  // 默认SVG虚拟形象
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" style={{filter: 'drop-shadow(0 8px 32px rgba(102,126,234,0.3))'}}>
      {/* 背景 */}
      <circle cx="100" cy="100" r="95" fill="#667eea"/>
      <circle cx="100" cy="100" r="90" fill="#764ba2"/>
      
      {/* 脸 */}
      <ellipse cx="100" cy="110" rx="55" ry="60" fill="#FFD5B8"/>
      
      {/* 头发 */}
      <ellipse cx="100" cy="65" rx="60" ry="35" fill="#4A3728"/>
      <ellipse cx="60" cy="80" rx="20" ry="25" fill="#4A3728"/>
      <ellipse cx="140" cy="80" rx="20" ry="25" fill="#4A3728"/>
      
      {/* 眼睛 */}
      <ellipse cx="80" cy="105" rx="8" ry={blinkState ? 1 : 8} fill="white"/>
      <ellipse cx="120" cy="105" rx="8" ry={blinkState ? 1 : 8} fill="white"/>
      <circle cx="80" cy="105" r="4" fill="#333"/>
      <circle cx="120" cy="105" r="4" fill="#333"/>
      
      {/* 腮红 */}
      <ellipse cx="70" cy="120" rx="10" ry="6" fill="rgba(255,100,100,0.3)"/>
      <ellipse cx="130" cy="120" rx="10" ry="6" fill="rgba(255,100,100,0.3)"/>
      
      {/* 嘴巴 */}
      {isSpeaking ? (
        <ellipse cx="100" cy="130" rx={mouthOpen ? 8 : 12} ry={mouthOpen ? 10 : 3} fill="#E8625C"/>
      ) : (
        <path d="M 85 130 Q 100 140 115 130" stroke="#E8625C" strokeWidth="3" fill="none"/>
      )}
      
      {/* 表情 */}
      {emotion === 'happy' && (
        <>
          <path d="M 70 100 Q 80 90 90 100" stroke="#333" strokeWidth="2" fill="none"/>
          <path d="M 110 100 Q 120 90 130 100" stroke="#333" strokeWidth="2" fill="none"/>
        </>
      )}
      
      {emotion === 'sad' && (
        <>
          <path d="M 70 100 Q 80 110 90 100" stroke="#333" strokeWidth="2" fill="none"/>
          <path d="M 110 100 Q 120 110 130 100" stroke="#333" strokeWidth="2" fill="none"/>
        </>
      )}
    </svg>
  );
}
