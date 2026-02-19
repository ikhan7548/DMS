import { useEffect, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';

// Layout
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ChildrenPage from './pages/ChildrenPage';
import ChildDetailPage from './pages/ChildDetailPage';
import StaffPage from './pages/StaffPage';
import StaffDetailPage from './pages/StaffDetailPage';
import ParentsPage from './pages/ParentsPage';
import AttendancePage from './pages/AttendancePage';
import AttendanceHistoryPage from './pages/AttendanceHistoryPage';
import BillingDashboardPage from './pages/BillingDashboardPage';
import BillingPage from './pages/BillingPage';
import InvoiceDetailPage from './pages/InvoiceDetailPage';
import FeeConfigPage from './pages/FeeConfigPage';
import FamilyAccountPage from './pages/FamilyAccountPage';
import AgingReportPage from './pages/AgingReportPage';
import PaymentMethodsPage from './pages/PaymentMethodsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  const { isAuthenticated, isLoading, checkSession } = useAuthStore();
  const { mode, primaryColor } = useThemeStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: primaryColor },
          secondary: { main: '#FF6F00' },
          background: mode === 'dark'
            ? { default: '#121212', paper: '#1e1e1e' }
            : { default: '#f5f5f5', paper: '#ffffff' },
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h4: { fontWeight: 600 },
          h5: { fontWeight: 600 },
          h6: { fontWeight: 600 },
        },
        shape: { borderRadius: 8 },
        components: {
          MuiCard: {
            defaultProps: { elevation: 0 },
            styleOverrides: {
              root: { border: '1px solid', borderColor: mode === 'dark' ? '#333' : '#e0e0e0' },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: { textTransform: 'none', fontWeight: 500 },
            },
          },
        },
      }),
    [mode, primaryColor]
  );

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div>Loading...</div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<DashboardPage />} />
          <Route path="children" element={<ChildrenPage />} />
          <Route path="children/:id" element={<ChildDetailPage />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="staff/:id" element={<StaffDetailPage />} />
          <Route path="parents" element={<ParentsPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="attendance/history" element={<AttendanceHistoryPage />} />
          <Route path="billing" element={<BillingDashboardPage />} />
          <Route path="billing/invoices" element={<BillingPage />} />
          <Route path="billing/payments" element={<BillingPage />} />
          <Route path="billing/invoice/:id" element={<InvoiceDetailPage />} />
          <Route path="billing/fees" element={<FeeConfigPage />} />
          <Route path="billing/families" element={<FamilyAccountPage />} />
          <Route path="billing/families/:familyId" element={<FamilyAccountPage />} />
          <Route path="billing/aging" element={<AgingReportPage />} />
          <Route path="billing/payment-methods" element={<PaymentMethodsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;
