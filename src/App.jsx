import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import About from './pages/About';
import Report from './pages/Report';
import HousingStock from './pages/HousingStock';
import Homepage from './pages/Homepage';
import OrganizationPage from './pages/OrganizationPage';
import HousingDeliverySystem from './pages/HousingDeliverySystem';
import ApartmentSupply from './pages/ApartmentSupply';

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
          <Route path="/apartment-supply" element={<ApartmentSupply />} />
          <Route path="/organization/:orgId" element={<OrganizationPage />} />
          <Route path="/housing-delivery-system" element={<HousingDeliverySystem />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;