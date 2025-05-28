import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Box,
  Tab,
  Tabs,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Chip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  AppBar,
  Toolbar,
  Badge,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Block as BlockIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Shield as ShieldIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface BlockedIP {
  ip: string;
  reason: string;
  timestamp: string;
  duration: number;
}

interface AttackLog {
  id: string;
  ip: string;
  attackType: string;
  timestamp: string;
  details: string;
}

interface WafStats {
  totalAttacks: number;
  attackTypes: Record<string, number>;
  blockedIPs: number;
  whitelistedIPs: number;
  persistentBlockedIPs: number;
}

interface SystemHealth {
  status: string;
  timestamp: string;
  uptime: number;
}

const AdminPanel: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [attackLogs, setAttackLogs] = useState<AttackLog[]>([]);
  const [wafStats, setWafStats] = useState<WafStats | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [newIP, setNewIP] = useState('');
  const [newReason, setNewReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, ip: '', action: '' });

  const API_BASE = 'http://localhost:3003/api/waf';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, blockedRes, logsRes, healthRes] = await Promise.all([
        fetch(`${API_BASE}/stats`),
        fetch(`${API_BASE}/blocked-ips`),
        fetch(`${API_BASE}/attack-logs`),
        fetch(`${API_BASE}/health`)
      ]);

      if (statsRes.ok) setWafStats(await statsRes.json());
      if (blockedRes.ok) setBlockedIPs(await blockedRes.json());
      if (logsRes.ok) setAttackLogs(await logsRes.json());
      if (healthRes.ok) setSystemHealth(await healthRes.json());
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      showSnackbar('Veri yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(fetchData, 30000); // 30 saniyede bir güncelle
    return () => clearInterval(interval);
  }, [fetchData]);

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleBlockIP = async () => {
    if (!newIP.trim()) {
      showSnackbar('IP adresi gerekli', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/block-ip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: newIP.trim(), reason: newReason.trim() }),
      });

      if (response.ok) {
        setNewIP('');
        setNewReason('');
        fetchData();
        showSnackbar('IP başarıyla engellendi', 'success');
      } else {
        const error = await response.json();
        showSnackbar(error.error || 'IP engellenemedi', 'error');
      }
    } catch (error) {
      showSnackbar('Bağlantı hatası', 'error');
    }
  };

  const handleUnblockIP = async (ip: string) => {
    try {
      const response = await fetch(`${API_BASE}/unblock/${ip}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchData();
        showSnackbar('IP engeli kaldırıldı', 'success');
      } else {
        showSnackbar('IP engeli kaldırılamadı', 'error');
      }
    } catch (error) {
      showSnackbar('Bağlantı hatası', 'error');
    }
    setConfirmDialog({ open: false, ip: '', action: '' });
  };

  const getAttackTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'SQL_INJECTION': '#f44336',
      'XSS': '#ff9800',
      'COMMAND_INJECTION': '#e91e63',
      'FILE_INCLUSION': '#9c27b0',
    };
    return colors[type] || '#757575';
  };

  const getAttackTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'SQL_INJECTION': 'SQL Enjeksiyonu',
      'XSS': 'XSS Saldırısı',
      'COMMAND_INJECTION': 'Komut Enjeksiyonu',
      'FILE_INCLUSION': 'Dosya Dahil Etme',
    };
    return labels[type] || type;
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}s ${minutes}d`;
  };

  const pieData = wafStats ? Object.entries(wafStats.attackTypes).map(([type, count]) => ({
    name: getAttackTypeLabel(type),
    value: count,
    color: getAttackTypeColor(type)
  })) : [];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ mb: 3 }}>
        <Toolbar>
          <ShieldIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            WAF Yönetim Paneli
          </Typography>
          <Badge badgeContent={blockedIPs.length} color="error" sx={{ mr: 2 }}>
            <BlockIcon />
          </Badge>
          <Button
            color="inherit"
            startIcon={<RefreshIcon />}
            onClick={fetchData}
            disabled={loading}
          >
            Yenile
          </Button>
        </Toolbar>
        {loading && <LinearProgress />}
      </AppBar>

      <Container maxWidth="xl">
        {/* Sistem Durumu Kartları */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
          <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SecurityIcon color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Toplam Saldırı
                    </Typography>
                    <Typography variant="h4">
                      {wafStats?.totalAttacks || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <BlockIcon color="error" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Engellenen IP
                    </Typography>
                    <Typography variant="h4">
                      {wafStats?.blockedIPs || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <WarningIcon color="warning" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Sistem Durumu
                    </Typography>
                    <Chip 
                      label={systemHealth?.status === 'active' ? 'Aktif' : 'Pasif'}
                      color={systemHealth?.status === 'active' ? 'success' : 'error'}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon color="success" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Çalışma Süresi
                    </Typography>
                    <Typography variant="h6">
                      {systemHealth ? formatUptime(systemHealth.uptime) : '0s 0d'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Tab Menüsü */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab icon={<TimelineIcon />} label="Genel Bakış" />
            <Tab icon={<BlockIcon />} label="Engellenen IP'ler" />
            <Tab icon={<VisibilityIcon />} label="Saldırı Logları" />
          </Tabs>
        </Paper>

        {/* Genel Bakış Sekmesi */}
        {tabValue === 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Saldırı Türleri Dağılımı
                </Typography>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
                    Henüz saldırı verisi yok
                  </Typography>
                )}
              </Paper>
            </Box>

            <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Son Saldırılar
                </Typography>
                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {attackLogs.slice(0, 5).map((log) => (
                    <Box key={log.id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip
                          label={getAttackTypeLabel(log.attackType)}
                          size="small"
                          sx={{ bgcolor: getAttackTypeColor(log.attackType), color: 'white' }}
                        />
                        <Typography variant="caption" color="textSecondary">
                          {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: tr })}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>IP:</strong> {log.ip}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {log.details}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Box>
          </Box>
        )}

        {/* Engellenen IP'ler Sekmesi */}
        {tabValue === 1 && (
          <Paper sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Yeni IP Engelle
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                  <TextField
                    fullWidth
                    label="IP Adresi"
                    value={newIP}
                    onChange={(e) => setNewIP(e.target.value)}
                    placeholder="192.168.1.1"
                  />
                </Box>
                <Box sx={{ flex: '2 1 300px', minWidth: 300 }}>
                  <TextField
                    fullWidth
                    label="Sebep"
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    placeholder="Manuel engelleme sebebi"
                  />
                </Box>
                <Box sx={{ flex: '0 0 auto' }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleBlockIP}
                    disabled={loading}
                    sx={{ minWidth: 120 }}
                  >
                    Engelle
                  </Button>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Typography variant="h6" gutterBottom>
              Engellenen IP Listesi ({blockedIPs.length})
            </Typography>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>IP Adresi</strong></TableCell>
                    <TableCell><strong>Sebep</strong></TableCell>
                    <TableCell><strong>Engellenme Zamanı</strong></TableCell>
                    <TableCell align="center"><strong>İşlemler</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {blockedIPs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography color="textSecondary">
                          Henüz engellenen IP yok
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    blockedIPs.map((ip) => (
                      <TableRow key={ip.ip} hover>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {ip.ip}
                          </Typography>
                        </TableCell>
                        <TableCell>{ip.reason}</TableCell>
                        <TableCell>
                          {format(new Date(ip.timestamp), 'dd.MM.yyyy HH:mm', { locale: tr })}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Engeli Kaldır">
                            <IconButton
                              onClick={() => setConfirmDialog({ open: true, ip: ip.ip, action: 'unblock' })}
                              color="error"
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Saldırı Logları Sekmesi */}
        {tabValue === 2 && (
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Saldırı Logları ({attackLogs.length})
              </Typography>
              <Button
                startIcon={<RefreshIcon />}
                onClick={fetchData}
                variant="outlined"
                disabled={loading}
              >
                Yenile
              </Button>
            </Box>

            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Zaman</strong></TableCell>
                    <TableCell><strong>IP Adresi</strong></TableCell>
                    <TableCell><strong>Saldırı Türü</strong></TableCell>
                    <TableCell><strong>Detaylar</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attackLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography color="textSecondary">
                          Henüz saldırı logu yok
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    attackLogs.map((log) => (
                      <TableRow key={log.id} hover>
                        <TableCell>
                          <Typography variant="body2">
                            {format(new Date(log.timestamp), 'dd.MM.yyyy HH:mm:ss', { locale: tr })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {log.ip}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getAttackTypeLabel(log.attackType)}
                            size="small"
                            sx={{ 
                              bgcolor: getAttackTypeColor(log.attackType), 
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 400, wordBreak: 'break-word' }}>
                            {log.details}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Onay Dialogu */}
        <Dialog
          open={confirmDialog.open}
          onClose={() => setConfirmDialog({ open: false, ip: '', action: '' })}
        >
          <DialogTitle>IP Engelini Kaldır</DialogTitle>
          <DialogContent>
            <Typography>
              <strong>{confirmDialog.ip}</strong> adresinin engelini kaldırmak istediğinizden emin misiniz?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialog({ open: false, ip: '', action: '' })}>
              İptal
            </Button>
            <Button 
              onClick={() => handleUnblockIP(confirmDialog.ip)} 
              color="error" 
              variant="contained"
            >
              Engeli Kaldır
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default AdminPanel;