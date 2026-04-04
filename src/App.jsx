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
import CompanyOrderStatusPage from './pages/company/CompanyOrderStatusPage';
import CompanyPendingWorkPage from './pages/company/CompanyPendingWorkPage';
import CompanyCompletedWorkPage from './pages/company/CompanyCompletedWorkPage';
import CompanyBillingPage from './pages/company/CompanyBillingPage';
import CompanyLayout from './layouts/CompanyLayout';
import VendorLayout from './layouts/VendorLayout';
import VendorLoginPage from './pages/vendor/VendorLoginPage';
import VendorDashboardPage from './pages/vendor/VendorDashboardPage';
import VendorOrdersPage from './pages/vendor/VendorOrdersPage';
import VendorOrderProgressPage from './pages/vendor/VendorOrderProgressPage';
import VendorReassignedTasksPage from './pages/vendor/VendorReassignedTasksPage';

// Super Admin
import SuperAdminLayout from './layouts/SuperAdminLayout';
import SuperAdminLoginPage from './pages/superadmin/SuperAdminLoginPage';
import SuperAdminDashboardPage from './pages/superadmin/SuperAdminDashboardPage';
import SuperAdminOrganizationsPage from './pages/superadmin/SuperAdminOrganizationsPage';
import SuperAdminVendorsPage from './pages/superadmin/SuperAdminVendorsPage';

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/company/login" element={<CompanyLoginPage />} />
          <Route path="/vendor/login" element={<VendorLoginPage />} />
          <Route path="/superadmin/login" element={<SuperAdminLoginPage />} />

          <Route element={<CompanyLayout />}>
            <Route path="/company/dashboard" element={<CompanyDashboardPage />} />
            <Route path="/company/orders" element={<CompanyOrdersPage />} />
            <Route path="/company/orders/create" element={<CreateOrderPage />} />
            <Route path="/company/orders/:id" element={<CompanyOrderDetailsPage />} />
            <Route path="/company/manage-job" element={<ManageJobPage />} />
            <Route path="/company/order-status" element={<CompanyOrderStatusPage />} />
            <Route path="/company/pending-work" element={<CompanyPendingWorkPage />} />
            <Route path="/company/completed-work" element={<CompanyCompletedWorkPage />} />
            <Route path="/company/billing" element={<CompanyBillingPage />} />
          </Route>

          <Route element={<VendorLayout />}>
            <Route path="/vendor/dashboard" element={<VendorDashboardPage />} />
            <Route path="/vendor/orders" element={<VendorOrdersPage />} />
            <Route path="/vendor/reassigned-tasks" element={<VendorReassignedTasksPage />} />
            <Route path="/vendor/order-progress" element={<VendorOrderProgressPage />} />
          </Route>

          <Route element={<SuperAdminLayout />}>
            <Route path="/superadmin/dashboard" element={<SuperAdminDashboardPage />} />
            <Route path="/superadmin/organizations" element={<SuperAdminOrganizationsPage />} />
            <Route path="/superadmin/vendors" element={<SuperAdminVendorsPage />} />
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
