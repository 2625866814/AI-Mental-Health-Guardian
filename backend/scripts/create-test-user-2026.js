const mysql = require('mysql2/promise');
const config = require('../src/config');

async function main() {
  const conn = await mysql.createConnection({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name
  });

  // 获取已存在的用户ID
  const [users] = await conn.execute("SELECT id FROM users WHERE username='测试用户2026'");
  const userId = users[0].id;
  console.log('用户ID:', userId);

  // 清除旧记录
  await conn.execute("DELETE FROM mental_health_tests WHERE user_id=?", [userId]);
  console.log('清除旧记录完成');

  // 添加初始测评（高风险）
  await conn.execute(
    "INSERT INTO mental_health_tests (user_id, test_type, scl90_answers, text_analysis, risk_result, completion_time, user_satisfaction, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [userId, 'scl90', '[]', JSON.stringify({riskScore:0.75}), JSON.stringify({finalScore:0.75,riskLevel:'critical',riskCategory:'抑郁高风险',timestamp:'2026-01-20T10:00:00'}), 450, 3, '2026-01-20 10:00:00', '2026-01-20 10:00:00']
  );
  console.log('记录1: 初始测评 - 高风险(0.75)');

  // 活动1：定向越野
  await conn.execute(
    "INSERT INTO mental_health_tests (user_id, test_type, scl90_answers, text_analysis, risk_result, completion_time, user_satisfaction, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [userId, 'offline_activity', '[]', 
      JSON.stringify({activityType:'定向越野',activityName:'延庆区社区定向越野活动',activityDate:'2026-02-10',notes:'参与2小时户外定向越野，完成6个心理站点',beforeScore:0.75,afterScore:0.62,scoreChange:'-17.3'}), 
      JSON.stringify({finalScore:0.62,riskLevel:'high',riskCategory:'线下活动评估',timestamp:'2026-02-10T14:00:00'}), 0, 5, '2026-02-10 14:00:00', '2026-02-10 14:00:00']
  );
  console.log('记录2: 定向越野 - 0.75→0.62');

  // 测评2
  await conn.execute(
    "INSERT INTO mental_health_tests (user_id, test_type, scl90_answers, text_analysis, risk_result, completion_time, user_satisfaction, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [userId, 'scl90', '[]', JSON.stringify({riskScore:0.58}), JSON.stringify({finalScore:0.58,riskLevel:'high',riskCategory:'抑郁中风险',timestamp:'2026-02-25T10:00:00'}), 420, 3, '2026-02-25 10:00:00', '2026-02-25 10:00:00']
  );
  console.log('记录3: 测评 - 中高风险(0.58)');

  // 活动2：心理讲座
  await conn.execute(
    "INSERT INTO mental_health_tests (user_id, test_type, scl90_answers, text_analysis, risk_result, completion_time, user_satisfaction, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [userId, 'offline_activity', '[]', 
      JSON.stringify({activityType:'心理讲座',activityName:'压力管理与情绪调节讲座',activityDate:'2026-03-15',notes:'参加2小时心理讲座，学习正念呼吸和情绪调节技巧',beforeScore:0.58,afterScore:0.42,scoreChange:'-27.6'}), 
      JSON.stringify({finalScore:0.42,riskLevel:'medium',riskCategory:'线下活动评估',timestamp:'2026-03-15T16:00:00'}), 0, 5, '2026-03-15 16:00:00', '2026-03-15 16:00:00']
  );
  console.log('记录4: 心理讲座 - 0.58→0.42');

  // 测评3
  await conn.execute(
    "INSERT INTO mental_health_tests (user_id, test_type, scl90_answers, text_analysis, risk_result, completion_time, user_satisfaction, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [userId, 'scl90', '[]', JSON.stringify({riskScore:0.38}), JSON.stringify({finalScore:0.38,riskLevel:'medium',riskCategory:'轻度困扰',timestamp:'2026-04-05T10:00:00'}), 400, 4, '2026-04-05 10:00:00', '2026-04-05 10:00:00']
  );
  console.log('记录5: 测评 - 中风险(0.38)');

  // 活动3：艺术疗愈
  await conn.execute(
    "INSERT INTO mental_health_tests (user_id, test_type, scl90_answers, text_analysis, risk_result, completion_time, user_satisfaction, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [userId, 'offline_activity', '[]', 
      JSON.stringify({activityType:'艺术疗愈',activityName:'绘画情绪表达工作坊',activityDate:'2026-04-20',notes:'参与3小时绘画创作，通过色彩表达内心感受',beforeScore:0.38,afterScore:0.28,scoreChange:'-26.3'}), 
      JSON.stringify({finalScore:0.28,riskLevel:'low',riskCategory:'线下活动评估',timestamp:'2026-04-20T15:00:00'}), 0, 5, '2026-04-20 15:00:00', '2026-04-20 15:00:00']
  );
  console.log('记录6: 艺术疗愈 - 0.38→0.28');

  // 测评4
  await conn.execute(
    "INSERT INTO mental_health_tests (user_id, test_type, scl90_answers, text_analysis, risk_result, completion_time, user_satisfaction, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [userId, 'scl90', '[]', JSON.stringify({riskScore:0.22}), JSON.stringify({finalScore:0.22,riskLevel:'low',riskCategory:'轻微困扰',timestamp:'2026-05-10T10:00:00'}), 380, 5, '2026-05-10 10:00:00', '2026-05-10 10:00:00']
  );
  console.log('记录7: 测评 - 低风险(0.22)');

  // 活动4：团体辅导
  await conn.execute(
    "INSERT INTO mental_health_tests (user_id, test_type, scl90_answers, text_analysis, risk_result, completion_time, user_satisfaction, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [userId, 'offline_activity', '[]', 
      JSON.stringify({activityType:'团体辅导',activityName:'人际关系提升团体辅导',activityDate:'2026-05-25',notes:'参加4次团体辅导课程，社交能力明显提升',beforeScore:0.22,afterScore:0.15,scoreChange:'-31.8'}), 
      JSON.stringify({finalScore:0.15,riskLevel:'low',riskCategory:'线下活动评估',timestamp:'2026-05-25T17:00:00'}), 0, 5, '2026-05-25 17:00:00', '2026-05-25 17:00:00']
  );
  console.log('记录8: 团体辅导 - 0.22→0.15');

  // 测评5
  await conn.execute(
    "INSERT INTO mental_health_tests (user_id, test_type, scl90_answers, text_analysis, risk_result, completion_time, user_satisfaction, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [userId, 'scl90', '[]', JSON.stringify({riskScore:0.12}), JSON.stringify({finalScore:0.12,riskLevel:'low',riskCategory:'状态良好',timestamp:'2026-06-01T10:00:00'}), 350, 5, '2026-06-01 10:00:00', '2026-06-01 10:00:00']
  );
  console.log('记录9: 测评 - 状态良好(0.12)');

  console.log('\n✅ 测试用户2026创建完成！');
  console.log('风险变化: 0.75 → 0.62 → 0.58 → 0.42 → 0.38 → 0.28 → 0.22 → 0.15 → 0.12');
  console.log('总下降幅度: ' + ((0.12-0.75)/0.75*100).toFixed(1) + '%');

  await conn.end();
}

main().catch(console.error);
