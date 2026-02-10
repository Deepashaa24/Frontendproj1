import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../utils/axios';
import Navbar from '../../components/Navbar';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';

const QuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const [filter, setFilter] = useState({ type: 'all', subject: 'all', difficulty: 'all' });
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();
    fetchSubjects();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get('/questions', {
        params: {
          ...(filter.type !== 'all' && { questionType: filter.type }),
          ...(filter.subject !== 'all' && { subject: filter.subject }),
          ...(filter.difficulty !== 'all' && { difficulty: filter.difficulty })
        }
      });
      setQuestions(response.data.data);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await axios.get('/questions/subjects/list');
      setSubjects(response.data.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;

    try {
      await axios.delete(`/questions/${id}`);
      toast.success('Question deleted successfully');
      fetchQuestions();
    } catch (error) {
      toast.error('Failed to delete question');
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [filter]);

  const getDifficultyBadge = (difficulty) => {
    const badges = {
      'easy': 'badge-success',
      'medium': 'badge-warning',
      'hard': 'badge-danger'
    };
    return badges[difficulty] || 'badge-secondary';
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
        <div className="dashboard-header">
          <h1>Question Bank</h1>
          <Link to="/admin/questions/add" className="btn btn-primary">
            <FiPlus /> Add Question
          </Link>
        </div>

        <div className="card mb-3">
          <div className="grid grid-3">
            <div className="form-group">
              <label className="form-label">Type</label>
              <select
                className="form-control"
                value={filter.type}
                onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              >
                <option value="all">All Types</option>
                <option value="mcq">MCQ</option>
                <option value="coding">Coding</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Subject</label>
              <select
                className="form-control"
                value={filter.subject}
                onChange={(e) => setFilter({ ...filter, subject: e.target.value })}
              >
                <option value="all">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Difficulty</label>
              <select
                className="form-control"
                value={filter.difficulty}
                onChange={(e) => setFilter({ ...filter, difficulty: e.target.value })}
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-3">Questions ({questions.length})</h3>
          
          {questions.length === 0 ? (
            <div className="empty-state">
              <p>No questions found</p>
              <Link to="/admin/questions/add" className="btn btn-primary mt-2">
                Add First Question
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Subject</th>
                    <th>Question</th>
                    <th>Difficulty</th>
                    <th>Points</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((question) => (
                    <tr key={question._id}>
                      <td>
                        <span className={`badge ${question.questionType === 'mcq' ? 'badge-info' : 'badge-secondary'}`}>
                          {question.questionType.toUpperCase()}
                        </span>
                      </td>
                      <td>{question.subject}</td>
                      <td>
                        <div style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {question.questionText || question.problemStatement}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getDifficultyBadge(question.difficulty)}`}>
                          {question.difficulty}
                        </span>
                      </td>
                      <td>{question.points}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleDelete(question._id)}
                            className="btn btn-sm btn-danger"
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
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

export default QuestionBank;
