import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/context/AuthContext';
import { Toaster } from './components/ui/sonner';
import HomePage from './pages/HomePage';
import CompanyLoginPage from './pages/company/CompanyLoginPage';
import CompanyDashboardPage from './pages/company/CompanyDashboardPage';
import CompanyOrdersPage from './pages/company/CompanyOrdersPage';
import CompanyOrderDetailsPage from './pages/company/CompanyOrderDetailsPage';
import CreateOrderPage from './pages/company/CreateOrderPage';
import ManageJobPage from './pages/company/ManageJobPage';
import ManageVendorsPage from './pages/company/ManageVendorsPage';
import CompanyOrderStatusPage from './pages/company/CompanyOrderStatusPage';
import CompanyPendingWorkPage from './pages/company/CompanyPendingWorkPage';
import CompanyCompletedWorkPage from './pages/company/CompanyCompletedWorkPage';
import CompanyLayout from './layouts/CompanyLayout';
import VendorLayout from './layouts/VendorLayout';
import VendorLoginPage from './pages/vendor/VendorLoginPage';
import VendorDashboardPage from './pages/vendor/VendorDashboardPage';
import VendorOrdersPage from './pages/vendor/VendorOrdersPage';
import VendorOrderProgressPage from './pages/vendor/VendorOrderProgressPage';
import VendorReassignedTasksPage from './pages/vendor/VendorReassignedTasksPage';

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/company/login" element={<CompanyLoginPage />} />
          <Route path="/vendor/login" element={<VendorLoginPage />} />

          <Route element={<CompanyLayout />}>
            <Route path="/company/dashboard" element={<CompanyDashboardPage />} />
            <Route path="/company/orders" element={<CompanyOrdersPage />} />
            <Route path="/company/orders/create" element={<CreateOrderPage />} />
            <Route path="/company/orders/:id" element={<CompanyOrderDetailsPage />} />
            <Route path="/company/manage-job" element={<ManageJobPage />} />
            <Route path="/company/manage-vendors" element={<ManageVendorsPage />} />
            <Route path="/company/order-status" element={<CompanyOrderStatusPage />} />
            <Route path="/company/pending-work" element={<CompanyPendingWorkPage />} />
            <Route path="/company/completed-work" element={<CompanyCompletedWorkPage />} />
          </Route>

          <Route element={<VendorLayout />}>
            <Route path="/vendor/dashboard" element={<VendorDashboardPage />} />
            <Route path="/vendor/orders" element={<VendorOrdersPage />} />
            <Route path="/vendor/reassigned-tasks" element={<VendorReassignedTasksPage />} />
            <Route path="/vendor/order-progress" element={<VendorOrderProgressPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
// Force Vite reload for the new route
