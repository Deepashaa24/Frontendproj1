import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import Navbar from '../../components/Navbar';
import { toast } from 'react-toastify';

const ApplyLeave = () => {
  const [formData, setFormData] = useState({
    reason: '',
    startDate: '',
    endDate: '',
    subjects: []
  });
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [suggestedSubjects, setSuggestedSubjects] = useState([]);
  const [userDepartment, setUserDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubjects();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get('/auth/me');
      const department = response.data.data.department;
      setUserDepartment(department);
      
      // Suggest subjects based on department
      const suggestions = getSuggestedSubjects(department);
      setSuggestedSubjects(suggestions);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const getSuggestedSubjects = (department) => {
    const departmentSubjects = {
      'Computer Science': ['Computer Science', 'Mathematics', 'Physics'],
      'Electronics': ['Physics', 'Mathematics', 'Computer Science'],
      'Mechanical': ['Physics', 'Mathematics', 'English'],
      'Civil': ['Physics', 'Mathematics', 'Chemistry'],
      'Chemical': ['Chemistry', 'Mathematics', 'Physics'],
      'Electrical': ['Physics', 'Mathematics', 'Computer Science'],
      'Information Technology': ['Computer Science', 'Mathematics', 'Physics'],
      'Biotechnology': ['Chemistry', 'Physics', 'Mathematics'],
      'Mathematics': ['Mathematics', 'Physics', 'Computer Science'],
      'Physics': ['Physics', 'Mathematics', 'Chemistry'],
      'Chemistry': ['Chemistry', 'Physics', 'Mathematics'],
      'English': ['English', 'Mathematics', 'Computer Science'],
      'Commerce': ['Mathematics', 'English', 'Computer Science'],
      'Business': ['Mathematics', 'English', 'Computer Science']
    };
    
    return departmentSubjects[department] || ['Computer Science', 'Mathematics', 'English'];
  };

  const fetchSubjects = async () => {
    try {
      const response = await axios.get('/questions/subjects/list');
      setAvailableSubjects(response.data.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const calculateLeaveDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      return days > 0 ? days : 0;
    }
    return 0;
  };

  const getTestDetails = () => {
    const days = calculateLeaveDays();
    let mcqCount = 5;
    let codingCount = 2;
    let difficulty = 'Mixed';

    if (days > 7) {
      mcqCount = 7;
      codingCount = 3;
      difficulty = 'Higher (More Hard Questions)';
    } else if (days > 3) {
      mcqCount = 6;
      codingCount = 2;
      difficulty = 'Moderate';
    } else if (days > 0) {
      mcqCount = 5;
      codingCount = 2;
      difficulty = 'Balanced (More Easy Questions)';
    }

    return { days, mcqCount, codingCount, difficulty };
  };

  const handleSubjectChange = (e) => {
    const value = e.target.value;
    if (value && !formData.subjects.includes(value)) {
      setFormData({
        ...formData,
        subjects: [...formData.subjects, value]
      });
    }
  };

  const addSuggestedSubject = (subject) => {
    if (!formData.subjects.includes(subject)) {
      setFormData({
        ...formData,
        subjects: [...formData.subjects, subject]
      });
    }
  };

  const addAllSuggestedSubjects = () => {
    const newSubjects = [...new Set([...formData.subjects, ...suggestedSubjects])];
    setFormData({
      ...formData,
      subjects: newSubjects
    });
  };

  const removeSubject = (subject) => {
    setFormData({
      ...formData,
      subjects: formData.subjects.filter(s => s !== subject)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.subjects.length === 0) {
      toast.error('Please select at least one subject');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/leaves', formData);
      toast.success(response.data.message);
      navigate('/student/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to apply for leave');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 className="mb-3">Apply for Leave</h1>
          <p className="text-secondary mb-4">
            Submit your leave application. You will be required to complete a test based on the selected subjects.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Reason for Leave *</label>
              <textarea
                name="reason"
                className="form-control"
                placeholder="Enter the reason for your leave request"
                value={formData.reason}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  className="form-control"
                  value={formData.startDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Date *</label>
                <input
                  type="date"
                  name="endDate"
                  className="form-control"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>

            {/* Test Preview based on dates */}
            {formData.startDate && formData.endDate && calculateLeaveDays() > 0 && (
              <div style={{
                padding: '16px',
                background: 'linear-gradient(135deg, #f59e0b15 0%, #d97706 15 100%)',
                borderRadius: '8px',
                border: '1px solid #f59e0b30',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '18px' }}>🎯</span>
                  <strong style={{ color: '#d97706' }}>Your Test Preview</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div style={{ background: 'var(--card-bg)', padding: '12px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Leave Duration</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#d97706' }}>
                      {getTestDetails().days} day{getTestDetails().days !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div style={{ background: 'var(--card-bg)', padding: '12px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>MCQ Questions</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#667eea' }}>
                      {getTestDetails().mcqCount} questions
                    </div>
                  </div>
                  <div style={{ background: 'var(--card-bg)', padding: '12px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Coding Questions</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>
                      {getTestDetails().codingCount} problems
                    </div>
                  </div>
                  <div style={{ background: 'var(--card-bg)', padding: '12px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Difficulty</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#ef4444' }}>
                      {getTestDetails().difficulty}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Subjects *</label>
              
              {/* Suggested Subjects Section */}
              {suggestedSubjects.length > 0 && (
                <div className="mb-3" style={{ 
                  padding: '12px', 
                  background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                  borderRadius: '8px',
                  border: '1px solid #667eea30'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#667eea' }}>
                      💡 Recommended for {userDepartment}:
                    </span>
                    <button 
                      type="button" 
                      onClick={addAllSuggestedSubjects}
                      className="btn btn-sm"
                      style={{ 
                        padding: '4px 12px', 
                        fontSize: '12px',
                        background: '#667eea',
                        color: 'white',
                        border: 'none'
                      }}
                    >
                      Add All
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {suggestedSubjects.map((subject) => (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => addSuggestedSubject(subject)}
                        disabled={formData.subjects.includes(subject)}
                        className="badge"
                        style={{ 
                          padding: '6px 12px',
                          background: formData.subjects.includes(subject) ? '#10b981' : '#667eea',
                          color: 'white',
                          border: 'none',
                          cursor: formData.subjects.includes(subject) ? 'default' : 'pointer',
                          opacity: formData.subjects.includes(subject) ? 0.6 : 1,
                          fontSize: '12px'
                        }}
                      >
                        {subject} {formData.subjects.includes(subject) ? '✓' : '+'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Manual Subject Selection */}
              <select
                className="form-control"
                onChange={handleSubjectChange}
                value=""
              >
                <option value="">Select subjects for the test</option>
                {availableSubjects.map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
              
              {/* Selected Subjects Display */}
              {formData.subjects.length > 0 && (
                <div className="mt-2">
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                    Selected Subjects ({formData.subjects.length}):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {formData.subjects.map((subject) => (
                      <span 
                        key={subject} 
                        className="badge badge-info" 
                        style={{ 
                          padding: '8px 12px', 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }} 
                        onClick={() => removeSubject(subject)}
                      >
                        {subject}
                        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>×</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="alert alert-info mt-3">
              <strong>📋 Test Information:</strong>
              <ul style={{ marginTop: '8px', marginBottom: '0', paddingLeft: '20px' }}>
                <li>You will take a test with MCQ and coding questions based on selected subjects</li>
                <li>Test difficulty and length will depend on your leave duration</li>
                <li>Longer leave requests require more questions</li>
                <li>Anti-cheating measures are active (tab switching, copy-paste detection)</li>
                <li>Your leave approval depends on test performance</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/student/dashboard')}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ApplyLeave;
