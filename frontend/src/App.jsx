import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardPage from './pages/Dashboard/DashboardPage';
import DocumentListPage from './pages/Documents/DocumentListPage';
import DocumentDetailPage from './pages/Documents/DocumentDetailPage';
import FlashcardsListPage from './pages/Flashcards/FlashcardsListPage';
import FlashcardPage from './pages/Flashcards/FlashcardPage';
import QuizTakePage from './pages/Quizzes/QuizTakePage';
import QuizResultPage from './pages/Quizzes/QuizResultPage';
import ProfilePage from './pages/Profile/ProfilePage';

const App = () => {
  const isAuthenticated = false; // Replace with actual authentication logic
  const loading = false; // Replace with actual loading state

  if (loading) {
    return (
      <div class="flex items-center justify-center h-screen">
        <div class="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-emerald-600">Loading...</div>
      </div>
    );
  }
    
  return (
      <Router>
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}  />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/documents" element={<DocumentListPage />} />
            <Route path="/documrnts/;id" element={<DocumentDetailPage />} />
            <Route path="/flashcards" element={<FlashcardsListPage />} />
            <Route path="/documents/:id/flashcards" element={<FlashcardPage />} />
            <Route path="/quizzes/;quizId" element={<QuizTakePage />} />
            <Route path="/quizzes/:quizId/results" element={<QuizResultPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>


          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
  )
}

export default App