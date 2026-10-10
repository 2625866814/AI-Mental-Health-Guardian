const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { User } = require('../models');
const { Student, AcademicRecord, BehaviorRecord, PsychologicalRecord, LifeRecord, ImportLog } = require('../models/CampusData');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/campus');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `import_${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// 自动创建学生账号
async function createStudentAccount(studentId, name) {
  try {
    const existing = await User.findOne({ where: { username: studentId } });
    if (existing) return existing;
    
    const user = await User.create({
      username: studentId,
      passwordHash: process.env.INITIAL_STUDENT_PASSWORD || '123456',
      email: `${studentId}@school.edu.cn`,
      role: 'user'
    });
    return user;
  } catch (e) {
    console.error('创建账号失败:', e.message);
    return null;
  }
}

// ========== 学生档案 API ==========

// 获取学生列表
router.get('/students', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, college, major, grade, keyword, status } = req.query;
    const { Op } = require('sequelize');
    const where = {};
    if (college) where.college = college;
    if (major) where.major = major;
    if (grade) where.grade = grade;
    if (status) where.status = status;
    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { studentId: { [Op.like]: `%${keyword}%` } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Student.findAndCountAll({
      where, offset, limit: parseInt(limit),
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: rows, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (e) {
    console.error('获取学生列表失败:', e);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取单个学生详情（含所有维度数据）
router.get('/students/:id', authenticateToken, async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ error: '学生不存在' });

    const [academic, behavior, psychological, life] = await Promise.all([
      AcademicRecord.findAll({ where: { studentId: student.studentId }, order: [['semester', 'DESC']], limit: 50 }),
      BehaviorRecord.findAll({ where: { studentId: student.studentId }, order: [['recordDate', 'DESC']], limit: 50 }),
      PsychologicalRecord.findAll({ where: { studentId: student.studentId }, order: [['recordDate', 'DESC']], limit: 20 }),
      LifeRecord.findAll({ where: { studentId: student.studentId }, order: [['recordDate', 'DESC']], limit: 20 })
    ]);

    res.json({ success: true, student, academic, behavior, psychological, life });
  } catch (e) {
    console.error('获取学生详情失败:', e);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 手动添加学生（自动创建账号）
router.post('/students', authenticateToken, async (req, res) => {
  try {
    const { studentId, name } = req.body;
    if (!studentId || !name) {
      return res.status(400).json({ error: '学号和姓名必填' });
    }

    // 检查学号是否已存在
    const existing = await Student.findOne({ where: { studentId } });
    if (existing) {
      return res.status(400).json({ error: '学号已存在' });
    }

    const student = await Student.create(req.body);
    
    // 自动创建用户账号
    const user = await createStudentAccount(studentId, name);
    
    res.json({ 
      success: true, 
      student,
      account: user ? { username: studentId, password: '123456' } : null,
      message: user ? `学生添加成功，已自动创建账号：${studentId}` : '学生添加成功，账号创建失败'
    });
  } catch (e) {
    console.error('添加学生失败:', e);
    res.status(500).json({ error: '添加失败: ' + e.message });
  }
});

// 批量添加学生（自动创建账号）
router.post('/students/batch', authenticateToken, async (req, res) => {
  try {
    const { students } = req.body;
    if (!students || !Array.isArray(students)) {
      return res.status(400).json({ error: '请提供学生数组' });
    }

    let successCount = 0;
    let accountCount = 0;
    const errors = [];

    for (const s of students) {
      try {
        if (!s.studentId || !s.name) {
          errors.push({ studentId: s.studentId || '未知', error: '缺少学号或姓名' });
          continue;
        }

        const existing = await Student.findOne({ where: { studentId: s.studentId } });
        if (existing) {
          await existing.update(s);
        } else {
          await Student.create(s);
        }
        
        // 自动创建账号
        const user = await createStudentAccount(s.studentId, s.name);
        if (user) accountCount++;
        
        successCount++;
      } catch (e) {
        errors.push({ studentId: s.studentId, error: e.message });
      }
    }

    res.json({ 
      success: true, 
      count: successCount,
      accountsCreated: accountCount,
      errors: errors.slice(0, 20)
    });
  } catch (e) {
    console.error('批量添加失败:', e);
    res.status(500).json({ error: '批量添加失败: ' + e.message });
  }
});

// 更新学生信息
router.put('/students/:id', authenticateToken, async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ error: '学生不存在' });
    await student.update(req.body);
    res.json({ success: true, student });
  } catch (e) {
    console.error('更新学生失败:', e);
    res.status(500).json({ error: '更新失败' });
  }
});

