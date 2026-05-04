import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import RequireAuth from './components/RequireAuth';
import App from './pages/App';
import UploadFilePage from './pages/UploadFilePage';
import ResultsPage from './pages/ResultsPage';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<App />} /> 
          <Route
            path="/uploadfile"
            element={
              <RequireAuth>
                <UploadFilePage />
              </RequireAuth>
            }
          />
          <Route
            path="/results"
            element={
              <RequireAuth>
                <ResultsPage />
              </RequireAuth>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  </React.StrictMode>
);
