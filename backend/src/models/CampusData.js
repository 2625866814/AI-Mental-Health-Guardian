const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 学生基础档案
const Student = sequelize.define('Student', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  studentId: { type: DataTypes.STRING(20), unique: true, allowNull: false },
  name: { type: DataTypes.STRING(50), allowNull: false },
  gender: { type: DataTypes.STRING(10) },
  birthDate: { type: DataTypes.DATEONLY },
  idCard: { type: DataTypes.STRING(18) },
  phone: { type: DataTypes.STRING(20) },
  email: { type: DataTypes.STRING(100) },
  college: { type: DataTypes.STRING(100) },
  department: { type: DataTypes.STRING(100) },
  major: { type: DataTypes.STRING(100) },
  className: { type: DataTypes.STRING(50) },
  grade: { type: DataTypes.STRING(20) },
  enrollmentDate: { type: DataTypes.DATEONLY },
  graduationDate: { type: DataTypes.DATEONLY },
  dormitory: { type: DataTypes.STRING(50) },
  roomNumber: { type: DataTypes.STRING(20) },
  hometown: { type: DataTypes.STRING(100) },
  ethnicity: { type: DataTypes.STRING(20) },
  politicalStatus: { type: DataTypes.STRING(20) },
  familyIncome: { type: DataTypes.STRING(20) },
  emergencyContact: { type: DataTypes.STRING(50) },
  emergencyPhone: { type: DataTypes.STRING(20) },
  status: { type: DataTypes.STRING(20), defaultValue: 'active' },
  tags: { type: DataTypes.JSON, defaultValue: [] },
  notes: { type: DataTypes.TEXT }
}, { tableName: 'students' });

// 学业数据
const AcademicRecord = sequelize.define('AcademicRecord', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  studentId: { type: DataTypes.STRING(20), allowNull: false },
  semester: { type: DataTypes.STRING(20) },
  courseName: { type: DataTypes.STRING(100) },
  courseCode: { type: DataTypes.STRING(30) },
  courseType: { type: DataTypes.STRING(20) },
  credits: { type: DataTypes.FLOAT },
  score: { type: DataTypes.FLOAT },
  gradePoint: { type: DataTypes.FLOAT },
  rank: { type: DataTypes.STRING(20) },
  gpa: { type: DataTypes.FLOAT },
  totalCredits: { type: DataTypes.FLOAT },
  failedCourses: { type: DataTypes.INTEGER, defaultValue: 0 },
  warningLevel: { type: DataTypes.STRING(20) },
  notes: { type: DataTypes.TEXT }
}, { tableName: 'academic_records' });

// 行为数据
const BehaviorRecord = sequelize.define('BehaviorRecord', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  studentId: { type: DataTypes.STRING(20), allowNull: false },
  recordDate: { type: DataTypes.DATEONLY },
  recordType: { type: DataTypes.STRING(30) },
  amount: { type: DataTypes.FLOAT },
  location: { type: DataTypes.STRING(100) },
  duration: { type: DataTypes.INTEGER },
  frequency: { type: DataTypes.INTEGER },
  details: { type: DataTypes.JSON, defaultValue: {} },
  notes: { type: DataTypes.TEXT }
}, { tableName: 'behavior_records' });

// 心理数据
const PsychologicalRecord = sequelize.define('PsychologicalRecord', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  studentId: { type: DataTypes.STRING(20), allowNull: false },
  recordDate: { type: DataTypes.DATEONLY },
  recordType: { type: DataTypes.STRING(30) },
  testType: { type: DataTypes.STRING(30) },
  score: { type: DataTypes.FLOAT },
  riskLevel: { type: DataTypes.STRING(20) },
  counselor: { type: DataTypes.STRING(50) },
  consultationCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  diagnosis: { type: DataTypes.TEXT },
  intervention: { type: DataTypes.TEXT },
  emotionState: { type: DataTypes.STRING(20) },
  followUpDate: { type: DataTypes.DATEONLY },
  details: { type: DataTypes.JSON, defaultValue: {} },
  notes: { type: DataTypes.TEXT }
}, { tableName: 'psychological_records' });

// 生活数据
const LifeRecord = sequelize.define('LifeRecord', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  studentId: { type: DataTypes.STRING(20), allowNull: false },
  recordDate: { type: DataTypes.DATEONLY },
  recordType: { type: DataTypes.STRING(30) },
  category: { type: DataTypes.STRING(30) },
  title: { type: DataTypes.STRING(100) },
  description: { type: DataTypes.TEXT },
  level: { type: DataTypes.STRING(20) },
  awardType: { type: DataTypes.STRING(30) },
  organization: { type: DataTypes.STRING(100) },
  details: { type: DataTypes.JSON, defaultValue: {} },
  notes: { type: DataTypes.TEXT }
}, { tableName: 'life_records' });

// 导入记录
const ImportLog = sequelize.define('ImportLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  fileName: { type: DataTypes.STRING(255) },
  fileType: { type: DataTypes.STRING(20) },
  dataType: { type: DataTypes.STRING(30) },
  totalRows: { type: DataTypes.INTEGER },
  successRows: { type: DataTypes.INTEGER },
  failedRows: { type: DataTypes.INTEGER },
  errors: { type: DataTypes.JSON, defaultValue: [] },
  importedBy: { type: DataTypes.STRING(50) },
  status: { type: DataTypes.STRING(20), defaultValue: 'completed' }
}, { tableName: 'import_logs' });

module.exports = {
  Student,
  AcademicRecord,
  BehaviorRecord,
  PsychologicalRecord,
  LifeRecord,
  ImportLog
};