// 删除学生
router.delete('/students/:id', authenticateToken, async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ error: '学生不存在' });
    await student.destroy();
    res.json({ success: true });
  } catch (e) {
    console.error('删除学生失败:', e);
    res.status(500).json({ error: '删除失败' });
  }
});

// ========== 学业数据 API ==========

router.get('/academic/:studentId', authenticateToken, async (req, res) => {
  try {
    const records = await AcademicRecord.findAll({
      where: { studentId: req.params.studentId },
      order: [['semester', 'DESC']]
    });
    res.json({ success: true, records });
  } catch (e) {
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/academic', authenticateToken, async (req, res) => {
  try {
    const record = await AcademicRecord.create(req.body);
    res.json({ success: true, record });
  } catch (e) {
    res.status(500).json({ error: '添加失败: ' + e.message });
  }
});

router.post('/academic/batch', authenticateToken, async (req, res) => {
  try {
    const { records } = req.body;
    const results = await AcademicRecord.bulkCreate(records, { validate: true });
    res.json({ success: true, count: results.length });
  } catch (e) {
    res.status(500).json({ error: '批量添加失败: ' + e.message });
  }
});

// ========== 行为数据 API ==========

router.get('/behavior/:studentId', authenticateToken, async (req, res) => {
  try {
    const records = await BehaviorRecord.findAll({
      where: { studentId: req.params.studentId },
      order: [['recordDate', 'DESC']]
    });
    res.json({ success: true, records });
  } catch (e) {
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/behavior', authenticateToken, async (req, res) => {
  try {
    const record = await BehaviorRecord.create(req.body);
    res.json({ success: true, record });
  } catch (e) {
    res.status(500).json({ error: '添加失败: ' + e.message });
  }
});

router.post('/behavior/batch', authenticateToken, async (req, res) => {
  try {
    const { records } = req.body;
    const results = await BehaviorRecord.bulkCreate(records, { validate: true });
    res.json({ success: true, count: results.length });
  } catch (e) {
    res.status(500).json({ error: '批量添加失败: ' + e.message });
  }
});

// ========== 心理数据 API ==========

router.get('/psychological/:studentId', authenticateToken, async (req, res) => {
  try {
    const records = await PsychologicalRecord.findAll({
      where: { studentId: req.params.studentId },
      order: [['recordDate', 'DESC']]
    });
    res.json({ success: true, records });
  } catch (e) {
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/psychological', authenticateToken, async (req, res) => {
  try {
    const record = await PsychologicalRecord.create(req.body);
    res.json({ success: true, record });
  } catch (e) {
    res.status(500).json({ error: '添加失败: ' + e.message });
  }
});

router.post('/psychological/batch', authenticateToken, async (req, res) => {
  try {
    const { records } = req.body;
    const results = await PsychologicalRecord.bulkCreate(records, { validate: true });
    res.json({ success: true, count: results.length });
  } catch (e) {
    res.status(500).json({ error: '批量添加失败: ' + e.message });
  }
});

// ========== 生活数据 API ==========

router.get('/life/:studentId', authenticateToken, async (req, res) => {
  try {
    const records = await LifeRecord.findAll({
      where: { studentId: req.params.studentId },
      order: [['recordDate', 'DESC']]
    });
    res.json({ success: true, records });
  } catch (e) {
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/life', authenticateToken, async (req, res) => {
  try {
    const record = await LifeRecord.create(req.body);
    res.json({ success: true, record });
  } catch (e) {
    res.status(500).json({ error: '添加失败: ' + e.message });
  }
});

router.post('/life/batch', authenticateToken, async (req, res) => {
  try {
    const { records } = req.body;
    const results = await LifeRecord.bulkCreate(records, { validate: true });
    res.json({ success: true, count: results.length });
  } catch (e) {
    res.status(500).json({ error: '批量添加失败: ' + e.message });
  }
});

// ========== 文件导入 API ==========

router.post('/import/:dataType', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '请上传文件' });

    const { dataType } = req.params;
    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();

    let data = [];
    if (ext === '.json') {
      const content = fs.readFileSync(filePath, 'utf8');
      data = JSON.parse(content);
      if (!Array.isArray(data)) data = [data];
    } else if (ext === '.csv' || ext === '.xlsx' || ext === '.xls') {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } else {
      return res.status(400).json({ error: '不支持的文件格式，请使用 CSV/Excel/JSON' });
    }

    if (data.length === 0) return res.status(400).json({ error: '文件中没有数据' });

    const fieldMap = getFieldMap(dataType);
    if (!fieldMap) return res.status(400).json({ error: '不支持的数据类型' });

    const errors = [];
    const validData = [];

    data.forEach((row, index) => {
      try {
        const mapped = mapFields(row, fieldMap);
        if (!mapped.studentId) {
          errors.push({ row: index + 1, error: '缺少学号' });
          return;
        }
        validData.push(mapped);
      } catch (e) {
        errors.push({ row: index + 1, error: e.message });
      }
    });

    let successCount = 0;
    let accountCount = 0;
    const Model = getModelByType(dataType);

    if (Model) {
      for (const item of validData) {
        try {
          await Model.create(item);
          successCount++;
          
          // 如果是学生数据，自动创建账号
          if (dataType === 'student' && item.studentId && item.name) {
            const user = await createStudentAccount(item.studentId, item.name);
            if (user) accountCount++;
          }
        } catch (e) {
          errors.push({ studentId: item.studentId, error: e.message });
        }
      }
    }

    await ImportLog.create({
      fileName: req.file.originalname,
      fileType: ext,
      dataType,
      totalRows: data.length,
      successRows: successCount,
      failedRows: errors.length,
      errors: errors.slice(0, 100),
      importedBy: req.user.username
    });

    fs.unlinkSync(filePath);

    res.json({
      success: true,
      total: data.length,
      imported: successCount,
      failed: errors.length,
      accountsCreated: accountCount,
      errors: errors.slice(0, 20)
    });
  } catch (e) {
    console.error('导入失败:', e);
    res.status(500).json({ error: '导入失败: ' + e.message });
  }
});

