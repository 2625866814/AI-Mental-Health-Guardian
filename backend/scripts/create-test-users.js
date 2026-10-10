const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

// 数据库连接
const sequelize = new Sequelize('ai_mental_health', 'root', 'ocean20040920', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
  logging: false
});

// 用户模型
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false },
  email: { type: DataTypes.STRING(100) },
  role: { type: DataTypes.ENUM('user', 'admin'), defaultValue: 'user' },
  profile: { type: DataTypes.JSON, defaultValue: {} }
}, { tableName: 'users', timestamps: true });

// 测试记录模型
const MentalHealthTest = sequelize.define('MentalHealthTest', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  testType: { type: DataTypes.STRING(50), defaultValue: 'scl90' },
  scl90Answers: { type: DataTypes.JSON, defaultValue: [] },
  textAnalysis: { type: DataTypes.JSON, defaultValue: {} },
  riskResult: { type: DataTypes.JSON, defaultValue: {} },
  completionTime: { type: DataTypes.INTEGER, defaultValue: 0 },
  userSatisfaction: { type: DataTypes.INTEGER, defaultValue: 3 }
}, { tableName: 'mental_health_tests', timestamps: true });

// 随机数生成函数
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

// 生成随机日期（2026年1-5月）
function randomDate() {
  const month = randomInt(1, 5);
  const day = randomInt(1, 28);
  const hour = randomInt(8, 22);
  const minute = randomInt(0, 59);
  return new Date(2026, month - 1, day, hour, minute, 0);
}

// 生成SCL-90答案
function generateSCL90Answers(riskLevel) {
  const answers = [];
  const questionIds = Array.from({ length: 90 }, (_, i) => i + 1);
  
  // 根据风险等级调整分数分布
  let baseScore;
  switch (riskLevel) {
    case 'critical': baseScore = randomFloat(3.5, 5); break;
    case 'high': baseScore = randomFloat(2.5, 4); break;
    case 'medium': baseScore = randomFloat(1.5, 3); break;
    default: baseScore = randomFloat(1, 2.5); break;
  }
  
  // 随机选择35个问题
  const selected = questionIds.sort(() => 0.5 - Math.random()).slice(0, 35);
  
  selected.forEach(id => {
    const variation = randomFloat(-0.5, 0.5);
    let score = Math.round(baseScore + variation);
    score = Math.max(1, Math.min(5, score));
    answers.push({ questionId: id, score });
  });
  
  return answers;
}

// 生成风险评估结果
function generateRiskResult(riskLevel, answers) {
  const avgScore = answers.reduce((sum, a) => sum + a.score, 0) / answers.length;
  const normalizedScore = (avgScore - 1) / 4;
  
  let finalScore, riskCategory, recommendations;
  
  switch (riskLevel) {
    case 'critical':
      finalScore = randomFloat(0.75, 0.95);
      riskCategory = '抑郁高风险';
      recommendations = [
        { priority: 'high', action: '立即寻求专业帮助', description: '您的综合风险评分较高，建议立即联系精神科医生或心理咨询师进行专业评估。' },
        { priority: 'high', action: '联系危机干预热线', description: '如感到极度痛苦或有自杀想法，请立即拨打心理危机干预热线：400-161-9995' }
      ];
      break;
    case 'high':
      finalScore = randomFloat(0.55, 0.74);
      riskCategory = '抑郁中风险';
      recommendations = [
        { priority: 'medium', action: '预约心理咨询', description: '建议在1-2周内预约专业心理咨询师进行评估和干预。' },
        { priority: 'medium', action: '定期情绪监测', description: '建议每天记录情绪变化，观察症状发展趋势。' }
      ];
      break;
    case 'medium':
      finalScore = randomFloat(0.3, 0.54);
      riskCategory = '轻度困扰';
      recommendations = [
        { priority: 'low', action: '生活方式调整', description: '建议调整作息规律，增加运动，保持社交联系。' },
        { priority: 'low', action: '自我关怀练习', description: '尝试正念冥想、深呼吸等放松技巧。' }
      ];
      break;
    default:
      finalScore = randomFloat(0.05, 0.29);
      riskCategory = '轻微困扰';
      recommendations = [
        { priority: 'low', action: '保持良好状态', description: '您的心理健康状况良好，请继续保持积极的生活方式。' }
      ];
  }
  
  return {
    finalScore,
    riskLevel,
    riskCategory,
    recommendations,
    timestamp: new Date().toISOString()
  };
}

