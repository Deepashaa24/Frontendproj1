import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import Navbar from '../../components/Navbar';
import { toast } from 'react-toastify';

const Settings = () => {
  const [settings, setSettings] = useState({
    mcqCount: 10,
    codingCount: 2,
    mcqTimeLimit: 30,
    codingTimeLimit: 45,
    passingPercentage: 70,
    round1PassingPercentage: 60,
    maxViolations: 5,
    autoSubmitOnViolation: true,
    violationPenaltyPercent: 5,
    requireFullscreen: true,
    maxLeaveDays: 7
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/settings');
      setSettings(response.data.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setSettings({
      ...settings,
      [e.target.name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await axios.put('/settings', settings);
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
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

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 className="mb-4">System Settings</h1>

          <form onSubmit={handleSubmit}>
            <div className="card" style={{ backgroundColor: 'var(--light-gray)', marginBottom: '20px' }}>
              <h3 className="mb-3">Test Configuration</h3>
              
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">MCQ Questions per Test</label>
                  <input
                    type="number"
                    name="mcqCount"
                    className="form-control"
                    value={settings.mcqCount}
                    onChange={handleChange}
                    min="1"
                    max="50"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Coding Questions per Test</label>
                  <input
                    type="number"
                    name="codingCount"
                    className="form-control"
                    value={settings.codingCount}
                    onChange={handleChange}
                    min="0"
                    max="10"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">MCQ Time Limit (minutes)</label>
                  <input
                    type="number"
                    name="mcqTimeLimit"
                    className="form-control"
                    value={settings.mcqTimeLimit}
                    onChange={handleChange}
                    min="5"
                    max="120"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Coding Time Limit (minutes)</label>
                  <input
                    type="number"
                    name="codingTimeLimit"
                    className="form-control"
                    value={settings.codingTimeLimit}
                    onChange={handleChange}
                    min="10"
                    max="180"
                  />
                </div>
              </div>
            </div>

            <div className="card" style={{ backgroundColor: 'var(--light-gray)', marginBottom: '20px' }}>
              <h3 className="mb-3">Passing Criteria</h3>
              
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Overall Passing Percentage</label>
                  <input
                    type="number"
                    name="passingPercentage"
                    className="form-control"
                    value={settings.passingPercentage}
                    onChange={handleChange}
                    min="0"
                    max="100"
                  />
                  <small className="text-secondary">Minimum score to pass the entire test</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Round 1 Passing Percentage</label>
                  <input
                    type="number"
                    name="round1PassingPercentage"
                    className="form-control"
                    value={settings.round1PassingPercentage}
                    onChange={handleChange}
                    min="0"
                    max="100"
                  />
                  <small className="text-secondary">Minimum to qualify for Round 2</small>
                </div>
              </div>
            </div>

            <div className="card" style={{ backgroundColor: 'var(--light-gray)', marginBottom: '20px' }}>
              <h3 className="mb-3">🛡️ Anti-Cheating Settings</h3>
              
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Maximum Violations Allowed</label>
                  <input
                    type="number"
                    name="maxViolations"
                    className="form-control"
                    value={settings.maxViolations}
                    onChange={handleChange}
                    min="1"
                    max="20"
                  />
                  <small className="text-secondary">Tab switches, copy-paste, window blur, DevTools, etc.</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Violation Penalty (% per violation)</label>
                  <input
                    type="number"
                    name="violationPenaltyPercent"
                    className="form-control"
                    value={settings.violationPenaltyPercent}
                    onChange={handleChange}
                    min="0"
                    max="25"
                  />
                  <small className="text-secondary">Score deducted per violation (e.g., 5% each)</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Auto-Submit on Max Violations</label>
                  <div style={{ marginTop: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="autoSubmitOnViolation"
                        checked={settings.autoSubmitOnViolation}
                        onChange={handleChange}
                      />
                      <span>Automatically submit test when max violations reached</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Require Fullscreen Mode</label>
                  <div style={{ marginTop: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="requireFullscreen"
                        checked={settings.requireFullscreen}
                        onChange={handleChange}
                      />
                      <span>Students must enter fullscreen to take the test</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="alert alert-info" style={{ marginTop: '16px', fontSize: '13px' }}>
                <strong>Active Anti-Cheat Measures:</strong> Tab switch detection, Window blur monitoring, Copy/Cut/Paste blocking, Right-click prevention, DevTools blocking (F12, Ctrl+Shift+I/J/C), Print prevention (Ctrl+P), Screenshot detection, Drag/Drop blocking, Fullscreen enforcement, Keyboard shortcut blocking, Text selection prevention
              </div>
            </div>

            <div className="card" style={{ backgroundColor: 'var(--light-gray)', marginBottom: '20px' }}>
              <h3 className="mb-3">Leave Settings</h3>
              
              <div className="form-group">
                <label className="form-label">Maximum Leave Days</label>
                <input
                  type="number"
                  name="maxLeaveDays"
                  className="form-control"
                  value={settings.maxLeaveDays}
                  onChange={handleChange}
                  min="1"
                  max="30"
                />
                <small className="text-secondary">Maximum number of consecutive leave days allowed</small>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Settings;