// 获取导入历史
router.get('/import-history', authenticateToken, async (req, res) => {
  try {
    const logs = await ImportLog.findAll({ order: [['createdAt', 'DESC']], limit: 20 });
    res.json({ success: true, logs });
  } catch (e) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取导入模板
router.get('/template/:dataType', authenticateToken, (req, res) => {
  try {
    const { dataType } = req.params;
    const template = getTemplate(dataType);
    if (!template) return res.status(400).json({ error: '不支持的数据类型' });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([template]);
    XLSX.utils.book_append_sheet(wb, ws, 'Template');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${dataType}_template.xlsx`);
    res.send(buffer);
  } catch (e) {
    res.status(500).json({ error: '生成模板失败' });
  }
});

// ========== 统计 API ==========

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const [totalStudents, academicCount, behaviorCount, psychologicalCount, lifeCount] = await Promise.all([
      Student.count(),
      AcademicRecord.count(),
      BehaviorRecord.count(),
      PsychologicalRecord.count(),
      LifeRecord.count()
    ]);

    const riskStudents = await PsychologicalRecord.count({
      where: { riskLevel: ['high', 'critical'] }
    });

    res.json({
      success: true,
      stats: {
        totalStudents,
        academicCount,
        behaviorCount,
        psychologicalCount,
        lifeCount,
        riskStudents
      }
    });
  } catch (e) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取筛选选项
router.get('/options', authenticateToken, async (req, res) => {
  try {
    const { fn, col } = require('sequelize');
    const colleges = await Student.findAll({ attributes: [[fn('DISTINCT', col('college')), 'college']], raw: true });
    const majors = await Student.findAll({ attributes: [[fn('DISTINCT', col('major')), 'major']], raw: true });
    const grades = await Student.findAll({ attributes: [[fn('DISTINCT', col('grade')), 'grade']], raw: true });

    res.json({
      success: true,
      colleges: colleges.map(c => c.college).filter(Boolean),
      majors: majors.map(m => m.major).filter(Boolean),
      grades: grades.map(g => g.grade).filter(Boolean)
    });
  } catch (e) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// ========== 辅助函数 ==========

function getFieldMap(dataType) {
  const maps = {
    student: {
      '学号': 'studentId', 'studentId': 'studentId', 'student_id': 'studentId',
      '姓名': 'name', 'name': 'name',
      '性别': 'gender', 'gender': 'gender',
      '出生日期': 'birthDate', 'birthDate': 'birthDate',
      '手机': 'phone', 'phone': 'phone', '电话': 'phone',
      '邮箱': 'email', 'email': 'email',
      '学院': 'college', 'college': 'college',
      '系': 'department', 'department': 'department',
      '专业': 'major', 'major': 'major',
      '班级': 'className', 'className': 'className', 'class': 'className',
      '年级': 'grade', 'grade': 'grade',
      '入学日期': 'enrollmentDate', 'enrollmentDate': 'enrollmentDate',
      '宿舍': 'dormitory', 'dormitory': 'dormitory',
      '房间号': 'roomNumber', 'roomNumber': 'roomNumber',
      '籍贯': 'hometown', 'hometown': 'hometown',
      '民族': 'ethnicity', 'ethnicity': 'ethnicity',
      '政治面貌': 'politicalStatus', 'politicalStatus': 'politicalStatus',
      '家庭收入': 'familyIncome', 'familyIncome': 'familyIncome',
      '紧急联系人': 'emergencyContact', 'emergencyContact': 'emergencyContact',
      '紧急联系电话': 'emergencyPhone', 'emergencyPhone': 'emergencyPhone'
    },
    academic: {
      '学号': 'studentId', 'studentId': 'studentId',
      '学期': 'semester', 'semester': 'semester',
      '课程名': 'courseName', 'courseName': 'courseName',
      '课程代码': 'courseCode', 'courseCode': 'courseCode',
      '课程类型': 'courseType', 'courseType': 'courseType',
      '学分': 'credits', 'credits': 'credits',
      '成绩': 'score', 'score': 'score',
      '绩点': 'gradePoint', 'gradePoint': 'gradePoint',
      '排名': 'rank', 'rank': 'rank',
      'GPA': 'gpa', 'gpa': 'gpa',
      '挂科数': 'failedCourses', 'failedCourses': 'failedCourses',
      '预警等级': 'warningLevel', 'warningLevel': 'warningLevel'
    },
    behavior: {
      '学号': 'studentId', 'studentId': 'studentId',
      '日期': 'recordDate', 'recordDate': 'recordDate',
      '类型': 'recordType', 'recordType': 'recordType',
      '金额': 'amount', 'amount': 'amount',
      '地点': 'location', 'location': 'location',
      '时长': 'duration', 'duration': 'duration',
      '频次': 'frequency', 'frequency': 'frequency'
    },
    psychological: {
      '学号': 'studentId', 'studentId': 'studentId',
      '日期': 'recordDate', 'recordDate': 'recordDate',
      '类型': 'recordType', 'recordType': 'recordType',
      '测试类型': 'testType', 'testType': 'testType',
      '分数': 'score', 'score': 'score',
      '风险等级': 'riskLevel', 'riskLevel': 'riskLevel',
      '咨询师': 'counselor', 'counselor': 'counselor',
      '咨询次数': 'consultationCount', 'consultationCount': 'consultationCount',
      '诊断': 'diagnosis', 'diagnosis': 'diagnosis',
      '干预措施': 'intervention', 'intervention': 'intervention',
      '情绪状态': 'emotionState', 'emotionState': 'emotionState'
    },
    life: {
      '学号': 'studentId', 'studentId': 'studentId',
      '日期': 'recordDate', 'recordDate': 'recordDate',
      '类型': 'recordType', 'recordType': 'recordType',
      '类别': 'category', 'category': 'category',
      '标题': 'title', 'title': 'title',
      '描述': 'description', 'description': 'description',
      '级别': 'level', 'level': 'level',
      '奖项类型': 'awardType', 'awardType': 'awardType',
      '组织': 'organization', 'organization': 'organization'
    }
  };
  return maps[dataType];
}

function mapFields(row, fieldMap) {
  const mapped = {};
  Object.entries(row).forEach(([key, value]) => {
    const mappedKey = fieldMap[key.trim()];
    if (mappedKey) mapped[mappedKey] = value;
  });
  return mapped;
}

function getModelByType(dataType) {
  const models = {
    student: Student,
    academic: AcademicRecord,
    behavior: BehaviorRecord,
    psychological: PsychologicalRecord,
    life: LifeRecord
  };
  return models[dataType];
}

function getTemplate(dataType) {
  const templates = {
    student: { '学号': '', '姓名': '', '性别': '', '出生日期': '', '手机': '', '学院': '', '专业': '', '班级': '', '年级': '', '宿舍': '', '籍贯': '' },
    academic: { '学号': '', '学期': '', '课程名': '', '课程代码': '', '学分': '', '成绩': '', '绩点': '', 'GPA': '' },
    behavior: { '学号': '', '日期': '', '类型': '消费/图书馆/门禁', '金额': '', '地点': '', '时长': '' },
    psychological: { '学号': '', '日期': '', '类型': '测评/咨询', '测试类型': 'SCL-90/PHQ-9/GAD-7', '分数': '', '风险等级': 'low/medium/high/critical', '咨询师': '', '诊断': '', '干预措施': '' },
    life: { '学号': '', '日期': '', '类型': '社团/奖惩/活动', '类别': '', '标题': '', '描述': '', '级别': '' }
  };
  return templates[dataType];
}

module.exports = router;
