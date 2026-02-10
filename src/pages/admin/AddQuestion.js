import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import Navbar from '../../components/Navbar';
import { toast } from 'react-toastify';

const AddQuestion = () => {
  const [questionType, setQuestionType] = useState('mcq');
  const [formData, setFormData] = useState({
    subject: '',
    difficulty: 'medium',
    points: 1,
    // MCQ fields
    questionText: '',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ],
    // Coding fields
    problemStatement: '',
    constraints: '',
    inputFormat: '',
    outputFormat: '',
    sampleInput: '',
    sampleOutput: '',
    testCases: [{ input: '', expectedOutput: '', isHidden: false }],
    starterCode: '',
    timeLimit: 300
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...formData.options];
    if (field === 'isCorrect') {
      // Only one option can be correct
      newOptions.forEach((opt, i) => {
        opt.isCorrect = i === index;
      });
    } else {
      newOptions[index][field] = value;
    }
    setFormData({ ...formData, options: newOptions });
  };

  const handleTestCaseChange = (index, field, value) => {
    const newTestCases = [...formData.testCases];
    newTestCases[index][field] = value;
    setFormData({ ...formData, testCases: newTestCases });
  };

  const addTestCase = () => {
    setFormData({
      ...formData,
      testCases: [...formData.testCases, { input: '', expectedOutput: '', isHidden: false }]
    });
  };

  const removeTestCase = (index) => {
    const newTestCases = formData.testCases.filter((_, i) => i !== index);
    setFormData({ ...formData, testCases: newTestCases });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (questionType === 'mcq') {
      const hasCorrectOption = formData.options.some(opt => opt.isCorrect);
      if (!hasCorrectOption) {
        toast.error('Please select a correct option');
        return;
      }
      
      const allOptionsFilled = formData.options.every(opt => opt.text.trim() !== '');
      if (!allOptionsFilled) {
        toast.error('Please fill all options');
        return;
      }
    } else {
      if (formData.testCases.length === 0) {
        toast.error('Please add at least one test case');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        questionType,
        subject: formData.subject,
        difficulty: formData.difficulty,
        points: parseInt(formData.points),
        ...(questionType === 'mcq' ? {
          questionText: formData.questionText,
          options: formData.options
        } : {
          problemStatement: formData.problemStatement,
          constraints: formData.constraints,
          inputFormat: formData.inputFormat,
          outputFormat: formData.outputFormat,
          sampleInput: formData.sampleInput,
          sampleOutput: formData.sampleOutput,
          testCases: formData.testCases,
          starterCode: formData.starterCode,
          timeLimit: parseInt(formData.timeLimit)
        })
      };

      await axios.post('/questions', payload);
      toast.success('Question added successfully');
      navigate('/admin/questions');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="card" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 className="mb-4">Add New Question</h1>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-2 mb-3">
              <div className="form-group">
                <label className="form-label">Question Type *</label>
                <select
                  className="form-control"
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value)}
                  required
                >
                  <option value="mcq">Multiple Choice (MCQ)</option>
                  <option value="coding">Coding Problem</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Subject *</label>
                <input
                  type="text"
                  name="subject"
                  className="form-control"
                  placeholder="e.g., Mathematics, Programming"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-3 mb-3">
              <div className="form-group">
                <label className="form-label">Difficulty *</label>
                <select
                  name="difficulty"
                  className="form-control"
                  value={formData.difficulty}
                  onChange={handleChange}
                  required
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Points *</label>
                <input
                  type="number"
                  name="points"
                  className="form-control"
                  value={formData.points}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>

              {questionType === 'coding' && (
                <div className="form-group">
                  <label className="form-label">Time Limit (seconds)</label>
                  <input
                    type="number"
                    name="timeLimit"
                    className="form-control"
                    value={formData.timeLimit}
                    onChange={handleChange}
                    min="60"
                  />
                </div>
              )}
            </div>

            {questionType === 'mcq' ? (
              <>
                <div className="form-group">
                  <label className="form-label">Question Text *</label>
                  <textarea
                    name="questionText"
                    className="form-control"
                    placeholder="Enter the question"
                    value={formData.questionText}
                    onChange={handleChange}
                    rows="3"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Options *</label>
                  {formData.options.map((option, index) => (
                    <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                      <input
                        type="radio"
                        name="correctOption"
                        checked={option.isCorrect}
                        onChange={() => handleOptionChange(index, 'isCorrect', true)}
                      />
                      <input
                        type="text"
                        className="form-control"
                        placeholder={`Option ${index + 1}`}
                        value={option.text}
                        onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                        required
                      />
                    </div>
                  ))}
                  <small className="text-secondary">Select the radio button for the correct answer</small>
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Problem Statement *</label>
                  <textarea
                    name="problemStatement"
                    className="form-control"
                    placeholder="Describe the problem"
                    value={formData.problemStatement}
                    onChange={handleChange}
                    rows="4"
                    required
                  />
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Sample Input</label>
                    <textarea
                      name="sampleInput"
                      className="form-control"
                      value={formData.sampleInput}
                      onChange={handleChange}
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Sample Output</label>
                    <textarea
                      name="sampleOutput"
                      className="form-control"
                      value={formData.sampleOutput}
                      onChange={handleChange}
                      rows="3"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Starter Code (Optional)</label>
                  <textarea
                    name="starterCode"
                    className="form-control"
                    placeholder="// Write your code here"
                    value={formData.starterCode}
                    onChange={handleChange}
                    rows="5"
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Test Cases *</label>
                    <button type="button" onClick={addTestCase} className="btn btn-sm btn-outline">
                      + Add Test Case
                    </button>
                  </div>

                  {formData.testCases.map((testCase, index) => (
                    <div key={index} className="card" style={{ padding: '15px', marginBottom: '10px', backgroundColor: 'var(--light-gray)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <strong>Test Case {index + 1}</strong>
                        {formData.testCases.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTestCase(index)}
                            className="btn btn-sm btn-danger"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-2 mb-2">
                        <div>
                          <label className="form-label">Input</label>
                          <textarea
                            className="form-control"
                            value={testCase.input}
                            onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                            rows="2"
                            required
                          />
                        </div>
                        <div>
                          <label className="form-label">Expected Output</label>
                          <textarea
                            className="form-control"
                            value={testCase.expectedOutput}
                            onChange={(e) => handleTestCaseChange(index, 'expectedOutput', e.target.value)}
                            rows="2"
                            required
                          />
                        </div>
                      </div>
                      
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={testCase.isHidden}
                          onChange={(e) => handleTestCaseChange(index, 'isHidden', e.target.checked)}
                        />
                        <span>Hidden test case (not shown to students)</span>
                      </label>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Adding...' : 'Add Question'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/admin/questions')}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddQuestion;
