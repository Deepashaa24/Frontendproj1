import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/student/Dashboard';
import ApplyLeave from './pages/student/ApplyLeave';
import TakeTest from './pages/student/TakeTest';
import TestResult from './pages/student/TestResult';
import MyLeaves from './pages/student/MyLeaves';
import AdminDashboard from './pages/admin/Dashboard';
import LeaveRequests from './pages/admin/LeaveRequests';
import QuestionBank from './pages/admin/QuestionBank';
import AddQuestion from './pages/admin/AddQuestion';
import Settings from './pages/admin/Settings';

function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Student Routes */}
            <Route
              path="/student/dashboard"
              element={
                <PrivateRoute role="student">
                  <StudentDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/student/apply-leave"
              element={
                <PrivateRoute role="student">
                  <ApplyLeave />
                </PrivateRoute>
              }
            />
            <Route
              path="/student/test/:leaveId"
              element={
                <PrivateRoute role="student">
                  <TakeTest />
                </PrivateRoute>
              }
            />
            <Route
              path="/student/test-result/:testId"
              element={
                <PrivateRoute role="student">
                  <TestResult />
                </PrivateRoute>
              }
            />
            <Route
              path="/student/leaves"
              element={
                <PrivateRoute role="student">
                  <MyLeaves />
                </PrivateRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <PrivateRoute role="admin">
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/leave-requests"
              element={
                <PrivateRoute role="admin">
                  <LeaveRequests />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/questions"
              element={
                <PrivateRoute role="admin">
                  <QuestionBank />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/questions/add"
              element={
                <PrivateRoute role="admin">
                  <AddQuestion />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <PrivateRoute role="admin">
                  <Settings />
                </PrivateRoute>
              }
            />

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>

          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </Router>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
