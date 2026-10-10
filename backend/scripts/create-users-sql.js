const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const config = require('../src/config');

async function main() {
  const conn = await mysql.createConnection({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name
  });
  
  await conn.execute('DELETE FROM mental_health_tests');
  await conn.execute("DELETE FROM users WHERE username LIKE '高中生%' OR username LIKE '大学生%'");
  console.log('清除完成');
  
  const hash = await bcrypt.hash('123456', 10);
  let userCount = 0;
  let testCount = 0;
  
  for (let i = 1; i <= 300; i++) {
    const isHS = i <= 150;
    const username = isHS ? '高中生' + i : '大学生' + (i - 150);
    
    const [result] = await conn.execute(
      'INSERT INTO users (username, password_hash, email, role, profile, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [username, hash, username + '@example.com', 'user', JSON.stringify({type: isHS ? 'high_school' : 'college'})]
    );
    
    const userId = result.insertId;
    userCount++;
    
    const numTests = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < numTests; j++) {
      const rand = Math.random();
      let riskLevel, baseScore;
      if (rand < 0.07) { riskLevel = 'critical'; baseScore = 3.5 + Math.random() * 1.5; }
      else if (rand < 0.15) { riskLevel = 'high'; baseScore = 2.5 + Math.random() * 1.5; }
      else if (rand < 0.4) { riskLevel = 'medium'; baseScore = 1.5 + Math.random() * 1.5; }
      else { riskLevel = 'low'; baseScore = 1 + Math.random() * 1.5; }
      
      const month = Math.floor(Math.random() * 5) + 1;
      const day = Math.floor(Math.random() * 28) + 1;
      const hour = Math.floor(Math.random() * 14) + 8;
      const min = Math.floor(Math.random() * 60);
      const testDate = '2026-' + String(month).padStart(2,'0') + '-' + String(day).padStart(2,'0') + ' ' + String(hour).padStart(2,'0') + ':' + String(min).padStart(2,'0') + ':00';
      
      const answers = [];
      const qids = Array.from({length:90},(_,i)=>i+1).sort(()=>0.5-Math.random()).slice(0,35);
      qids.forEach(qid => {
        let s = Math.round(baseScore + (Math.random()-0.5));
        s = Math.max(1, Math.min(5, s));
        answers.push({questionId: qid, score: s});
      });
      
      let finalScore, riskCategory;
      if (riskLevel === 'critical') { finalScore = 0.75 + Math.random()*0.2; riskCategory = '抑郁高风险'; }
      else if (riskLevel === 'high') { finalScore = 0.55 + Math.random()*0.2; riskCategory = '抑郁中风险'; }
      else if (riskLevel === 'medium') { finalScore = 0.3 + Math.random()*0.24; riskCategory = '轻度困扰'; }
      else { finalScore = 0.05 + Math.random()*0.24; riskCategory = '轻微困扰'; }
      
      const riskResult = JSON.stringify({finalScore, riskLevel, riskCategory, timestamp: new Date().toISOString()});
      const scl90 = JSON.stringify(answers);
      const textAnalysis = JSON.stringify({riskScore: finalScore, sentiment: riskLevel === 'low' ? 'neutral' : 'negative', riskLevel});
      
      await conn.execute(
        'INSERT INTO mental_health_tests (user_id, test_type, scl90_answers, text_analysis, risk_result, completion_time, user_satisfaction, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, 'scl90', scl90, textAnalysis, riskResult, Math.floor(Math.random()*300)+300, Math.floor(Math.random()*3)+2, testDate, testDate]
      );
      testCount++;
    }
    
    if (i % 50 === 0) console.log('进度: ' + i + '/300');
  }
  
  console.log('完成! 用户: ' + userCount + ', 测试: ' + testCount);
  await conn.end();
}

main().catch(console.error);
