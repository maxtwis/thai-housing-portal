import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import your existing components
import Homepage from './pages/Homepage';
import Dashboard from './pages/Dashboard';
import HousingStock from './pages/HousingStock';
import HousingDeliverySystem from './pages/HousingDeliverySystem';
import About from './pages/About';

// Import the debug version of Apartment Supply
import ApartmentSupply from './pages/ApartmentSupply';

// Import your layout components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/housing-profile" element={<Dashboard />} />
            <Route path="/housing-stock" element={<HousingStock />} />
            <Route path="/apartment-supply" element={<ApartmentSupply />} />
            <Route path="/housing-delivery-system" element={<HousingDeliverySystem />} />
            <Route path="/about" element={<About />} />
            
            {/* Catch-all route for debugging */}
            <Route path="*" element={
              <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-red-600">Route Not Found</h1>
                <p className="mt-2">Current path: {window.location.pathname}</p>
                <p className="mt-2">Available routes:</p>
                <ul className="mt-4 space-y-1">
                  <li>/ - Homepage</li>
                  <li>/housing-profile - Housing Profile</li>
                  <li>/housing-stock - Housing Stock</li>
                  <li>/apartment-supply - Apartment Supply</li>
                  <li>/housing-delivery-system - Housing Delivery System</li>
                  <li>/about - About</li>
                </ul>
              </div>
            } />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
}

export default App;