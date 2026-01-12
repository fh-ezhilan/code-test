import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import CandidateDashboard from './pages/CandidateDashboard';
import TestInstructionsPage from './pages/TestInstructionsPage';
import TestPage from './pages/TestPage';
import MCQTestPage from './pages/MCQTestPage';
import ExplanationTestPage from './pages/ExplanationTestPage';
import SubmissionSuccessPage from './pages/SubmissionSuccessPage';
import TestCompletedPage from './pages/TestCompletedPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/candidate" 
            element={
              <ProtectedRoute allowedRoles={['candidate']}>
                <CandidateDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/test/instructions" 
            element={
              <ProtectedRoute allowedRoles={['candidate']}>
                <TestInstructionsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/test" 
            element={
              <ProtectedRoute allowedRoles={['candidate']}>
                <TestPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/test/mcq" 
            element={
              <ProtectedRoute allowedRoles={['candidate']}>
                <MCQTestPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/test/explanation" 
            element={
              <ProtectedRoute allowedRoles={['candidate']}>
                <ExplanationTestPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/submission-success" 
            element={
              <ProtectedRoute allowedRoles={['candidate']}>
                <SubmissionSuccessPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/test-completed" 
            element={
              <ProtectedRoute allowedRoles={['candidate']}>
                <TestCompletedPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
