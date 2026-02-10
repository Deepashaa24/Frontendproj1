import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../utils/axios';
import Navbar from '../../components/Navbar';
import { FiFileText, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import './Dashboard.css';

const StudentDashboard = () => {
  const [leaves, setLeaves] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    testCompleted: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const response = await axios.get('/leaves');
      const leavesData = response.data.data;
      setLeaves(leavesData.slice(0, 5)); // Show latest 5

      // Calculate stats
      const statsData = {
        pending: leavesData.filter(l => l.status === 'pending' || l.status === 'test-assigned').length,
        approved: leavesData.filter(l => l.status === 'approved').length,
        rejected: leavesData.filter(l => l.status === 'rejected').length,
        testCompleted: leavesData.filter(l => l.status === 'test-completed').length
      };
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    const texts = {
      'pending': 'Pending',
      'test-assigned': 'Test Assigned',
      'test-completed': 'Test Completed',
      'approved': 'Approved',
      'rejected': 'Rejected'
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="dashboard-header">
          <h1>Student Dashboard</h1>
          <Link to="/student/apply-leave" className="btn btn-primary">
            Apply for Leave
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon pending">
              <FiClock />
            </div>
            <div className="stat-content">
              <h3>{stats.pending}</h3>
              <p>Pending Requests</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon success">
              <FiCheckCircle />
            </div>
            <div className="stat-content">
              <h3>{stats.approved}</h3>
              <p>Approved Leaves</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon danger">
              <FiXCircle />
            </div>
            <div className="stat-content">
              <h3>{stats.rejected}</h3>
              <p>Rejected Requests</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon warning">
              <FiFileText />
            </div>
            <div className="stat-content">
              <h3>{stats.testCompleted}</h3>
              <p>Awaiting Review</p>
            </div>
          </div>
        </div>

        {/* Recent Leaves */}
        <div className="card">
          <div className="card-header">
            <h2>Recent Leave Requests</h2>
            <Link to="/student/leaves" className="btn btn-outline">
              View All
            </Link>
          </div>

          {leaves.length === 0 ? (
            <div className="empty-state">
              <FiFileText size={48} />
              <p>No leave requests yet</p>
              <Link to="/student/apply-leave" className="btn btn-primary mt-2">
                Apply for Leave
              </Link>
            </div>
          ) : (
            <div className="leaves-list">
              {leaves.map((leave) => {
                const days = Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / (1000*60*60*24)) + 1;
                return (
                  <div key={leave._id} className={`leave-card leave-card-${leave.status}`}>
                    <div className="leave-card-header">
                      <div className="leave-card-info">
                        <h3 className="leave-card-reason">{leave.reason}</h3>
                        <div className="leave-card-meta">
                          <span className="leave-card-date">
                            <FiClock size={13} />
                            {new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            <span className="leave-card-days">({days} day{days !== 1 ? 's' : ''})</span>
                          </span>
                          {leave.subjects && leave.subjects.length > 0 && (
                            <span className="leave-card-subjects">
                              {leave.subjects.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="leave-card-status-area">
                        <span className={`leave-status-badge status-${leave.status}`}>
                          {leave.status === 'approved' && <FiCheckCircle size={14} />}
                          {leave.status === 'rejected' && <FiXCircle size={14} />}
                          {(leave.status === 'pending' || leave.status === 'test-assigned' || leave.status === 'test-completed') && <FiClock size={14} />}
                          {getStatusText(leave.status)}
                        </span>
                        {leave.testScore > 0 && (
                          <span className="leave-card-score" style={{ color: leave.testScore >= 70 ? '#10b981' : leave.testScore >= 50 ? '#f59e0b' : '#ef4444' }}>
                            Score: {leave.testScore.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Admin Decision Details */}
                    {(leave.status === 'approved' || leave.status === 'rejected') && (
                      <div className={`leave-decision-box decision-${leave.status}`}>
                        <div className="leave-decision-header">
                          {leave.status === 'approved' ? (
                            <><FiCheckCircle size={16} /> <strong>Leave Approved</strong></>
                          ) : (
                            <><FiXCircle size={16} /> <strong>Leave Rejected</strong></>
                          )}
                        </div>
                        {leave.adminRemarks && (
                          <p className="leave-decision-remarks">
                            <strong>Admin Remarks:</strong> {leave.adminRemarks}
                          </p>
                        )}
                        <div className="leave-decision-meta">
                          {leave.reviewedBy && (
                            <span>Reviewed by: <strong>{leave.reviewedBy.name || 'Admin'}</strong></span>
                          )}
                          {leave.reviewedAt && (
                            <span>on {new Date(leave.reviewedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="leave-card-actions">
                      {leave.status === 'test-assigned' && (
                        <Link to={`/student/test/${leave._id}`} className="btn btn-sm btn-primary">
                          Take Test
                        </Link>
                      )}
                      {leave.testAttempt && (
                        <Link to={`/student/test-result/${leave.testAttempt._id || leave.testAttempt}`} className="btn btn-sm btn-outline">
                          View Result
                        </Link>
                      )}
                      <span className="leave-card-applied">
                        Applied {new Date(leave.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StudentDashboard;
