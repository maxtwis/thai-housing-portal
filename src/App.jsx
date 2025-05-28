import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import About from './pages/About';
import Report from './pages/Report';
import HousingStock from './pages/HousingStock';
import HousingDeliverySystem from './pages/HousingDeliverySystem';
import Homepage from './pages/Homepage';
import OrganizationPage from './pages/OrganizationPage';

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data stays fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Data stays in cache for 10 minutes
      cacheTime: 10 * 60 * 1000,
      // Don't refetch when window regains focus
      refetchOnWindowFocus: false,
      // Retry failed requests 2 times
      retry: 2,
      // Retry after these delays: 1s, 2s
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/housing-profile" element={<Dashboard />} />
            <Route path="/about" element={<About />} />
            <Route path="/report/:provinceId" element={<Report />} />
            <Route path="/housing-stock" element={<HousingStock />} />
            <Route path="/housing-delivery-system" element={<HousingDeliverySystem />} />
            <Route path="/organization/:orgId" element={<OrganizationPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
      {/* React Query DevTools - shows in development */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;