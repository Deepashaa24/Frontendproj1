import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import Navbar from '../../components/Navbar';
import { toast } from 'react-toastify';
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const LeaveRequests = () => {
  const [leaves, setLeaves] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [selectedLeaveDetails, setSelectedLeaveDetails] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetchLeaves();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/settings');
      setSettings(response.data.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchLeaves = async () => {
    try {
      const response = await axios.get('/leaves');
      setLeaves(response.data.data);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveDetails = async (leaveId) => {
    try {
      const response = await axios.get(`/leaves/${leaveId}`);
      setSelectedLeaveDetails(response.data.data);
    } catch (error) {
      console.error('Error fetching leave details:', error);
    }
  };

  const getRecommendation = (leave) => {
    if (!leave.testScore) return { action: 'pending', reason: 'Test not completed' };
    
    const passingThreshold = settings?.passingPercentageMCQ || 60;
    const score = leave.testScore;
    
    if (score >= 80) {
      return { 
        action: 'approve', 
        reason: 'Excellent performance',
        color: 'var(--success)',
        icon: FiCheckCircle
      };
    } else if (score >= passingThreshold) {
      return { 
        action: 'approve', 
        reason: 'Satisfactory performance',
        color: 'var(--success)',
        icon: FiCheckCircle
      };
    } else if (score >= passingThreshold - 10) {
      return { 
        action: 'review', 
        reason: 'Borderline score - requires review',
        color: 'var(--warning)',
        icon: FiAlertCircle
      };
    } else {
      return { 
        action: 'reject', 
        reason: 'Below passing threshold',
        color: 'var(--danger-color)',
        icon: FiXCircle
      };
    }
  };

  const handleApprove = async (leaveId) => {
    if (!window.confirm('Approve this leave request?')) return;

    try {
      await axios.put(`/leaves/${leaveId}/status`, {
        status: 'approved',
        adminRemarks: remarks
      });
      toast.success('Leave approved successfully');
      fetchLeaves();
      setSelectedLeave(null);
      setRemarks('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve leave');
    }
  };

  const handleReject = async (leaveId) => {
    if (!remarks.trim()) {
      toast.error('Please provide remarks for rejection');
      return;
    }

    if (!window.confirm('Reject this leave request?')) return;

    try {
      await axios.put(`/leaves/${leaveId}/status`, {
        status: 'rejected',
        adminRemarks: remarks
      });
      toast.success('Leave rejected');
      fetchLeaves();
      setSelectedLeave(null);
      setRemarks('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject leave');
    }
  };

  const filteredLeaves = leaves.filter(leave => {
    if (filter === 'all') return true;
    return leave.status === filter;
  });

  const getStatusBadge = (status) => {
    const badges = {
      'pending': 'badge-secondary',
      'test-assigned': 'badge-info',
      'test-completed': 'badge-warning',
      'approved': 'badge-success',
      'rejected': 'badge-danger'
    };
    return badges[status] || 'badge-secondary';
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading"><div className="spinner"></div></div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <h1 className="mb-4">Leave Requests Management</h1>

        <div className="card mb-3">
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilter('all')}
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
            >
              All ({leaves.length})
            </button>
            <button
              onClick={() => setFilter('test-completed')}
              className={`btn ${filter === 'test-completed' ? 'btn-primary' : 'btn-outline'}`}
            >
              Pending Review ({leaves.filter(l => l.status === 'test-completed').length})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`btn ${filter === 'approved' ? 'btn-primary' : 'btn-outline'}`}
            >
              Approved ({leaves.filter(l => l.status === 'approved').length})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`btn ${filter === 'rejected' ? 'btn-primary' : 'btn-outline'}`}
            >
              Rejected ({leaves.filter(l => l.status === 'rejected').length})
            </button>
          </div>
        </div>

        <div className="card">
          {filteredLeaves.length === 0 ? (
            <div className="empty-state">
              <p>No leave requests found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Reason</th>
                    <th>Duration</th>
                    <th>Subjects</th>
                    <th>Test Score</th>
                    <th>Result</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaves.map((leave) => (
                    <React.Fragment key={leave._id}>
                      <tr>
                        <td>
                          <div>
                            <strong>{leave.student.name}</strong>
                            <br />
                            <small>{leave.student.email}</small>
                            <br />
                            <small>ID: {leave.student.studentId}</small>
                          </div>
                        </td>
                        <td>{leave.reason}</td>
                        <td>
                          {new Date(leave.startDate).toLocaleDateString()} -{' '}
                          {new Date(leave.endDate).toLocaleDateString()}
                        </td>
                        <td>{leave.subjects.join(', ')}</td>
                        <td>
                          {leave.testScore > 0 ? (
                            <strong style={{ color: leave.testScore >= 70 ? 'var(--success)' : 'var(--danger-color)' }}>
                              {leave.testScore.toFixed(1)}%
                            </strong>
                          ) : 'N/A'}
                        </td>
                        <td>
                          {leave.testResult === 'pass' && <span className="badge badge-success">Pass</span>}
                          {leave.testResult === 'fail' && <span className="badge badge-danger">Fail</span>}
                          {leave.testResult === 'pending' && <span className="badge badge-secondary">Pending</span>}
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadge(leave.status)}`}>
                            {leave.status.replace('-', ' ')}
                          </span>
                        </td>
                        <td>
                          {leave.status === 'test-completed' && (
                            <button
                              onClick={() => {
                                if (selectedLeave === leave._id) {
                                  setSelectedLeave(null);
                                  setSelectedLeaveDetails(null);
                                } else {
                                  setSelectedLeave(leave._id);
                                  fetchLeaveDetails(leave._id);
                                }
                              }}
                              className="btn btn-sm btn-primary"
                            >
                              {selectedLeave === leave._id ? 'Cancel' : 'Review'}
                            </button>
                          )}
                          {(leave.status === 'approved' || leave.status === 'rejected') && (
                            <button
                              onClick={() => {
                                setSelectedLeave(selectedLeave === leave._id ? null : leave._id);
                                if (selectedLeave !== leave._id) fetchLeaveDetails(leave._id);
                              }}
                              className="btn btn-sm btn-outline"
                            >
                              {selectedLeave === leave._id ? 'Hide' : 'View'}
                            </button>
                          )}
                        </td>
                      </tr>
                      {selectedLeave === leave._id && (
                        <tr>
                          <td colSpan="8" style={{ backgroundColor: 'var(--light-gray)', padding: '0' }}>
                            <div style={{ padding: '24px' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                                {/* Test Performance Card */}
                                <div style={{ 
                                  background: 'var(--card-bg)', 
                                  padding: '20px', 
                                  borderRadius: '12px',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                    <div style={{ 
                                      width: '48px', 
                                      height: '48px', 
                                      borderRadius: '12px',
                                      background: leave.testScore >= 70 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: 'white',
                                      fontSize: '24px'
                                    }}>
                                      {leave.testScore >= 70 ? <FiTrendingUp /> : <FiTrendingDown />}
                                    </div>
                                    <div>
                                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Test Score</div>
                                      <div style={{ fontSize: '28px', fontWeight: 'bold', color: leave.testScore >= 70 ? '#10b981' : '#ef4444' }}>
                                        {leave.testScore?.toFixed(1) || 0}%
                                      </div>
                                    </div>
                                  </div>
                                  <div style={{ 
                                    width: '100%', 
                                    height: '8px', 
                                    background: 'var(--border)', 
                                    borderRadius: '4px',
                                    overflow: 'hidden'
                                  }}>
                                    <div style={{ 
                                      width: `${leave.testScore || 0}%`, 
                                      height: '100%',
                                      background: leave.testScore >= 70 ? '#10b981' : '#ef4444',
                                      transition: 'width 0.3s ease'
                                    }} />
                                  </div>
                                </div>

                                {/* Recommendation Card */}
                                {settings && leave.status === 'test-completed' && (
                                  <div style={{ 
                                    background: 'var(--card-bg)', 
                                    padding: '20px', 
                                    borderRadius: '12px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                  }}>
                                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>AI Recommendation</div>
                                    {(() => {
                                      const rec = getRecommendation(leave);
                                      const Icon = rec.icon;
                                      return (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                          <Icon size={32} style={{ color: rec.color }} />
                                          <div>
                                            <div style={{ fontSize: '18px', fontWeight: '600', color: rec.color, textTransform: 'uppercase' }}>
                                              {rec.action}
                                            </div>
                                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{rec.reason}</div>
                                          </div>
                                        </div>
                                      );
                                    })()}
                                    <div style={{ 
                                      marginTop: '12px', 
                                      padding: '12px', 
                                      background: 'var(--light-gray)', 
                                      borderRadius: '8px',
                                      fontSize: '12px',
                                      color: 'var(--text-secondary)'
                                    }}>
                                      Passing Threshold: {settings.passingPercentageMCQ}%
                                    </div>
                                  </div>
                                )}

                                {/* Leave Details Card */}
                                <div style={{ 
                                  background: 'var(--card-bg)', 
                                  padding: '20px', 
                                  borderRadius: '12px',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}>
                                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Leave Details</div>
                                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                                    <div><strong>Duration:</strong> {Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / (1000*60*60*24)) + 1} days</div>
                                    <div><strong>Subjects:</strong> {leave.subjects.join(', ')}</div>
                                    <div><strong>Applied on:</strong> {new Date(leave.createdAt).toLocaleString()}</div>
                                  </div>
                                </div>
                              </div>

                              {/* Test Attempt Details */}
                              {selectedLeaveDetails?.testAttempt && (
                                <div style={{ 
                                  background: 'var(--card-bg)', 
                                  padding: '20px', 
                                  borderRadius: '12px',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                  marginBottom: '20px'
                                }}>
                                  <h4 style={{ marginBottom: '16px' }}>Test Performance Breakdown</h4>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                                    <div>
                                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Round 1 (MCQ)</div>
                                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea' }}>
                                        {selectedLeaveDetails.testAttempt.roundScores?.round1?.toFixed(1) || 0}%
                                      </div>
                                    </div>
                                    <div>
                                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Round 2 (Coding)</div>
                                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                                        {selectedLeaveDetails.testAttempt.roundScores?.round2?.toFixed(1) || 0}%
                                      </div>
                                    </div>
                                    <div>
                                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Violations</div>
                                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
                                        {selectedLeaveDetails.testAttempt.violations?.length || 0}
                                      </div>
                                    </div>
                                    <div>
                                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Time Taken</div>
                                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
                                        {Math.floor((selectedLeaveDetails.testAttempt.timeLimit - (selectedLeaveDetails.testAttempt.timeRemaining || 0)) / 60)}m
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Admin Actions */}
                              {leave.status === 'test-completed' && (
                                <div style={{ 
                                  background: 'var(--card-bg)', 
                                  padding: '20px', 
                                  borderRadius: '12px',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}>
                                  <h4 className="mb-3">Admin Decision</h4>
                                  <div className="form-group">
                                    <label className="form-label">Remarks *</label>
                                    <textarea
                                      className="form-control"
                                      value={remarks}
                                      onChange={(e) => setRemarks(e.target.value)}
                                      placeholder="Provide reason for your decision..."
                                      rows="3"
                                    />
                                  </div>
                                  <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                    <button
                                      onClick={() => handleApprove(leave._id)}
                                      className="btn btn-success"
                                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                      <FiCheckCircle /> Approve Leave
                                    </button>
                                    <button
                                      onClick={() => handleReject(leave._id)}
                                      className="btn btn-danger"
                                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                      <FiXCircle /> Reject Leave
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedLeave(null);
                                        setSelectedLeaveDetails(null);
                                        setRemarks('');
                                      }}
                                      className="btn btn-secondary"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* View Only for Approved/Rejected */}
                              {(leave.status === 'approved' || leave.status === 'rejected') && (
                                <div style={{ 
                                  background: 'var(--card-bg)', 
                                  padding: '20px', 
                                  borderRadius: '12px',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}>
                                  <h4 className="mb-3">Admin Decision</h4>
                                  <div style={{ 
                                    padding: '16px', 
                                    background: leave.status === 'approved' ? '#d1fae515' : '#fee2e215',
                                    borderRadius: '8px',
                                    borderLeft: `4px solid ${leave.status === 'approved' ? '#10b981' : '#ef4444'}`
                                  }}>
                                    <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                                      Status: <span style={{ color: leave.status === 'approved' ? '#10b981' : '#ef4444', textTransform: 'uppercase' }}>
                                        {leave.status}
                                      </span>
                                    </div>
                                    {leave.adminRemarks && (
                                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                        <strong>Remarks:</strong> {leave.adminRemarks}
                                      </div>
                                    )}
                                    {leave.reviewedBy && (
                                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                                        Reviewed by: {leave.reviewedBy.name}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LeaveRequests;
