import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../utils/axios';
import Navbar from '../../components/Navbar';
import { 
  FiUsers, FiFileText, FiCheckCircle, FiXCircle, 
  FiClock, FiBook, FiTrendingUp, FiAlertTriangle,
  FiArrowRight, FiBarChart2
} from 'react-icons/fi';
import './Admin.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalLeaves: 0,
    pending: 0,
    testAssigned: 0,
    testCompleted: 0,
    approved: 0,
    rejected: 0,
    totalQuestions: 0,
    totalStudents: 0,
    avgTestScore: 0
  });
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [subjectStats, setSubjectStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [leavesRes, questionRes, settingsRes] = await Promise.all([
        axios.get('/leaves'),
        axios.get('/questions/stats'),
        axios.get('/settings')
      ]);

      const leaves = leavesRes.data.data;
      setRecentLeaves(leaves.slice(0, 6));
      setSettings(settingsRes.data.data);

      const pending = leaves.filter(l => l.status === 'pending').length;
      const testAssigned = leaves.filter(l => l.status === 'test-assigned').length;
      const testCompleted = leaves.filter(l => l.status === 'test-completed').length;
      const approved = leaves.filter(l => l.status === 'approved').length;
      const rejected = leaves.filter(l => l.status === 'rejected').length;

      const scoredLeaves = leaves.filter(l => l.testScore > 0);
      const avgScore = scoredLeaves.length > 0 
        ? scoredLeaves.reduce((sum, l) => sum + l.testScore, 0) / scoredLeaves.length 
        : 0;

      const uniqueStudents = new Set(leaves.map(l => l.student?._id)).size;

      const subjectMap = {};
      leaves.forEach(l => {
        if (l.subjects) {
          l.subjects.forEach(s => {
            subjectMap[s] = (subjectMap[s] || 0) + 1;
          });
        }
      });
      setSubjectStats(Object.entries(subjectMap).map(([name, count]) => ({ name, count })));

      const qStats = questionRes.data.data;

      setStats({
        totalLeaves: leaves.length,
        pending,
        testAssigned,
        testCompleted,
        approved,
        rejected,
        totalQuestions: qStats?.total || 0,
        totalStudents: uniqueStudents,
        avgTestScore: avgScore
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreClass = (score) => {
    if (score >= 70) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  };

  const getRecommendation = (leave) => {
    const threshold = settings?.passingPercentageMCQ || 60;
    const score = leave.testScore || 0;
    if (score >= threshold) return { text: 'Approve', color: '#10b981', bg: '#ecfdf5' };
    if (score >= threshold - 10) return { text: 'Review', color: '#f59e0b', bg: '#fffbeb' };
    return { text: 'Reject', color: '#ef4444', bg: '#fef2f2' };
  };

  const getAvatarColor = (name) => {
    const colors = ['#4f46e5', '#7c3aed', '#db2777', '#059669', '#d97706', '#dc2626', '#2563eb'];
    const idx = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[idx];
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const timeSince = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading"><div className="spinner"></div></div>
      </>
    );
  }

  const approvalRate = stats.totalLeaves > 0 
    ? ((stats.approved / stats.totalLeaves) * 100).toFixed(0) 
    : 0;

  const pendingReview = stats.testCompleted;
  const maxSubjectCount = subjectStats.length > 0 ? Math.max(...subjectStats.map(s => s.count)) : 1;

  return (
    <>
      <Navbar />
      <div className="admin-container">
        {/* Header */}
        <div className="admin-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Overview of leave requests, test performance &amp; student analytics
            </p>
          </div>
          <div className="admin-header-actions">
            <Link to="/admin/questions/add" className="btn btn-primary">
              + Add Question
            </Link>
            <Link to="/admin/leave-requests" className="btn btn-outline">
              Review Leaves
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="admin-stats-row">
          <div className="admin-stat-card">
            <div className="stat-accent" style={{ background: 'linear-gradient(90deg, #4f46e5, #818cf8)' }} />
            <div className="stat-label">Total Requests</div>
            <div className="stat-value" style={{ color: '#4f46e5' }}>{stats.totalLeaves}</div>
            <div className="stat-change neutral">
              <FiFileText size={12} /> All leave applications
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-accent" style={{ background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }} />
            <div className="stat-label">Pending Review</div>
            <div className="stat-value" style={{ color: '#f59e0b' }}>{pendingReview}</div>
            <div className="stat-change neutral">
              <FiClock size={12} /> Awaiting decision
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-accent" style={{ background: 'linear-gradient(90deg, #10b981, #34d399)' }} />
            <div className="stat-label">Approved</div>
            <div className="stat-value" style={{ color: '#10b981' }}>{stats.approved}</div>
            <div className="stat-change up">
              <FiTrendingUp size={12} /> {approvalRate}% approval rate
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-accent" style={{ background: 'linear-gradient(90deg, #ef4444, #f87171)' }} />
            <div className="stat-label">Rejected</div>
            <div className="stat-value" style={{ color: '#ef4444' }}>{stats.rejected}</div>
            <div className="stat-change down">
              <FiXCircle size={12} /> Below threshold
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-accent" style={{ background: 'linear-gradient(90deg, #7c3aed, #a78bfa)' }} />
            <div className="stat-label">Avg Test Score</div>
            <div className="stat-value" style={{ color: getScoreColor(stats.avgTestScore) }}>
              {stats.avgTestScore.toFixed(1)}%
            </div>
            <div className="stat-change neutral">
              <FiBarChart2 size={12} /> Passing: {settings?.passingPercentageMCQ || 60}%
            </div>
          </div>
        </div>

        {/* Row 2: Donut Chart + Subject Bar Chart */}
        <div className="admin-grid-equal">
          <div className="admin-card">
            <div className="admin-card-header">
              <h2>Leave Status Breakdown</h2>
            </div>
            <div className="donut-container">
              <div 
                className="donut-chart"
                style={{
                  background: stats.totalLeaves > 0 
                    ? `conic-gradient(
                        #f59e0b 0deg ${(stats.pending + stats.testAssigned + stats.testCompleted) / stats.totalLeaves * 360}deg,
                        #10b981 ${(stats.pending + stats.testAssigned + stats.testCompleted) / stats.totalLeaves * 360}deg ${((stats.pending + stats.testAssigned + stats.testCompleted + stats.approved) / stats.totalLeaves) * 360}deg,
                        #ef4444 ${((stats.pending + stats.testAssigned + stats.testCompleted + stats.approved) / stats.totalLeaves) * 360}deg 360deg
                      )`
                    : '#e5e7eb'
                }}
              >
                <div className="donut-center">
                  <div className="big">{stats.totalLeaves}</div>
                  <div className="small">Total</div>
                </div>
              </div>
              <div className="donut-legend">
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: '#f59e0b' }} />
                  <span>Pending / In Test ({stats.pending + stats.testAssigned + stats.testCompleted})</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: '#10b981' }} />
                  <span>Approved ({stats.approved})</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: '#ef4444' }} />
                  <span>Rejected ({stats.rejected})</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: '#6b7280' }} />
                  <span>Students: {stats.totalStudents} &bull; Questions: {stats.totalQuestions}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <h2>Subjects in Requests</h2>
            </div>
            {subjectStats.length > 0 ? (
              <div className="bar-chart">
                {subjectStats.map((s, i) => {
                  const colors = ['#4f46e5', '#7c3aed', '#db2777', '#059669', '#d97706'];
                  return (
                    <div className="bar-chart-item" key={s.name}>
                      <div className="bar-chart-value">{s.count}</div>
                      <div 
                        className="bar-chart-bar"
                        style={{ 
                          height: `${(s.count / maxSubjectCount) * 100}%`,
                          background: colors[i % colors.length]
                        }}
                      />
                      <div className="bar-chart-label">{s.name}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                No subject data yet
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Pending Review + Activity */}
        <div className="admin-grid-2">
          <div className="admin-card">
            <div className="admin-card-header">
              <h2>
                <FiAlertTriangle style={{ color: '#f59e0b', marginRight: '8px' }} />
                Leaves to Review
              </h2>
              <Link to="/admin/leave-requests" className="btn btn-sm btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                View All <FiArrowRight size={14} />
              </Link>
            </div>

            {recentLeaves.filter(l => l.status === 'test-completed').length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                <FiCheckCircle size={36} style={{ marginBottom: '12px', color: '#10b981' }} />
                <p>No leaves pending review!</p>
              </div>
            ) : (
              recentLeaves
                .filter(l => l.status === 'test-completed')
                .map(leave => {
                  const rec = getRecommendation(leave);
                  return (
                    <div className="leave-row" key={leave._id}>
                      <div className="leave-avatar" style={{ background: getAvatarColor(leave.student?.name) }}>
                        {getInitials(leave.student?.name)}
                      </div>
                      <div className="leave-info">
                        <div className="name">{leave.student?.name}</div>
                        <div className="detail">
                          {leave.reason?.slice(0, 40)}{leave.reason?.length > 40 ? '...' : ''} &bull;{' '}
                          {Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / (1000*60*60*24)) + 1} days
                        </div>
                      </div>
                      <div className="leave-score">
                        <div className="value" style={{ color: getScoreColor(leave.testScore) }}>
                          {leave.testScore?.toFixed(0) || 0}%
                        </div>
                        <div className="label">Score</div>
                      </div>
                      <div style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', color: rec.color, background: rec.bg }}>
                        {rec.text}
                      </div>
                      <Link to="/admin/leave-requests" className="btn btn-sm btn-primary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                        Review
                      </Link>
                    </div>
                  );
                })
            )}
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <h2>Recent Activity</h2>
            </div>
            {recentLeaves.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No activity yet</div>
            ) : (
              recentLeaves.slice(0, 5).map(leave => {
                let dotColor = '#6b7280';
                let text = '';
                if (leave.status === 'pending') { dotColor = '#6b7280'; text = `${leave.student?.name} applied for leave`; }
                else if (leave.status === 'test-assigned') { dotColor = '#3b82f6'; text = `Test assigned to ${leave.student?.name}`; }
                else if (leave.status === 'test-completed') { dotColor = '#f59e0b'; text = `${leave.student?.name} completed test (${leave.testScore?.toFixed(0) || 0}%)`; }
                else if (leave.status === 'approved') { dotColor = '#10b981'; text = `${leave.student?.name}'s leave approved`; }
                else if (leave.status === 'rejected') { dotColor = '#ef4444'; text = `${leave.student?.name}'s leave rejected`; }
                return (
                  <div className="activity-item" key={leave._id}>
                    <div className="activity-dot" style={{ background: dotColor }} />
                    <div>
                      <div className="activity-text">{text}</div>
                      <div className="activity-time">{timeSince(leave.createdAt)}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Row 4: All Recent Leaves Table */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2>All Leave Requests</h2>
            <Link to="/admin/leave-requests" className="btn btn-sm btn-outline">
              Manage All <FiArrowRight size={14} style={{ marginLeft: '4px' }} />
            </Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="students-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Reason</th>
                  <th>Duration</th>
                  <th>Subjects</th>
                  <th>Test Score</th>
                  <th>Recommendation</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentLeaves.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                      No leave requests found
                    </td>
                  </tr>
                ) : (
                  recentLeaves.map(leave => {
                    const rec = getRecommendation(leave);
                    const days = Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / (1000*60*60*24)) + 1;
                    return (
                      <tr key={leave._id}>
                        <td>
                          <div className="student-cell">
                            <div className="student-avatar-sm" style={{ background: getAvatarColor(leave.student?.name) }}>
                              {getInitials(leave.student?.name)}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600' }}>{leave.student?.name}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{leave.student?.department}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {leave.reason}
                        </td>
                        <td>
                          <span style={{ fontWeight: '600' }}>{days} day{days !== 1 ? 's' : ''}</span>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {leave.subjects?.map(s => (
                              <span key={s} style={{ padding: '2px 8px', background: 'var(--light-gray)', borderRadius: '4px', fontSize: '11px', color: 'var(--primary-color)' }}>
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          {leave.testScore > 0 ? (
                            <div className={`percentage-circle ${getScoreClass(leave.testScore)}`} style={{ '--pct': leave.testScore, width: '44px', height: '44px', fontSize: '12px' }}>
                              <span>{leave.testScore.toFixed(0)}%</span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>—</span>
                          )}
                        </td>
                        <td>
                          {leave.testScore > 0 ? (
                            <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', color: rec.color, background: rec.bg }}>
                              {rec.text}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Pending test</span>
                          )}
                        </td>
                        <td>
                          <span className={`leave-status-badge status-${leave.status}`}>
                            {leave.status.replace('-', ' ')}
                          </span>
                        </td>
                        <td>
                          <Link to="/admin/leave-requests" className="btn btn-sm btn-primary" style={{ fontSize: '12px', padding: '6px 14px' }}>
                            {leave.status === 'test-completed' ? 'Review' : 'View'}
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions Footer */}
        <div className="admin-grid-equal" style={{ marginTop: '20px' }}>
          <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--light-gray)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiBook size={24} color="#4f46e5" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600' }}>Question Bank</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{stats.totalQuestions} questions available</div>
            </div>
            <Link to="/admin/questions" className="btn btn-sm btn-outline">Manage</Link>
          </div>
          <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--light-gray)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiUsers size={24} color="#d97706" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600' }}>System Settings</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Passing: {settings?.passingPercentageMCQ || 60}% threshold</div>
            </div>
            <Link to="/admin/settings" className="btn btn-sm btn-outline">Configure</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
