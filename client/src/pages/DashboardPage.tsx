import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid2 as Grid, Card, CardContent, Typography, Chip, LinearProgress,
  List, ListItem, ListItemText, Divider, Alert, Button, IconButton, Tooltip,
} from '@mui/material';
import {
  ChildCare, Badge, CheckCircle, Warning, AttachMoney, TrendingUp,
  Refresh, PersonAdd, Receipt, EventNote, Assessment, Groups,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import api from '../lib/api';

interface DashboardData {
  children: { total: number; checkedIn: number };
  staff: { total: number; clockedIn: number };
  compliance: { totalPoints: number; caregiversNeeded: number; caregiversPresent: number; isCompliant: boolean };
  billing: { totalBilled: number; totalCollected: number; totalOutstanding: number; invoiceCount: number };
  recentActivity: any[];
  upcomingExpirations: any[];
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchDashboard = useCallback(() => {
    api.get('/reports/dashboard')
      .then((res) => { setData(res.data); setLastRefresh(new Date()); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchDashboard();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchDashboard, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  if (loading && !data) return <LinearProgress />;
  if (!data) return <Alert severity="error">Failed to load dashboard</Alert>;

  const statCards = [
    {
      label: 'Children Present',
      value: `${data.children.checkedIn} / ${data.children.total}`,
      icon: <ChildCare sx={{ fontSize: 40, color: isDark ? '#64B5F6' : '#1565C0' }} />,
      color: isDark ? 'rgba(21, 101, 192, 0.15)' : '#E3F2FD',
      onClick: () => navigate('/attendance'),
    },
    {
      label: 'Staff On Duty',
      value: `${data.staff.clockedIn} / ${data.staff.total}`,
      icon: <Badge sx={{ fontSize: 40, color: isDark ? '#81C784' : '#2E7D32' }} />,
      color: isDark ? 'rgba(46, 125, 50, 0.15)' : '#E8F5E9',
      onClick: () => navigate('/attendance'),
    },
    {
      label: 'Compliance Status',
      value: data.compliance.isCompliant ? 'Compliant' : 'Non-Compliant',
      icon: data.compliance.isCompliant
        ? <CheckCircle sx={{ fontSize: 40, color: isDark ? '#81C784' : '#2E7D32' }} />
        : <Warning sx={{ fontSize: 40, color: isDark ? '#FFB74D' : '#E65100' }} />,
      color: data.compliance.isCompliant
        ? (isDark ? 'rgba(46, 125, 50, 0.15)' : '#E8F5E9')
        : (isDark ? 'rgba(230, 81, 0, 0.15)' : '#FFF3E0'),
      onClick: () => navigate('/reports'),
    },
    {
      label: 'Monthly Revenue',
      value: `$${(data.billing.totalCollected || 0).toLocaleString()}`,
      icon: <AttachMoney sx={{ fontSize: 40, color: isDark ? '#CE93D8' : '#6A1B9A' }} />,
      color: isDark ? 'rgba(106, 27, 154, 0.15)' : '#F3E5F5',
      onClick: () => navigate('/billing'),
    },
  ];

  const quickActions = [
    { label: 'Attendance', icon: <EventNote />, path: '/attendance', color: isDark ? '#64B5F6' : '#1565C0' },
    { label: 'Children', icon: <ChildCare />, path: '/children', color: isDark ? '#4DB6AC' : '#00897B' },
    { label: 'Staff', icon: <Groups />, path: '/staff', color: isDark ? '#81C784' : '#2E7D32' },
    { label: 'Billing', icon: <Receipt />, path: '/billing', color: isDark ? '#CE93D8' : '#6A1B9A' },
    { label: 'Parents', icon: <PersonAdd />, path: '/parents', color: isDark ? '#FFB74D' : '#E65100' },
    { label: 'Reports', icon: <Assessment />, path: '/reports', color: isDark ? '#64B5F6' : '#1565C0' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ flex: 1 }}>Dashboard</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
          Last updated: {lastRefresh.toLocaleTimeString()}
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchDashboard} size="small"><Refresh /></IconButton>
        </Tooltip>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statCards.map((card) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.label}>
            <Card sx={{ backgroundColor: card.color, cursor: 'pointer', '&:hover': { boxShadow: 4 }, transition: 'box-shadow 0.2s' }}
              onClick={card.onClick}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {card.icon}
                <Box>
                  <Typography variant="body2" color="text.secondary">{card.label}</Typography>
                  <Typography variant="h5" fontWeight={700}>{card.value}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>Quick Actions</Typography>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {quickActions.map((action) => (
              <Button key={action.label} variant="outlined" startIcon={action.icon}
                onClick={() => navigate(action.path)}
                sx={{ borderColor: action.color, color: action.color, '&:hover': { borderColor: action.color, backgroundColor: `${action.color}10` } }}>
                {action.label}
              </Button>
            ))}
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Virginia Points */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Virginia Point System
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Chip label={`Points: ${data.compliance.totalPoints}`} color="primary" />
                <Chip label={`Staff Needed: ${data.compliance.caregiversNeeded}`} color="secondary" />
                <Chip label={`Staff Present: ${data.compliance.caregiversPresent}`} variant="outlined" />
              </Box>
              {!data.compliance.isCompliant && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  Need {data.compliance.caregiversNeeded - data.compliance.caregiversPresent} more staff for compliance!
                </Alert>
              )}
              {data.compliance.isCompliant && data.compliance.totalPoints > 0 && (
                <Alert severity="success" sx={{ mt: 1 }}>
                  Staffing ratios are compliant with Virginia regulations.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Billing Summary */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                <TrendingUp sx={{ verticalAlign: 'middle', mr: 1 }} />
                Billing Summary (This Month)
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Billed</Typography>
                  <Typography variant="h6">${(data.billing.totalBilled || 0).toLocaleString()}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Collected</Typography>
                  <Typography variant="h6" color="success.main">
                    ${(data.billing.totalCollected || 0).toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Outstanding</Typography>
                  <Typography variant="h6" color="error.main">
                    ${(data.billing.totalOutstanding || 0).toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Invoices</Typography>
                  <Typography variant="h6">{data.billing.invoiceCount || 0}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Expirations */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Upcoming Expirations</Typography>
              {data.upcomingExpirations.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No upcoming expirations</Typography>
              ) : (
                <List dense>
                  {data.upcomingExpirations.map((item: any, idx: number) => (
                    <div key={idx}>
                      <ListItem>
                        <ListItemText
                          primary={`${item.first_name} ${item.last_name}`}
                          secondary={`${item.cert_name || item.check_type || 'Document'} - Expires: ${item.expiry_date}`}
                        />
                        <Chip label={item.doc_type} size="small" color="warning" />
                      </ListItem>
                      {idx < data.upcomingExpirations.length - 1 && <Divider />}
                    </div>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Recent Activity</Typography>
              {data.recentActivity.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No recent activity</Typography>
              ) : (
                <List dense>
                  {data.recentActivity.slice(0, 5).map((item: any, idx: number) => (
                    <div key={idx}>
                      <ListItem>
                        <ListItemText
                          primary={`${item.action} - ${item.entity_type}`}
                          secondary={item.timestamp}
                        />
                      </ListItem>
                      {idx < Math.min(data.recentActivity.length, 5) - 1 && <Divider />}
                    </div>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
