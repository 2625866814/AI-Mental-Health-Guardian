const mysql = require('mysql2/promise');
const config = require('../src/config');

async function main() {
  const conn = await mysql.createConnection({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name
  });
  
  const [users] = await conn.execute("SELECT id FROM users WHERE username='测试用户2026'");
  const userId = users[0].id;
  
  await conn.execute('DELETE FROM mental_health_tests WHERE user_id=?', [userId]);
  
  const records = [
    {type:'scl90', score:120, level:'critical', cat:'抑郁高风险', date:'2026-01-20'},
    {type:'offline_activity', score:98, level:'high', cat:'定向越野', date:'2026-02-10', name:'延庆区社区定向越野活动', before:120, after:98, change:'-18.3%'},
    {type:'scl90', score:95, level:'high', cat:'抑郁中风险', date:'2026-02-25'},
    {type:'offline_activity', score:72, level:'medium', cat:'心理讲座', date:'2026-03-15', name:'压力管理与情绪调节讲座', before:95, after:72, change:'-24.2%'},
    {type:'scl90', score:65, level:'medium', cat:'轻度困扰', date:'2026-04-05'},
    {type:'offline_activity', score:48, level:'low', cat:'艺术疗愈', date:'2026-04-20', name:'绘画情绪表达工作坊', before:65, after:48, change:'-26.2%'},
    {type:'scl90', score:42, level:'low', cat:'轻微困扰', date:'2026-05-10'},
    {type:'offline_activity', score:28, level:'low', cat:'团体辅导', date:'2026-05-25', name:'人际关系提升团体辅导', before:42, after:28, change:'-33.3%'},
    {type:'scl90', score:22, level:'low', cat:'状态良好', date:'2026-06-01'}
  ];
  
  for (const r of records) {
    const isActivity = r.type === 'offline_activity';
    const textAnalysis = isActivity ? JSON.stringify({activityType:r.cat,activityName:r.name,activityDate:r.date,notes:'',beforeScore:r.before,afterScore:r.after,scoreChange:r.change}) : JSON.stringify({riskScore:r.score/155});
    const riskResult = JSON.stringify({finalScore:r.score,riskLevel:r.level,riskCategory:r.cat,timestamp:r.date+'T10:00:00'});
    
    await conn.execute(
      'INSERT INTO mental_health_tests (user_id, test_type, scl90_answers, text_analysis, risk_result, completion_time, user_satisfaction, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, r.type, '[]', textAnalysis, riskResult, isActivity?0:400, 4, r.date+' 10:00:00', r.date+' 10:00:00']
    );
    console.log(r.type + ': ' + (isActivity ? r.before+'→'+r.after : r.score));
  }
  
  console.log('\n✅ 数据更新完成！分数范围: 1-155');
  await conn.end();
}
main().catch(console.error);
