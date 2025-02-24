import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import About from './pages/About';
import Report from './pages/Report';
import HousingStock from './pages/HousingStock';
import Homepage from './pages/Homepage';

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/housing-profile" element={<Dashboard />} />
          <Route path="/about" element={<About />} />
          <Route path="/report/:provinceId" element={<Report />} />
          <Route path="/housing-stock" element={<HousingStock />} />
        </Routes>
      </main>
      <footer className="bg-gray-800 text-white p-4 text-center">
        <p>© 2025 Thailand Housing Data Portal</p>
      </footer>
    </div>
  );
}

export default App;