const User = require('./User');
const MentalHealthTest = require('./MentalHealthTest');
const AstrologyAnalysis = require('./AstrologyAnalysis');
const Artwork = require('./Artwork');
const DiaryEntry = require('./DiaryEntry');
const ChatHistory = require('./ChatHistory');
const PersonalitySession = require('./PersonalitySession');
const StudentProfile = require('./StudentProfile');
const { BehaviorData, PerceptionResult } = require('./Perception');

// 定义关联关系
User.hasMany(MentalHealthTest, { foreignKey: 'userId', as: 'mentalHealthTests' });
MentalHealthTest.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(AstrologyAnalysis, { foreignKey: 'userId', as: 'astrologyAnalyses' });
AstrologyAnalysis.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Artwork, { foreignKey: 'userId', as: 'artworks' });
Artwork.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(DiaryEntry, { foreignKey: 'userId', as: 'diaryEntries' });
DiaryEntry.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(ChatHistory, { foreignKey: 'userId', as: 'chatHistories' });
ChatHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(PersonalitySession, { foreignKey: 'userId', as: 'personalitySessions' });
PersonalitySession.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(StudentProfile, { foreignKey: 'userId', as: 'studentProfile' });
StudentProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(BehaviorData, { foreignKey: 'userId', as: 'behaviorData' });
BehaviorData.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(PerceptionResult, { foreignKey: 'userId', as: 'perceptionResults' });
PerceptionResult.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  User,
  MentalHealthTest,
  AstrologyAnalysis,
  Artwork,
  DiaryEntry,
  ChatHistory,
  PersonalitySession,
  StudentProfile,
  BehaviorData,
  PerceptionResult
};
