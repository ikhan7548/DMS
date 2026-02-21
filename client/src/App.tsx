import { useEffect, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box, Typography, Alert, Button } from '@mui/material';
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

// Permission guard component
function PermissionGuard({ permission, children }: { permission: string; children: React.ReactNode }) {
  const { hasPermission } = useAuthStore();
  if (!hasPermission(permission)) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2, maxWidth: 500, mx: 'auto' }}>
          You do not have permission to access this page.
        </Alert>
        <Button variant="contained" href="/">Go to Dashboard</Button>
      </Box>
    );
  }
  return <>{children}</>;
}

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
          <Route path="children" element={<PermissionGuard permission="children_view"><ChildrenPage /></PermissionGuard>} />
          <Route path="children/:id" element={<PermissionGuard permission="children_view"><ChildDetailPage /></PermissionGuard>} />
          <Route path="staff" element={<PermissionGuard permission="staff_view"><StaffPage /></PermissionGuard>} />
          <Route path="staff/:id" element={<PermissionGuard permission="staff_view"><StaffDetailPage /></PermissionGuard>} />
          <Route path="parents" element={<PermissionGuard permission="children_view"><ParentsPage /></PermissionGuard>} />
          <Route path="attendance" element={<PermissionGuard permission="attendance_checkin"><AttendancePage /></PermissionGuard>} />
          <Route path="attendance/history" element={<PermissionGuard permission="attendance_history"><AttendanceHistoryPage /></PermissionGuard>} />
          <Route path="billing" element={<PermissionGuard permission="billing_view"><BillingDashboardPage /></PermissionGuard>} />
          <Route path="billing/invoices" element={<PermissionGuard permission="billing_view"><BillingPage /></PermissionGuard>} />
          <Route path="billing/payments" element={<PermissionGuard permission="billing_view"><BillingPage /></PermissionGuard>} />
          <Route path="billing/invoice/:id" element={<PermissionGuard permission="billing_view"><InvoiceDetailPage /></PermissionGuard>} />
          <Route path="billing/fees" element={<PermissionGuard permission="billing_manage"><FeeConfigPage /></PermissionGuard>} />
          <Route path="billing/families" element={<PermissionGuard permission="billing_view"><FamilyAccountPage /></PermissionGuard>} />
          <Route path="billing/families/:familyId" element={<PermissionGuard permission="billing_view"><FamilyAccountPage /></PermissionGuard>} />
          <Route path="billing/aging" element={<PermissionGuard permission="billing_view"><AgingReportPage /></PermissionGuard>} />
          <Route path="billing/payment-methods" element={<PermissionGuard permission="billing_manage"><PaymentMethodsPage /></PermissionGuard>} />
          <Route path="reports" element={<PermissionGuard permission="reports_view"><ReportsPage /></PermissionGuard>} />
          <Route path="settings" element={<PermissionGuard permission="settings_view"><SettingsPage /></PermissionGuard>} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;
