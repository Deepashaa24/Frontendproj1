import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import Navbar from '../../components/Navbar';
import { FiCheckCircle, FiXCircle, FiAward } from 'react-icons/fi';
import './TestResult.css';

const TestResult = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResult();
  }, []);

  const fetchResult = async () => {
    try {
      const response = await axios.get(`/tests/${testId}/result`);
      setResult(response.data.data);
    } catch (error) {
      console.error('Error fetching result:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading"><div className="spinner"></div></div>
      </>
    );
  }

  if (!result) {
    return (
      <>
        <Navbar />
        <div className="container">
          <div className="alert alert-error">Test result not found</div>
        </div>
      </>
    );
  }

  const passed = result.percentage >= 70;

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="text-center mb-4">
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>
              {passed ? <FiCheckCircle color="#10b981" /> : <FiXCircle color="#ef4444" />}
            </div>
            <h1 style={{ color: 'var(--text-primary)' }}>{passed ? 'Congratulations!' : 'Test Completed'}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {passed 
                ? 'You have passed the test. Your leave request will be reviewed.' 
                : 'You did not meet the passing criteria. Your leave request may not be approved.'}
            </p>
          </div>

          <div className="grid grid-3 mb-4">
            <div className="result-stat-card result-stat-blue">
              <h3 className="result-stat-value" style={{ color: '#0369a1' }}>
                {result.totalScore}
              </h3>
              <p className="result-stat-label">Total Score</p>
            </div>
            <div className="result-stat-card result-stat-green">
              <h3 className="result-stat-value" style={{ color: '#15803d' }}>
                {result.percentage.toFixed(1)}%
              </h3>
              <p className="result-stat-label">Percentage</p>
            </div>
            <div className="result-stat-card result-stat-yellow">
              <h3 className="result-stat-value" style={{ color: '#92400e' }}>
                {result.maxScore}
              </h3>
              <p className="result-stat-label">Max Score</p>
            </div>
          </div>

          {result.violationPenalty > 0 && (
            <div className="card mb-4" style={{ 
              backgroundColor: 'var(--card-bg)', 
              border: '1px solid #ef4444',
              padding: '16px'
            }}>
              <p style={{ color: '#ef4444', fontWeight: '600', margin: 0 }}>
                ⚠️ Penalty Applied: -{result.violationPenalty}% (due to {result.violationCount} violation{result.violationCount !== 1 ? 's' : ''})
              </p>
            </div>
          )}

          <div className="result-details-card">
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>📋 Test Details</h3>
            <div className="grid grid-2">
              <div className="result-detail-item">
                <strong>Round 1 Score:</strong> <span>{result.roundScores.round1}</span>
              </div>
              <div className="result-detail-item">
                <strong>Round 2 Score:</strong> <span>{result.roundScores.round2}</span>
              </div>
              <div className="result-detail-item">
                <strong>Questions Attempted:</strong> <span>{result.responses.length}</span>
              </div>
              <div className="result-detail-item">
                <strong>Violations:</strong> <span>{result.violationCount}</span>
              </div>
              <div className="result-detail-item">
                <strong>Start Time:</strong> <span>{new Date(result.startTime).toLocaleString()}</span>
              </div>
              <div className="result-detail-item">
                <strong>End Time:</strong> <span>{result.endTime ? new Date(result.endTime).toLocaleString() : 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="text-center mt-4">
            <button onClick={() => navigate('/student/dashboard')} className="btn btn-primary">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TestResult;
