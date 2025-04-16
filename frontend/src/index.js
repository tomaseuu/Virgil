import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './pages/App';
import UploadFilePage from './pages/UploadFilePage';
import ResultsPage from './pages/ResultsPage';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} /> 
        <Route path="/uploadfile" element={<UploadFilePage />} />
        <Route path="/results" element={<ResultsPage />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
