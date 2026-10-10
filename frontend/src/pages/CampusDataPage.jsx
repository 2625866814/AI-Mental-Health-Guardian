import { useState, useEffect, useRef } from 'react';

const DATA_TYPES = [
  { key: 'student', label: '学生档案', icon: '👤' },
  { key: 'academic', label: '学业数据', icon: '📚' },
  { key: 'behavior', label: '行为数据', icon: '💳' },
  { key: 'psychological', label: '心理数据', icon: '🧠' },
  { key: 'life', label: '生活数据', icon: '🏠' }
];

const RECORD_TYPES = {
  behavior: ['消费', '图书馆', '门禁', '活动参与', '其他'],
  psychological: ['心理测评', '心理咨询', '危机干预', '跟踪回访'],
  life: ['社团活动', '奖惩记录', '志愿服务', '竞赛获奖', '其他']
};

export default function CampusDataPage() {
  const [activeTab, setActiveTab] = useState('student');
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ college: '', major: '', grade: '', keyword: '' });
  const [showImport, setShowImport] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [showAddRecord, setShowAddRecord] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [options, setOptions] = useState({ colleges: [], majors: [], grades: [] });
  const [detailData, setDetailData] = useState(null);
  const [formData, setFormData] = useState({});
  const [recordData, setRecordData] = useState({});
  const fileInputRef = useRef(null);

  useEffect(() => { loadStudents(); loadOptions(); }, [page, filters]);

  const getToken = () => localStorage.getItem('token');

  const loadStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20, ...filters });
      const res = await fetch(`/api/campus/students?${params}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success) { setStudents(data.data); setTotal(data.total); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadOptions = async () => {
    try {
      const res = await fetch('/api/campus/options', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success) setOptions(data);
    } catch (e) { console.error(e); }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/campus/import/${activeTab}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: fd
      });
      const data = await res.json();
      setImportResult(data);
      if (data.success) loadStudents();
    } catch (e) { alert('导入失败'); }
    finally { setLoading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch(`/api/campus/template/${activeTab}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${activeTab}_template.xlsx`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert('下载失败'); }
  };

  const handleAddStudent = async () => {
    try {
      const res = await fetch('/api/campus/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setShowAdd(false); setFormData({});
        alert(data.message || '添加成功');
        loadStudents();
      } else {
        alert(data.error || '添加失败');
      }
    } catch (e) { alert('添加失败'); }
  };

  const handleEditStudent = async () => {
    try {
      const res = await fetch(`/api/campus/students/${showEdit}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setShowEdit(null); setFormData({});
        alert('修改成功');
        loadStudents();
      } else {
        alert(data.error || '修改失败');
      }
    } catch (e) { alert('修改失败'); }
  };

  const openEditForm = (student) => {
    setFormData({ ...student });
    setShowEdit(student.id);
  };

  const handleAddRecord = async () => {
    try {
      const res = await fetch(`/api/campus/${activeTab}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ ...recordData, studentId: showAddRecord })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddRecord(null); setRecordData({});
        alert('添加成功');
        if (showDetail) loadDetail(showDetail);
      } else {
        alert(data.error || '添加失败');
      }
    } catch (e) { alert('添加失败'); }
  };

  const loadDetail = async (id) => {
    try {
      const res = await fetch(`/api/campus/students/${id}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success) { setDetailData(data); setShowDetail(id); }
    } catch (e) { alert('获取详情失败'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定删除该学生？')) return;
    try {
      await fetch(`/api/campus/students/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      loadStudents();
    } catch (e) { alert('删除失败'); }
  };

  // 学生表单字段
  const studentFields = [
    { key: 'studentId', label: '学号', required: true },
    { key: 'name', label: '姓名', required: true },
    { key: 'gender', label: '性别' },
    { key: 'birthDate', label: '出生日期', type: 'date' },
    { key: 'phone', label: '手机' },
    { key: 'college', label: '学院' },
    { key: 'major', label: '专业' },
    { key: 'className', label: '班级' },
    { key: 'grade', label: '年级' },
    { key: 'dormitory', label: '宿舍' },
    { key: 'hometown', label: '籍贯' },
    { key: 'emergencyContact', label: '紧急联系人' },
    { key: 'emergencyPhone', label: '紧急联系电话' }
  ];

  // 学业表单字段
  const academicFields = [
    { key: 'semester', label: '学期', placeholder: '如: 2024-2025-1' },
    { key: 'courseName', label: '课程名称' },
    { key: 'courseCode', label: '课程代码' },
    { key: 'courseType', label: '课程类型', placeholder: '必修/选修' },
    { key: 'credits', label: '学分', type: 'number' },
    { key: 'score', label: '成绩', type: 'number' },
    { key: 'gradePoint', label: '绩点', type: 'number' },
    { key: 'gpa', label: 'GPA', type: 'number' }
  ];

  // 行为表单字段
  const behaviorFields = [
    { key: 'recordDate', label: '日期', type: 'date' },
    { key: 'recordType', label: '类型', type: 'select', options: RECORD_TYPES.behavior },
    { key: 'amount', label: '金额', type: 'number' },
    { key: 'location', label: '地点' },
    { key: 'duration', label: '时长(分钟)', type: 'number' },
    { key: 'frequency', label: '频次', type: 'number' }
  ];

  // 心理表单字段
  const psychologicalFields = [
    { key: 'recordDate', label: '日期', type: 'date' },
    { key: 'recordType', label: '类型', type: 'select', options: RECORD_TYPES.psychological },
    { key: 'testType', label: '测试类型', placeholder: 'SCL-90/PHQ-9/GAD-7' },
    { key: 'score', label: '分数', type: 'number' },
    { key: 'riskLevel', label: '风险等级', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
    { key: 'counselor', label: '咨询师' },
    { key: 'consultationCount', label: '咨询次数', type: 'number' },
    { key: 'emotionState', label: '情绪状态', placeholder: 'positive/neutral/negative' },
    { key: 'diagnosis', label: '诊断' },
    { key: 'intervention', label: '干预措施' }
  ];

  // 生活表单字段
  const lifeFields = [
    { key: 'recordDate', label: '日期', type: 'date' },
    { key: 'recordType', label: '类型', type: 'select', options: RECORD_TYPES.life },
    { key: 'category', label: '类别' },
    { key: 'title', label: '标题' },
    { key: 'description', label: '描述' },
    { key: 'level', label: '级别', placeholder: '校级/院级/省级/国家级' },
    { key: 'awardType', label: '奖项类型' },
    { key: 'organization', label: '组织单位' }
  ];

  const getFormFields = () => {
    switch (activeTab) {
      case 'student': return studentFields;
      case 'academic': return academicFields;
      case 'behavior': return behaviorFields;
      case 'psychological': return psychologicalFields;
      case 'life': return lifeFields;
      default: return [];
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <style>{`
        .campus-card { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; }
        .campus-btn { padding: 8px 16px; border-radius: 8px; border: none; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .campus-btn-primary { background: #6366f1; color: #fff; }
        .campus-btn-primary:hover { background: #4f46e5; }
        .campus-btn-secondary { background: #f1f5f9; color: #475569; }
        .campus-btn-secondary:hover { background: #e2e8f0; }
        .campus-btn-success { background: #10b981; color: #fff; }
        .campus-btn-success:hover { background: #059669; }
        .campus-input { padding: 8px 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; outline: none; transition: 0.2s; }
        .campus-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        .campus-table { width: 100%; border-collapse: collapse; }
        .campus-table th { padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #64748b; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .campus-table td { padding: 12px 16px; font-size: 13px; color: #334155; border-bottom: 1px solid #f1f5f9; }
        .campus-table tr:hover td { background: #f8fafc; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: #fff; border-radius: 20px; padding: 32px; max-width: 700px; width: 90%; max-height: 85vh; overflow-y: auto; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .fade-in { animation: fadeIn 0.3s ease; }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', margin: 0 }}>校园数据管理</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: '6px 0 0' }}>导入和管理学生多维度数据，自动创建学生账号</p>
        </div>

        {/* 数据类型标签 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {DATA_TYPES.map(t => (
            <button key={t.key}
              onClick={() => { setActiveTab(t.key); setPage(1); setImportResult(null); }}
              style={{
                padding: '10px 20px', borderRadius: 10, border: 'none',
                background: activeTab === t.key ? '#6366f1' : '#fff',
                color: activeTab === t.key ? '#fff' : '#475569',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: '0.2s',
                boxShadow: activeTab === t.key ? '0 4px 12px rgba(99,102,241,0.3)' : '0 1px 3px rgba(0,0,0,0.1)'
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* 操作栏 */}
        <div className="campus-card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {activeTab === 'student' && (
                <>
                  <input className="campus-input" placeholder="搜索姓名/学号" style={{ width: 200 }}
                    value={filters.keyword} onChange={e => setFilters(f => ({ ...f, keyword: e.target.value }))} />
                  <select className="campus-input" value={filters.college}
                    onChange={e => setFilters(f => ({ ...f, college: e.target.value }))}>
                    <option value="">全部学院</option>
                    {options.colleges?.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </>
              )}
              {activeTab !== 'student' && (
                <div style={{ fontSize: 13, color: '#64748b', padding: '8px 0' }}>
                  💡 提示：先选择学生，再录入{DATA_TYPES.find(t => t.key === activeTab)?.label}记录
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="campus-btn campus-btn-secondary" onClick={handleDownloadTemplate}>📥 下载模板</button>
              <button className="campus-btn campus-btn-secondary" onClick={() => fileInputRef.current?.click()}>📤 文件导入</button>
              <button className="campus-btn campus-btn-primary" onClick={() => { setFormData({}); setShowAdd(true); }}>
                {activeTab === 'student' ? '➕ 添加学生' : '➕ 添加记录'}
              </button>
              <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,.json" style={{ display: 'none' }} onChange={handleImport} />
            </div>
          </div>
        </div>

        {/* 导入结果 */}
        {importResult && (
          <div className="campus-card fade-in" style={{ padding: 20, marginBottom: 20, borderLeft: `4px solid ${importResult.success ? '#10b981' : '#ef4444'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                  {importResult.success ? '✅ 导入完成' : '❌ 导入失败'}
                </div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                  总计 {importResult.total} 条，成功 {importResult.imported} 条，失败 {importResult.failed} 条
                  {importResult.accountsCreated > 0 && <span style={{ color: '#10b981', fontWeight: 600 }}>，已创建 {importResult.accountsCreated} 个学生账号</span>}
                </div>
                {importResult.errors?.length > 0 && (
                  <div style={{ fontSize: 12, color: '#ef4444', marginTop: 8 }}>
                    {importResult.errors.slice(0, 3).map((e, i) => <div key={i}>第{e.row}行: {e.error}</div>)}
                  </div>
                )}
              </div>
              <button className="campus-btn campus-btn-secondary" onClick={() => setImportResult(null)}>关闭</button>
            </div>
          </div>
        )}

        {/* 学生列表 */}
        <div className="campus-card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>加载中...</div>
          ) : students.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
              <div style={{ fontSize: 14 }}>暂无数据，请导入或添加学生</div>
              <div style={{ fontSize: 12, marginTop: 8, color: '#94a3b8' }}>添加学生时会自动创建账号（用户名=学号，密码=123456）</div>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table className="campus-table">
                  <thead>
                    <tr>
                      <th>学号</th>
                      <th>姓名</th>
                      <th>性别</th>
                      <th>学院</th>
                      <th>专业</th>
                      <th>班级</th>
                      <th>年级</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600, color: '#6366f1' }}>{s.studentId}</td>
                        <td>{s.name}</td>
                        <td>{s.gender}</td>
                        <td>{s.college}</td>
                        <td>{s.major}</td>
                        <td>{s.className}</td>
                        <td>{s.grade}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="campus-btn campus-btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }}
                              onClick={() => loadDetail(s.id)}>详情</button>
                            <button className="campus-btn campus-btn-secondary" style={{ padding: '4px 10px', fontSize: 12, color: '#6366f1' }}
                              onClick={() => openEditForm(s)}>编辑</button>
                            {activeTab !== 'student' && (
                              <button className="campus-btn campus-btn-success" style={{ padding: '4px 10px', fontSize: 12 }}
                                onClick={() => { setRecordData({}); setShowAddRecord(s.studentId); }}>
                                录入{DATA_TYPES.find(t => t.key === activeTab)?.label}
                              </button>
                            )}
                            <button className="campus-btn campus-btn-secondary" style={{ padding: '4px 10px', fontSize: 12, color: '#ef4444' }}
                              onClick={() => handleDelete(s.id)}>删除</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 13, color: '#64748b' }}>共 {total} 条记录</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="campus-btn campus-btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</button>
                  <span style={{ padding: '8px 16px', fontSize: 13, color: '#475569' }}>第 {page} 页</span>
                  <button className="campus-btn campus-btn-secondary" disabled={students.length < 20} onClick={() => setPage(p => p + 1)}>下一页</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 添加学生/记录弹窗 */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', marginBottom: 24 }}>
              {activeTab === 'student' ? '添加学生' : `添加${DATA_TYPES.find(t => t.key === activeTab)?.label}记录`}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {activeTab === 'student' ? studentFields.map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                    {f.label} {f.required && <span style={{ color: '#ef4444' }}>*</span>}
                  </label>
                  <input className="campus-input" style={{ width: '100%' }} type={f.type || 'text'}
                    value={formData[f.key] || ''} onChange={e => setFormData(d => ({ ...d, [f.key]: e.target.value }))} />
                </div>
              )) : (
                <>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                      学号 <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input className="campus-input" style={{ width: '100%' }} placeholder="请输入学生学号"
                      value={formData.studentId || ''} onChange={e => setFormData(d => ({ ...d, studentId: e.target.value }))} />
                  </div>
                  {getFormFields().map(f => (
                    <div key={f.key}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>{f.label}</label>
                      {f.type === 'select' ? (
                        <select className="campus-input" style={{ width: '100%' }}
                          value={recordData[f.key] || ''} onChange={e => setRecordData(d => ({ ...d, [f.key]: e.target.value }))}>
                          <option value="">请选择</option>
                          {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input className="campus-input" style={{ width: '100%' }} type={f.type || 'text'}
                          placeholder={f.placeholder || ''}
                          value={recordData[f.key] || ''} onChange={e => setRecordData(d => ({ ...d, [f.key]: e.target.value }))} />
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 28 }}>
              <button className="campus-btn campus-btn-secondary" onClick={() => setShowAdd(false)}>取消</button>
              <button className="campus-btn campus-btn-primary" onClick={activeTab === 'student' ? handleAddStudent : handleAddRecord}>
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑学生弹窗 */}
      {showEdit && (
        <div className="modal-overlay" onClick={() => { setShowEdit(null); setFormData({}); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', marginBottom: 24 }}>编辑学生信息</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {studentFields.map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                    {f.label} {f.required && <span style={{ color: '#ef4444' }}>*</span>}
                  </label>
                  <input className="campus-input" style={{ width: '100%' }} type={f.type || 'text'}
                    disabled={f.key === 'studentId'}
                    value={formData[f.key] || ''} onChange={e => setFormData(d => ({ ...d, [f.key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 28 }}>
              <button className="campus-btn campus-btn-secondary" onClick={() => { setShowEdit(null); setFormData({}); }}>取消</button>
              <button className="campus-btn campus-btn-primary" onClick={handleEditStudent}>保存修改</button>
            </div>
          </div>
        </div>
      )}

      {/* 录入记录弹窗（从列表点击） */}
      {showAddRecord && (
        <div className="modal-overlay" onClick={() => setShowAddRecord(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
              为学生 {showAddRecord} 录入{DATA_TYPES.find(t => t.key === activeTab)?.label}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
              {getFormFields().map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>{f.label}</label>
                  {f.type === 'select' ? (
                    <select className="campus-input" style={{ width: '100%' }}
                      value={recordData[f.key] || ''} onChange={e => setRecordData(d => ({ ...d, [f.key]: e.target.value }))}>
                      <option value="">请选择</option>
                      {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input className="campus-input" style={{ width: '100%' }} type={f.type || 'text'}
                      placeholder={f.placeholder || ''}
                      value={recordData[f.key] || ''} onChange={e => setRecordData(d => ({ ...d, [f.key]: e.target.value }))} />
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 28 }}>
              <button className="campus-btn campus-btn-secondary" onClick={() => setShowAddRecord(null)}>取消</button>
              <button className="campus-btn campus-btn-primary" onClick={handleAddRecord}>确认添加</button>
            </div>
          </div>
        </div>
      )}

      {/* 学生详情弹窗 */}
      {showDetail && detailData && (
        <div className="modal-overlay" onClick={() => { setShowDetail(null); setDetailData(null); }}>
          <div className="modal-content" style={{ maxWidth: 900 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                {detailData.student.name} ({detailData.student.studentId}) - 详细信息
              </h2>
              <button className="campus-btn campus-btn-secondary" onClick={() => { setShowDetail(null); setDetailData(null); }}>关闭</button>
            </div>

            {/* 基本信息 */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#6366f1', marginBottom: 12 }}>👤 基本信息</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[
                  { label: '学号', value: detailData.student.studentId },
                  { label: '姓名', value: detailData.student.name },
                  { label: '性别', value: detailData.student.gender },
                  { label: '学院', value: detailData.student.college },
                  { label: '专业', value: detailData.student.major },
                  { label: '班级', value: detailData.student.className },
                  { label: '年级', value: detailData.student.grade },
                  { label: '宿舍', value: detailData.student.dormitory }
                ].map((item, i) => (
                  <div key={i} style={{ padding: 10, background: '#f8fafc', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginTop: 2 }}>{item.value || '-'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 学业数据 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#6366f1', margin: 0 }}>📚 学业数据 ({detailData.academic?.length || 0})</h3>
                <button className="campus-btn campus-btn-success" style={{ padding: '4px 12px', fontSize: 12 }}
                  onClick={() => { setRecordData({}); setShowAddRecord(detailData.student.studentId); setActiveTab('academic'); }}>+ 添加</button>
              </div>
              {detailData.academic?.length > 0 ? (
                <table className="campus-table" style={{ fontSize: 12 }}>
                  <thead><tr><th>学期</th><th>课程</th><th>成绩</th><th>绩点</th><th>GPA</th></tr></thead>
                  <tbody>
                    {detailData.academic.slice(0, 10).map((a, i) => (
                      <tr key={i}><td>{a.semester}</td><td>{a.courseName}</td><td>{a.score}</td><td>{a.gradePoint}</td><td>{a.gpa}</td></tr>
                    ))}
                  </tbody>
                </table>
              ) : <div style={{ padding: 16, color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>暂无学业数据</div>}
            </div>

            {/* 心理数据 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#6366f1', margin: 0 }}>🧠 心理数据 ({detailData.psychological?.length || 0})</h3>
                <button className="campus-btn campus-btn-success" style={{ padding: '4px 12px', fontSize: 12 }}
                  onClick={() => { setRecordData({}); setShowAddRecord(detailData.student.studentId); setActiveTab('psychological'); }}>+ 添加</button>
              </div>
              {detailData.psychological?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {detailData.psychological.slice(0, 5).map((p, i) => (
                    <div key={i} style={{ padding: 12, background: '#f8fafc', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{p.recordDate}</div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{p.recordType} - {p.testType || '-'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {p.score && <span style={{ fontSize: 14, fontWeight: 700 }}>{p.score}</span>}
                        <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                          background: p.riskLevel === 'critical' ? '#fef2f2' : p.riskLevel === 'high' ? '#fff7ed' : '#ecfdf5',
                          color: p.riskLevel === 'critical' ? '#ef4444' : p.riskLevel === 'high' ? '#f97316' : '#10b981' }}>
                          {p.riskLevel || '正常'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <div style={{ padding: 16, color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>暂无心理数据</div>}
            </div>

            {/* 行为数据 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#6366f1', margin: 0 }}>💳 行为数据 ({detailData.behavior?.length || 0})</h3>
                <button className="campus-btn campus-btn-success" style={{ padding: '4px 12px', fontSize: 12 }}
                  onClick={() => { setRecordData({}); setShowAddRecord(detailData.student.studentId); setActiveTab('behavior'); }}>+ 添加</button>
              </div>
              {detailData.behavior?.length > 0 ? (
                <table className="campus-table" style={{ fontSize: 12 }}>
                  <thead><tr><th>日期</th><th>类型</th><th>金额</th><th>地点</th><th>时长</th></tr></thead>
                  <tbody>
                    {detailData.behavior.slice(0, 10).map((b, i) => (
                      <tr key={i}><td>{b.recordDate}</td><td>{b.recordType}</td><td>{b.amount || '-'}</td><td>{b.location || '-'}</td><td>{b.duration ? b.duration + '分钟' : '-'}</td></tr>
                    ))}
                  </tbody>
                </table>
              ) : <div style={{ padding: 16, color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>暂无行为数据</div>}
            </div>

            {/* 生活数据 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#6366f1', margin: 0 }}>🏠 生活数据 ({detailData.life?.length || 0})</h3>
                <button className="campus-btn campus-btn-success" style={{ padding: '4px 12px', fontSize: 12 }}
                  onClick={() => { setRecordData({}); setShowAddRecord(detailData.student.studentId); setActiveTab('life'); }}>+ 添加</button>
              </div>
              {detailData.life?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {detailData.life.slice(0, 5).map((l, i) => (
                    <div key={i} style={{ padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{l.title}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{l.recordDate}</div>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{l.recordType} - {l.category}</div>
                    </div>
                  ))}
                </div>
              ) : <div style={{ padding: 16, color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>暂无生活数据</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
