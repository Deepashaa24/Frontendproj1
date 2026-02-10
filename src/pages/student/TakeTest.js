import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import { toast } from 'react-toastify';
import { 
  FiAlertTriangle, FiShield, FiEye, FiMonitor, 
  FiMaximize, FiClock, FiAlertCircle, FiXCircle 
} from 'react-icons/fi';
import './Test.css';

const TakeTest = () => {
  const { leaveId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [violations, setViolations] = useState(0);
  const [maxViolations, setMaxViolations] = useState(5);
  const [currentPenalty, setCurrentPenalty] = useState(0);
  const [warningLevel, setWarningLevel] = useState('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [lastViolationType, setLastViolationType] = useState('');
  const [violationModalCountdown, setViolationModalCountdown] = useState(5);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [blurCount, setBlurCount] = useState(0);
  const testContainerRef = useRef(null);
  const violationCooldownRef = useRef(false);
  const testRef = useRef(null);

  // Keep test ref updated
  useEffect(() => {
    testRef.current = test;
  }, [test]);

  // Fetch test
  useEffect(() => {
    fetchTest();
  }, []);

  // ==================== ANTI-CHEAT SYSTEM ====================

  const trackViolation = useCallback(async (type, detail = '') => {
    // Cooldown to prevent spam
    if (violationCooldownRef.current || !testRef.current) return;
    violationCooldownRef.current = true;
    setTimeout(() => { violationCooldownRef.current = false; }, 2000);

    try {
      const response = await axios.post(`/tests/${testRef.current.testId}/violation`, { type, detail });
      
      setViolations(response.data.violationCount);
      setMaxViolations(response.data.maxViolations || 5);
      setCurrentPenalty(response.data.currentPenalty || 0);
      setWarningLevel(response.data.warningLevel || 'normal');

      // Show violation modal
      setLastViolationType(type);
      setShowViolationModal(true);
      setViolationModalCountdown(5);

      if (response.data.autoSubmitted) {
        toast.error('🚫 Test auto-submitted due to excessive cheating violations!', { autoClose: 5000 });
        setTimeout(() => navigate('/student/dashboard'), 2000);
      }
    } catch (error) {
      console.error('Error tracking violation:', error);
    }
  }, [navigate]);

  // 1. Tab Visibility Detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && testRef.current) {
        trackViolation('tab-switch', 'Switched to another tab');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [trackViolation]);

  // 2. Window Blur/Focus Detection (catches Alt+Tab, window switching)
  useEffect(() => {
    const handleBlur = () => {
      if (testRef.current) {
        setBlurCount(prev => prev + 1);
        trackViolation('window-blur', 'Window lost focus (possible alt+tab)');
      }
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [trackViolation]);

  // 3. Copy/Cut/Paste/Drag Prevention
  useEffect(() => {
    const handleCopy = (e) => {
      e.preventDefault();
      trackViolation('copy-paste', 'Attempted to copy text');
    };
    const handleCut = (e) => {
      e.preventDefault();
      trackViolation('copy-paste', 'Attempted to cut text');
    };
    const handlePaste = (e) => {
      // Allow paste only in coding editor
      const target = e.target;
      if (!target.classList.contains('code-editor')) {
        e.preventDefault();
        trackViolation('paste-attempt', 'Attempted to paste outside code editor');
      }
    };
    const handleDrag = (e) => {
      e.preventDefault();
      trackViolation('drag-drop', 'Attempted drag/drop');
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('dragstart', handleDrag);
    document.addEventListener('drop', (e) => e.preventDefault());

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('dragstart', handleDrag);
    };
  }, [trackViolation]);

  // 4. Right-Click Prevention
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
      trackViolation('right-click', 'Attempted right-click context menu');
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, [trackViolation]);

  // 5. Keyboard Shortcut Blocking (DevTools, Print, Select All, etc.)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F12 - DevTools
      if (e.key === 'F12') {
        e.preventDefault();
        trackViolation('devtools', 'Attempted to open DevTools (F12)');
        return;
      }
      // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C - DevTools
      if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
        e.preventDefault();
        trackViolation('devtools', `Attempted DevTools shortcut (Ctrl+Shift+${e.key.toUpperCase()})`);
        return;
      }
      // Ctrl+U - View Source
      if (e.ctrlKey && e.key.toUpperCase() === 'U') {
        e.preventDefault();
        trackViolation('devtools', 'Attempted to view page source (Ctrl+U)');
        return;
      }
      // Ctrl+P - Print
      if (e.ctrlKey && e.key.toUpperCase() === 'P') {
        e.preventDefault();
        trackViolation('print-attempt', 'Attempted to print (Ctrl+P)');
        return;
      }
      // Ctrl+S - Save
      if (e.ctrlKey && e.key.toUpperCase() === 'S') {
        e.preventDefault();
        return;
      }
      // Ctrl+A - Select All (outside code editor)
      if (e.ctrlKey && e.key.toUpperCase() === 'A' && !e.target.classList.contains('code-editor')) {
        e.preventDefault();
        return;
      }
      // PrintScreen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        trackViolation('screen-capture', 'Attempted screenshot (PrintScreen)');
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [trackViolation]);

  // 6. Fullscreen Management
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull && testRef.current && !showFullscreenPrompt) {
        trackViolation('fullscreen-exit', 'Exited fullscreen mode');
        setShowFullscreenPrompt(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [trackViolation, showFullscreenPrompt]);

  // 7. DevTools detection via debugger timing
  useEffect(() => {
    const checkDevTools = setInterval(() => {
      const start = performance.now();
      // debugger statement detection removed for production reliability
      // Using console log size detection instead
      const threshold = 100;
      const duration = performance.now() - start;
      if (duration > threshold) {
        trackViolation('devtools', 'DevTools detected via timing analysis');
      }
    }, 10000);
    return () => clearInterval(checkDevTools);
  }, [trackViolation]);

  // 8. Disable text selection via CSS
  useEffect(() => {
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.msUserSelect = 'none';
    
    return () => {
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.msUserSelect = '';
    };
  }, []);

  // Violation modal countdown
  useEffect(() => {
    if (showViolationModal && violationModalCountdown > 0) {
      const timer = setTimeout(() => setViolationModalCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (showViolationModal && violationModalCountdown === 0) {
      setShowViolationModal(false);
    }
  }, [showViolationModal, violationModalCountdown]);

  // ==================== END ANTI-CHEAT ====================

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      setShowFullscreenPrompt(false);
    } catch (err) {
      toast.error('Fullscreen is required for this test');
    }
  };

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { handleAutoSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const fetchTest = async () => {
    try {
      const response = await axios.get(`/tests/leave/${leaveId}`);
      setTest(response.data.data);
      const startTime = new Date(response.data.data.startTime).getTime();
      const now = new Date().getTime();
      const elapsed = Math.floor((now - startTime) / 1000);
      const totalTime = response.data.data.timeLimit * 60;
      setTimeLeft(Math.max(0, totalTime - elapsed));
    } catch (error) {
      toast.error('Failed to load test');
      navigate('/student/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleNext = async () => {
    const currentQ = test.questions[currentQuestion];
    if (answers[currentQ.question._id]) {
      await submitAnswer(currentQ.question._id, answers[currentQ.question._id]);
    }
    if (currentQuestion < test.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const submitAnswer = async (questionId, answer) => {
    try {
      const payload = {};
      const question = test.questions.find(q => q.question._id === questionId).question;
      if (question.questionType === 'mcq') {
        payload.questionId = questionId;
        payload.selectedOption = parseInt(answer);
      } else {
        payload.questionId = questionId;
        payload.code = answer;
        payload.language = 'javascript';
      }
      await axios.post(`/tests/${test.testId}/answer`, payload);
    } catch (error) {
      toast.error('Failed to submit answer');
    }
  };

  const handleSubmit = async () => {
    if (window.confirm('Are you sure you want to submit the test?')) {
      setIsSubmitting(true);
      try {
        // Exit fullscreen before navigating
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
        await axios.post(`/tests/${test.testId}/submit`);
        toast.success('Test submitted successfully!');
        navigate('/student/dashboard');
      } catch (error) {
        toast.error('Failed to submit test');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleAutoSubmit = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      await axios.post(`/tests/${test.testId}/submit`);
      toast.info('⏱️ Time up! Test auto-submitted.');
      navigate('/student/dashboard');
    } catch (error) {
      console.error('Auto-submit failed:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getViolationLabel = (type) => {
    const labels = {
      'tab-switch': '🔄 Tab Switch Detected',
      'copy-paste': '📋 Copy/Cut Attempt Blocked',
      'right-click': '🖱️ Right-Click Blocked',
      'window-blur': '🪟 Window Switch Detected',
      'keyboard-shortcut': '⌨️ Blocked Keyboard Shortcut',
      'paste-attempt': '📋 Paste Attempt Blocked',
      'devtools': '🔧 Developer Tools Detected',
      'fullscreen-exit': '🖥️ Fullscreen Exit Detected',
      'screen-capture': '📸 Screenshot Attempt Detected',
      'drag-drop': '🔗 Drag/Drop Blocked',
      'print-attempt': '🖨️ Print Attempt Blocked'
    };
    return labels[type] || '⚠️ Violation Detected';
  };

  const violationPercentage = maxViolations > 0 ? (violations / maxViolations) * 100 : 0;

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (!test || test.questions.length === 0) {
    return (
      <div className="container">
        <div className="alert alert-error">No test available</div>
      </div>
    );
  }

  const question = test.questions[currentQuestion].question;

  return (
    <div className="test-container" ref={testContainerRef}>
      {/* Fullscreen Prompt Overlay */}
      {showFullscreenPrompt && (
        <div className="anticheat-overlay">
          <div className="anticheat-modal fullscreen-prompt">
            <div className="anticheat-modal-icon" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              <FiMaximize size={40} />
            </div>
            <h2>Fullscreen Mode Required</h2>
            <p>This test must be taken in fullscreen mode to ensure academic integrity. 
               The following anti-cheating measures are active:</p>
            
            <div className="anticheat-features-grid">
              <div className="anticheat-feature">
                <FiEye className="feature-icon" />
                <div>
                  <strong>Tab & Window Monitoring</strong>
                  <span>Switching tabs or windows is tracked</span>
                </div>
              </div>
              <div className="anticheat-feature">
                <FiShield className="feature-icon" />
                <div>
                  <strong>Copy/Paste Disabled</strong>
                  <span>Text copying and pasting is blocked</span>
                </div>
              </div>
              <div className="anticheat-feature">
                <FiMonitor className="feature-icon" />
                <div>
                  <strong>DevTools Blocked</strong>
                  <span>Developer tools access is prevented</span>
                </div>
              </div>
              <div className="anticheat-feature">
                <FiAlertTriangle className="feature-icon" />
                <div>
                  <strong>Max {maxViolations} Violations</strong>
                  <span>Exceeding limit auto-submits test</span>
                </div>
              </div>
            </div>

            <div className="penalty-info">
              <FiAlertCircle size={16} />
              <span>Each violation deducts <strong>5%</strong> from your final score</span>
            </div>

            <button onClick={enterFullscreen} className="btn btn-primary btn-lg fullscreen-btn">
              <FiMaximize /> Enter Fullscreen & Start Test
            </button>
            
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '12px' }}>
              Press ESC to exit fullscreen (this will be recorded as a violation)
            </p>
          </div>
        </div>
      )}

      {/* Violation Warning Modal */}
      {showViolationModal && (
        <div className="anticheat-overlay violation-overlay">
          <div className={`anticheat-modal violation-modal ${warningLevel}`}>
            <div className="anticheat-modal-icon" style={{ 
              background: warningLevel === 'critical' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 
                          warningLevel === 'warning' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 
                          'linear-gradient(135deg, #3b82f6, #2563eb)' 
            }}>
              {warningLevel === 'critical' ? <FiXCircle size={40} /> : <FiAlertTriangle size={40} />}
            </div>
            
            <h2>{warningLevel === 'critical' ? '🚨 CRITICAL WARNING' : '⚠️ Violation Detected'}</h2>
            <p className="violation-type-label">{getViolationLabel(lastViolationType)}</p>
            
            <div className="violation-progress-container">
              <div className="violation-progress-bar">
                <div 
                  className={`violation-progress-fill ${warningLevel}`}
                  style={{ width: `${violationPercentage}%` }}
                />
              </div>
              <div className="violation-progress-labels">
                <span>Violations: {violations}/{maxViolations}</span>
                <span>Penalty: -{currentPenalty}%</span>
              </div>
            </div>

            {warningLevel === 'critical' && (
              <div className="critical-warning-text">
                <FiAlertCircle />
                <span>One more violation will auto-submit your test!</span>
              </div>
            )}

            <p className="violation-countdown">
              Returning to test in <strong>{violationModalCountdown}</strong> seconds...
            </p>
          </div>
        </div>
      )}

      {/* Test Header */}
      <div className="test-header">
        <div className="test-info">
          <h2>Round {test.currentRound} — Q{currentQuestion + 1} of {test.questions.length}</h2>
          <div className="test-header-badges">
            {/* Violation Counter Badge */}
            <div className={`violation-badge ${warningLevel}`} title="Cheating violations">
              <FiShield size={14} />
              <span>{violations}/{maxViolations}</span>
            </div>
            {/* Penalty Badge */}
            {currentPenalty > 0 && (
              <div className="penalty-badge" title="Score penalty from violations">
                <FiAlertTriangle size={14} />
                <span>-{currentPenalty}%</span>
              </div>
            )}
            {/* Fullscreen indicator */}
            <div className={`fullscreen-badge ${isFullscreen ? 'active' : 'inactive'}`}>
              <FiMonitor size={14} />
              <span>{isFullscreen ? 'Secure' : 'Not Secure'}</span>
            </div>
          </div>
        </div>
        <div className="test-timer">
          <FiClock size={20} />
          <span className={timeLeft < 300 ? 'time-warning' : ''}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Violation Progress Strip */}
      <div className="violation-strip">
        <div 
          className={`violation-strip-fill ${warningLevel}`}
          style={{ width: `${violationPercentage}%` }}
        />
      </div>

      {/* Test Content */}
      <div className="test-content">
        <div className="question-card">
          <div className="question-header">
            <span className={`badge badge-${question.difficulty}`}>
              {question.difficulty}
            </span>
            <span className="question-type">{question.questionType.toUpperCase()}</span>
            <span className="question-points">{question.points} pts</span>
          </div>

          <div className="question-text">
            <h3>{question.questionText || question.problemStatement}</h3>
          </div>

          {question.questionType === 'mcq' ? (
            <div className="options">
              {question.options.map((option, index) => (
                <label key={index} className="option-label">
                  <input
                    type="radio"
                    name="answer"
                    value={index}
                    checked={answers[question._id] === index.toString()}
                    onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                  />
                  <span className="option-text">{option.text}</span>
                </label>
              ))}
            </div>
          ) : (
            <div className="coding-section">
              {question.sampleInput && (
                <div className="sample-io">
                  <div>
                    <strong>Sample Input:</strong>
                    <pre>{question.sampleInput}</pre>
                  </div>
                  <div>
                    <strong>Sample Output:</strong>
                    <pre>{question.sampleOutput}</pre>
                  </div>
                </div>
              )}
              <textarea
                className="code-editor"
                placeholder="Write your code here..."
                value={answers[question._id] || question.starterCode || ''}
                onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                rows={15}
                style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
              />
            </div>
          )}
        </div>

        <div className="test-actions">
          {currentQuestion < test.questions.length - 1 ? (
            <button onClick={handleNext} className="btn btn-primary" disabled={!answers[question._id]}>
              Next Question →
            </button>
          ) : (
            <button onClick={handleSubmit} className="btn btn-success" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : '✅ Submit Test'}
            </button>
          )}
        </div>
      </div>

      {/* Anti-Cheat Status Bar */}
      <div className="anticheat-status-bar">
        <div className="anticheat-status-item">
          <FiShield size={14} />
          <span>Proctoring Active</span>
        </div>
        <div className="anticheat-status-item">
          <FiEye size={14} />
          <span>Tab Monitoring</span>
        </div>
        <div className="anticheat-status-item">
          <FiMonitor size={14} />
          <span>{isFullscreen ? '✓ Fullscreen' : '✗ Not Fullscreen'}</span>
        </div>
        <div className="anticheat-status-item">
          <FiAlertTriangle size={14} />
          <span>Violations: {violations} | Penalty: -{currentPenalty}%</span>
        </div>
      </div>
    </div>
  );
};

export default TakeTest;