// 主函数
async function main() {
  try {
    // 连接数据库
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 同步模型
    await sequelize.sync();
    console.log('✅ 模型同步完成');
    
    // 清除旧的虚拟用户（保留admin）
    await MentalHealthTest.destroy({ where: {} });
    await User.destroy({ where: { username: { [require('sequelize').Op.like]: '高中生%' } } });
    await User.destroy({ where: { username: { [require('sequelize').Op.like]: '大学生%' } } });
    console.log('✅ 清除旧数据完成');
    
    const passwordHash = await bcrypt.hash('123456', 10);
    const users = [];
    const tests = [];
    
    // 创建300个虚拟用户
    console.log('开始创建虚拟用户...');
    
    for (let i = 1; i <= 300; i++) {
      const isHighSchool = i <= 150;
      const username = isHighSchool ? `高中生${i}` : `大学生${i - 150}`;
      
      users.push({
        username,
        passwordHash,
        email: `${username}@example.com`,
        role: 'user',
        profile: { type: isHighSchool ? 'high_school' : 'college' }
      });
      
      if (i % 50 === 0) {
        console.log(`  已创建 ${i}/300 个用户`);
      }
    }
    
    // 批量插入用户
    const createdUsers = await User.bulkCreate(users);
    console.log(`✅ 成功创建 ${createdUsers.length} 个用户`);
    
    // 生成测试数据
    console.log('开始生成测试数据...');
    
    // 定义风险等级分布（40余个高危）
    const riskDistribution = {
      critical: 20,   // 高危
      high: 25,       // 中高风险
      medium: 80,     // 中风险
      low: 175        // 低风险
    };
    
    let testCount = 0;
    const usedDates = new Set();
    
    // 为每个用户创建1-3条测试记录
    for (const user of createdUsers) {
      const numTests = randomInt(1, 3);
      
      for (let j = 0; j < numTests; j++) {
        // 确定风险等级
        let riskLevel;
        if (riskDistribution.critical > 0 && Math.random() < 0.07) {
          riskLevel = 'critical';
          riskDistribution.critical--;
        } else if (riskDistribution.high > 0 && Math.random() < 0.08) {
          riskLevel = 'high';
          riskDistribution.high--;
        } else if (riskDistribution.medium > 0 && Math.random() < 0.27) {
          riskLevel = 'medium';
          riskDistribution.medium--;
        } else {
          riskLevel = 'low';
          riskDistribution.low--;
        }
        
        // 生成唯一的时间
        let testDate;
        do {
          testDate = randomDate();
        } while (usedDates.has(testDate.getTime()));
        usedDates.add(testDate.getTime());
        
        const answers = generateSCL90Answers(riskLevel);
        const riskResult = generateRiskResult(riskLevel, answers);
        
        tests.push({
          userId: user.id,
          testType: 'scl90',
          scl90Answers: answers,
          textAnalysis: {
            riskScore: riskResult.finalScore,
            sentiment: riskLevel === 'low' ? 'neutral' : 'negative',
            riskLevel
          },
          riskResult,
          completionTime: randomInt(300, 600),
          userSatisfaction: randomInt(2, 5),
          createdAt: testDate,
          updatedAt: testDate
        });
        
        testCount++;
      }
    }
    
    // 批量插入测试记录
    await MentalHealthTest.bulkCreate(tests);
    console.log(`✅ 成功创建 ${testCount} 条测试记录`);
    
    // 统计
    const criticalCount = tests.filter(t => t.riskResult.riskLevel === 'critical').length;
    const highCount = tests.filter(t => t.riskResult.riskLevel === 'high').length;
    const mediumCount = tests.filter(t => t.riskResult.riskLevel === 'medium').length;
    const lowCount = tests.filter(t => t.riskResult.riskLevel === 'low').length;
    
    console.log('\n📊 统计信息：');
    console.log(`  用户总数：${createdUsers.length}`);
    console.log(`  高中生：${createdUsers.filter(u => u.username.startsWith('高中生')).length}`);
    console.log(`  大学生：${createdUsers.filter(u => u.username.startsWith('大学生')).length}`);
    console.log(`  测试记录总数：${testCount}`);
    console.log(`  高危记录：${criticalCount}`);
    console.log(`  中高风险：${highCount}`);
    console.log(`  中风险：${mediumCount}`);
    console.log(`  低风险：${lowCount}`);
    
    console.log('\n✅ 所有虚拟数据创建完成！');
    
  } catch (error) {
    console.error('❌ 错误：', error);
  } finally {
    await sequelize.close();
  }
}

main();
