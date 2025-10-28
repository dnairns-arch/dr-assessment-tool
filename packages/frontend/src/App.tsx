import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider } from './contexts/AuthContext';
import { BrandingProvider } from './contexts/BrandingContext';
import { PrivateRoute } from './components/PrivateRoute';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AssessmentsPage from './pages/assessments/AssessmentsPage';
import CreateAssessmentPage from './pages/assessments/CreateAssessmentPage';
import AssessmentDetailPage from './pages/assessments/AssessmentDetailPage';
import HighLevelAssessmentPage from './pages/assessments/HighLevelAssessmentPage';
import DeepDivePage from './pages/assessments/DeepDivePage';
import DependencyGraphPage from './pages/assessments/DependencyGraphPage';
import AnalysisPage from './pages/analysis/AnalysisPage';
import RisksPage from './pages/analysis/RisksPage';
import RecommendationsPage from './pages/analysis/RecommendationsPage';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000 // 30 seconds
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrandingProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Private routes */}
              <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
              <Route path="/assessments" element={<PrivateRoute><AssessmentsPage /></PrivateRoute>} />
              <Route path="/assessments/new" element={<PrivateRoute><CreateAssessmentPage /></PrivateRoute>} />
              <Route path="/assessments/:id" element={<PrivateRoute><AssessmentDetailPage /></PrivateRoute>} />
              <Route path="/assessments/:id/high-level" element={<PrivateRoute><HighLevelAssessmentPage /></PrivateRoute>} />
              <Route path="/assessments/:id/deep-dive" element={<PrivateRoute><DeepDivePage /></PrivateRoute>} />
              <Route path="/assessments/:id/dependencies" element={<PrivateRoute><DependencyGraphPage /></PrivateRoute>} />
              <Route path="/assessments/:id/analysis" element={<PrivateRoute><AnalysisPage /></PrivateRoute>} />
              <Route path="/assessments/:id/risks" element={<PrivateRoute><RisksPage /></PrivateRoute>} />
              <Route path="/assessments/:id/recommendations" element={<PrivateRoute><RecommendationsPage /></PrivateRoute>} />

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </BrandingProvider>
    </QueryClientProvider>
  );
}

export default App;
