import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItemButton,
  ListItemIcon, ListItemText, IconButton, Divider, Avatar, Chip,
  useMediaQuery, useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, ChildCare, People, Badge,
  EventAvailable, Receipt, Assessment, Settings, Logout,
  DarkMode, LightMode, ChevronLeft,
} from '@mui/icons-material';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';

const DRAWER_WIDTH = 260;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/', permission: 'dashboard' },
  { text: 'Children', icon: <ChildCare />, path: '/children', permission: 'children_view' },
  { text: 'Parents', icon: <People />, path: '/parents', permission: 'children_view' },
  { text: 'Staff', icon: <Badge />, path: '/staff', permission: 'staff_view' },
  { text: 'Attendance', icon: <EventAvailable />, path: '/attendance', permission: 'attendance_checkin' },
  { text: 'Billing', icon: <Receipt />, path: '/billing', permission: 'billing_view' },
  { text: 'Reports', icon: <Assessment />, path: '/reports', permission: 'reports_view' },
  { text: 'Settings', icon: <Settings />, path: '/settings', permission: 'settings_view' },
];

export default function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission } = useAuthStore();
  const { mode, toggleMode } = useThemeStore();

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) setDrawerOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <ChildCare sx={{ color: 'primary.main', fontSize: 32 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={700} noWrap>
            DMS
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            Daycare Management
          </Typography>
        </Box>
        {isMobile && (
          <IconButton onClick={() => setDrawerOpen(false)} size="small">
            <ChevronLeft />
          </IconButton>
        )}
      </Box>
      <Divider />

      {/* Navigation */}
      <List sx={{ flex: 1, px: 1, py: 1 }}>
        {menuItems.filter((item) => hasPermission(item.permission)).map((item) => {
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);
          return (
            <ListItemButton
              key={item.text}
              onClick={() => handleNavigation(item.path)}
              selected={isActive}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                  '&:hover': { backgroundColor: 'primary.dark' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          );
        })}
      </List>

      <Divider />

      {/* User section */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
            {user?.displayName?.charAt(0) || 'U'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {user?.displayName}
            </Typography>
            <Chip label={user?.role} size="small" variant="outlined" sx={{ height: 20, fontSize: 10 }} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={toggleMode} title="Toggle dark mode">
            {mode === 'dark' ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
          </IconButton>
          <IconButton size="small" onClick={handleLogout} title="Logout" color="error">
            <Logout fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile AppBar */}
      {isMobile && (
        <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton color="inherit" edge="start" onClick={() => setDrawerOpen(true)} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
            <ChildCare sx={{ mr: 1 }} />
            <Typography variant="h6" noWrap>DMS</Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: isMobile ? 8 : 0,
          minWidth: 0,
          overflow: 'auto',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
