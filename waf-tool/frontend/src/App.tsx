import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Alert,
  Snackbar,
  Badge,
  Fade,
  Zoom,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import SecurityIcon from '@mui/icons-material/Security';
import BlockIcon from '@mui/icons-material/Block';
import WarningIcon from '@mui/icons-material/Warning';
import DeleteIcon from '@mui/icons-material/Delete';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HelpIcon from '@mui/icons-material/Help';
import ShieldIcon from '@mui/icons-material/Shield';
import SpeedIcon from '@mui/icons-material/Speed';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import RealtimeIcon from '@mui/icons-material/Timeline';
import { io, Socket } from 'socket.io-client';

interface WafStats {
  totalAttacks: number;
  attackTypes: Record<string, number>;
  blockedIPs: number;
  whitelistedIPs: number;
  persistentBlockedIPs: number;
}

interface BlockedIP {
  ip: string;
  blockedAt: string;
  reason: string;
}

interface AttackLog {
  timestamp: string;
  ip: string;
  message: string;
}

interface RealTimeAttack {
  ip: string;
  attackType: string;
  count: number;
  threshold: number;
  timestamp: string;
  method: string;
  url: string;
  userAgent: string;
}

interface RealTimeIPBlock {
  ip: string;
  attackType: string;
  timestamp: string;
  reason: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Dil çevirileri
const translations = {
  tr: {
    title: "WAF Yönetim Paneli",
    help: "Yardım",
    loading: "Yükleniyor...",
    totalAttacks: "Toplam Saldırı",
    blockedIPs: "Engellenen IP",
    trustedIPs: "Güvenilir IP",
    permanentBlocks: "Kalıcı Engel",
    attackDistribution: "Saldırı Türleri Dağılımı",
    blockedIPsTable: "Engellenen IP Adresleri",
    recentAttackLogs: "Son Saldırı Logları",
    ipAddress: "IP Adresi",
    blockedTime: "Engellenme Zamanı",
    reason: "Sebep",
    actions: "İşlemler",
    unblock: "Engeli Kaldır",
    time: "Zaman",
    detail: "Detay",
    understand: "Anladım",
    realTimeAttacks: "Gerçek Zamanlı Saldırı Bildirimleri",
    recentBlocks: "Son Engellenen IP Adresleri",
    newAttackDetected: "🚨 Yeni {type} saldırısı tespit edildi! IP: {ip}",
    ipBlocked: "🔒 IP adresi engellendi: {ip}",
    dataLoadError: "Veriler yüklenirken hata oluştu",
    ipUnblocked: "{ip} adresi engelleme listesinden kaldırıldı",
    unblockError: "IP engeli kaldırılırken hata oluştu",
    helpModal: {
      title: "WAF (Web Application Firewall) Sistemi - Yardım",
      whatIsWaf: "🛡️ WAF Sistemi Nedir?",
      wafDescription: "Web Application Firewall (WAF), web uygulamalarını çeşitli siber saldırılardan koruyan gelişmiş bir güvenlik sistemidir. Bu sistem, gelen HTTP/HTTPS trafiğini analiz ederek zararlı istekleri tespit eder ve engeller.",
      features: "🎯 Temel Özellikler",
      multiAttackDetection: "Çoklu Saldırı Tespiti",
      multiAttackDesc: "SQL Injection, XSS, Command Injection, File Inclusion",
      rateLimiting: "Rate Limiting",
      rateLimitingDesc: "Dakikada 100 istek limiti ile DDoS koruması",
      ipReputation: "IP Reputation Sistemi",
      ipReputationDesc: "0-100 arası skor ile akıllı engelleme",
      adaptiveThresholds: "Adaptive Thresholds",
      adaptiveDesc: "IP reputation'a göre dinamik eşik değerleri",
      realTimeMonitoring: "Gerçek Zamanlı İzleme",
      realTimeDesc: "WebSocket ile anlık bildirimler",
      smartBlocking: "Akıllı Engelleme",
      smartBlockingDesc: "Şiddet ve reputation'a göre değişken süreler",
      attackTypes: "🔍 Saldırı Türleri ve Eşik Değerleri",
      attackType: "Saldırı Türü",
      threshold: "Eşik Değeri",
      blockDuration: "Engelleme Süresi",
      examplePattern: "Örnek Pattern",
      useCases: "🏢 Kullanım Alanları",
      webApps: "🌐 Web Uygulamaları",
      webAppsDesc: "• E-ticaret siteleri\n• Kurumsal web portalleri\n• API servisleri\n• CMS sistemleri",
      sectors: "🏦 Sektörler",
      sectorsDesc: "• Bankacılık ve finans\n• Sağlık hizmetleri\n• Eğitim kurumları\n• Devlet kurumları",
      security: "🔒 Güvenlik Senaryoları",
      securityDesc: "• OWASP Top 10 koruması\n• DDoS saldırı önleme\n• Bot trafiği filtreleme\n• Veri sızıntısı önleme",
      monitoring: "📊 İzleme ve Analiz",
      monitoringDesc: "• Güvenlik olayları analizi\n• Saldırı trendleri takibi\n• Compliance raporlama\n• Forensik inceleme",
      technicalFeatures: "⚙️ Teknik Özellikler",
      patternMatching: "🎯 Gelişmiş Pattern Matching",
      patternMatchingDesc: "Regex tabanlı saldırı tespiti ile yüksek doğruluk oranı",
      mlAlgorithm: "🧠 Makine Öğrenmesi Benzeri Algoritma",
      mlAlgorithmDesc: "IP reputation sistemi ile adaptive threshold hesaplama",
      highPerformance: "⚡ Yüksek Performans",
      highPerformanceDesc: "Asenkron işleme ile düşük gecikme süresi",
      modernUI: "📱 Modern Arayüz",
      modernUIDesc: "React + Material-UI ile responsive tasarım",
      realTimeUpdates: "🔄 Real-Time Updates",
      realTimeUpdatesDesc: "WebSocket ile anlık veri güncellemeleri",
      tip: "💡 İpucu:",
      tipDesc: "Bu WAF sistemi, modern web uygulamalarının güvenlik ihtiyaçlarını karşılamak için geliştirilmiş profesyonel bir çözümdür. Gerçek zamanlı izleme, akıllı engelleme algoritmaları ve kullanıcı dostu arayüzü ile kapsamlı güvenlik sağlar."
    }
  },
  en: {
    title: "WAF Management Panel",
    help: "Help",
    loading: "Loading...",
    totalAttacks: "Total Attacks",
    blockedIPs: "Blocked IPs",
    trustedIPs: "Trusted IPs",
    permanentBlocks: "Permanent Blocks",
    attackDistribution: "Attack Types Distribution",
    blockedIPsTable: "Blocked IP Addresses",
    recentAttackLogs: "Recent Attack Logs",
    ipAddress: "IP Address",
    blockedTime: "Blocked Time",
    reason: "Reason",
    actions: "Actions",
    unblock: "Unblock",
    time: "Time",
    detail: "Detail",
    understand: "Got it",
    realTimeAttacks: "Real-Time Attack Notifications",
    recentBlocks: "Recently Blocked IP Addresses",
    newAttackDetected: "🚨 New {type} attack detected! IP: {ip}",
    ipBlocked: "🔒 IP address blocked: {ip}",
    dataLoadError: "Error occurred while loading data",
    ipUnblocked: "{ip} address removed from blocklist",
    unblockError: "Error occurred while unblocking IP",
    helpModal: {
      title: "WAF (Web Application Firewall) System - Help",
      whatIsWaf: "🛡️ What is WAF System?",
      wafDescription: "Web Application Firewall (WAF) is an advanced security system that protects web applications from various cyber attacks. This system analyzes incoming HTTP/HTTPS traffic to detect and block malicious requests.",
      features: "🎯 Key Features",
      multiAttackDetection: "Multi-Attack Detection",
      multiAttackDesc: "SQL Injection, XSS, Command Injection, File Inclusion",
      rateLimiting: "Rate Limiting",
      rateLimitingDesc: "DDoS protection with 100 requests per minute limit",
      ipReputation: "IP Reputation System",
      ipReputationDesc: "Smart blocking with 0-100 score range",
      adaptiveThresholds: "Adaptive Thresholds",
      adaptiveDesc: "Dynamic threshold values based on IP reputation",
      realTimeMonitoring: "Real-Time Monitoring",
      realTimeDesc: "Instant notifications via WebSocket",
      smartBlocking: "Smart Blocking",
      smartBlockingDesc: "Variable durations based on severity and reputation",
      attackTypes: "🔍 Attack Types and Threshold Values",
      attackType: "Attack Type",
      threshold: "Threshold Value",
      blockDuration: "Block Duration",
      examplePattern: "Example Pattern",
      useCases: "🏢 Use Cases",
      webApps: "🌐 Web Applications",
      webAppsDesc: "• E-commerce websites\n• Corporate web portals\n• API services\n• CMS systems",
      sectors: "🏦 Sectors",
      sectorsDesc: "• Banking and finance\n• Healthcare services\n• Educational institutions\n• Government agencies",
      security: "🔒 Security Scenarios",
      securityDesc: "• OWASP Top 10 protection\n• DDoS attack prevention\n• Bot traffic filtering\n• Data breach prevention",
      monitoring: "📊 Monitoring and Analysis",
      monitoringDesc: "• Security incident analysis\n• Attack trend tracking\n• Compliance reporting\n• Forensic investigation",
      technicalFeatures: "⚙️ Technical Features",
      patternMatching: "🎯 Advanced Pattern Matching",
      patternMatchingDesc: "High accuracy with regex-based attack detection",
      mlAlgorithm: "🧠 Machine Learning-like Algorithm",
      mlAlgorithmDesc: "Adaptive threshold calculation with IP reputation system",
      highPerformance: "⚡ High Performance",
      highPerformanceDesc: "Low latency with asynchronous processing",
      modernUI: "📱 Modern Interface",
      modernUIDesc: "Responsive design with React + Material-UI",
      realTimeUpdates: "🔄 Real-Time Updates",
      realTimeUpdatesDesc: "Instant data updates via WebSocket",
      tip: "💡 Tip:",
      tipDesc: "This WAF system is a professional solution developed to meet the security needs of modern web applications. It provides comprehensive security with real-time monitoring, smart blocking algorithms, and user-friendly interface."
    }
  }
};

// TitanWAF Logo Component
const TitanWAFLogo: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="15" fill="url(#bg)" stroke="#1565c0" strokeWidth="1"/>
    <path d="M16 4 L26 8 L26 18 Q26 22 22 25 L16 28 L10 25 Q6 22 6 18 L6 8 Z" 
          fill="url(#shield)" stroke="#1a237e" strokeWidth="0.5"/>
    <g transform="translate(16, 16)">
      <rect x="-6" y="-8" width="12" height="2" fill="#ffffff" rx="1"/>
      <rect x="-1" y="-8" width="2" height="12" fill="#ffffff" rx="1"/>
      <circle cx="0" cy="6" r="1" fill="#ffd700"/>
    </g>
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor:"#e3f2fd"}}/>
        <stop offset="100%" style={{stopColor:"#bbdefb"}}/>
      </linearGradient>
      <linearGradient id="shield" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor:"#3f51b5"}}/>
        <stop offset="100%" style={{stopColor:"#1a237e"}}/>
      </linearGradient>
    </defs>
  </svg>
);

const App: React.FC = () => {
  const [stats, setStats] = useState<WafStats | null>(null);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [attackLogs, setAttackLogs] = useState<AttackLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'warning'
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [socket, setSocket] = useState<Socket | null>(null);
  const [realTimeAttacks, setRealTimeAttacks] = useState<RealTimeAttack[]>([]);
  const [recentBlocks, setRecentBlocks] = useState<RealTimeIPBlock[]>([]);
  const [newAttackCount, setNewAttackCount] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [language, setLanguage] = useState<'tr' | 'en'>('tr');

  // Çeviri fonksiyonu
  const t = (key: string, params?: Record<string, string>) => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    if (typeof value === 'string' && params) {
      return Object.entries(params).reduce((str, [param, val]) => {
        return str.replace(`{${param}}`, val);
      }, value);
    }
    
    return value || key;
  };

  const handleLanguageChange = (event: React.MouseEvent<HTMLElement>, newLanguage: 'tr' | 'en' | null) => {
    if (newLanguage !== null) {
      setLanguage(newLanguage);
      
      // Backend'e dil değişikliğini bildir
      fetch('http://localhost:3003/api/waf/language', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language: newLanguage }),
      }).catch(error => {
        console.error('Dil değiştirme hatası:', error);
      });
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, blockedRes, logsRes] = await Promise.all([
        fetch('http://localhost:3003/api/waf/stats'),
        fetch('http://localhost:3003/api/waf/blocked-ips'),
        fetch('http://localhost:3003/api/waf/attack-logs')
      ]);

      const statsData = await statsRes.json();
      const blockedData = await blockedRes.json();
      const logsData = await logsRes.json();

      setStats(statsData);
      setBlockedIPs(blockedData);
      setAttackLogs(logsData);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      setSnackbar({ open: true, message: t('dataLoadError'), severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    // WebSocket bağlantısı kur
    const newSocket = io('http://localhost:3003');
    setSocket(newSocket);

    // Gerçek zamanlı saldırı dinleyicisi
    newSocket.on('newAttack', (attackData: RealTimeAttack) => {
      setRealTimeAttacks(prev => [attackData, ...prev.slice(0, 9)]); // Son 10 saldırı
      setNewAttackCount(prev => prev + 1);
      
      // Bildirim göster
      setSnackbar({
        open: true,
        message: t('newAttackDetected', { type: attackData.attackType, ip: attackData.ip }),
        severity: 'error'
      });
    });

    // Gerçek zamanlı IP engelleme dinleyicisi
    newSocket.on('ipBlocked', (blockData: RealTimeIPBlock) => {
      setRecentBlocks(prev => [blockData, ...prev.slice(0, 4)]); // Son 5 engelleme
      
      // Bildirim göster
      setSnackbar({
        open: true,
        message: t('ipBlocked', { ip: blockData.ip }),
        severity: 'warning'
      });
      
      // Verileri yenile
      fetchData();
    });

    // Gerçek zamanlı log güncelleme dinleyicisi
    newSocket.on('logUpdate', (logData: AttackLog) => {
      setAttackLogs(prev => [logData, ...prev.slice(0, 99)]); // Son 100 log
    });

    // İlk veri yükleme
    fetchData();

    return () => {
      newSocket.close();
    };
  }, [fetchData]);

  // Otomatik veri yenileme (30 saniyede bir)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000); // 30 saniye

    return () => clearInterval(interval);
  }, [fetchData]);

  const handleUnblockIP = async (ip: string) => {
    try {
      const response = await fetch(`http://localhost:3003/api/waf/unblock/${ip}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSnackbar({ open: true, message: t('ipUnblocked', { ip }), severity: 'success' });
        fetchData();
      } else {
        throw new Error(t('unblockError'));
      }
    } catch (error) {
      setSnackbar({ open: true, message: t('unblockError'), severity: 'error' });
    }
  };

  const clearNewAttackCount = () => {
    setNewAttackCount(0);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          {t('loading')}
        </Typography>
      </Container>
    );
  }

  const chartData = stats ? Object.entries(stats.attackTypes).map(([type, count]) => ({
    name: type.replace('_', ' '),
    value: count
  })) : [];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TitanWAFLogo size={40} />
          <Typography variant="h3" component="h1" gutterBottom sx={{ ml: 2, mb: 0 }}>
            {t('title')}
          </Typography>
          <Badge badgeContent={newAttackCount} color="error" sx={{ ml: 2 }}>
            <NotificationsIcon 
              color={newAttackCount > 0 ? "error" : "action"} 
              onClick={clearNewAttackCount}
              sx={{ cursor: 'pointer' }}
            />
          </Badge>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ToggleButtonGroup
            value={language}
            exclusive
            onChange={handleLanguageChange}
            aria-label="language"
            size="small"
            sx={{ 
              '& .MuiToggleButton-root': {
                borderRadius: 2,
                px: 2,
                py: 1,
                fontSize: '14px',
                fontWeight: 'bold'
              }
            }}
          >
            <ToggleButton value="tr" aria-label="turkish">
              🇹🇷 TR
            </ToggleButton>
            <ToggleButton value="en" aria-label="english">
              🇺🇸 EN
            </ToggleButton>
          </ToggleButtonGroup>
          
          <Button
            variant="outlined"
            startIcon={<HelpIcon />}
            onClick={() => setHelpOpen(true)}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '16px',
              px: 3
            }}
          >
            {t('help')}
          </Button>
        </Box>
      </Box>

      {/* Yardım Modal */}
      <Dialog 
        open={helpOpen} 
        onClose={() => setHelpOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <TitanWAFLogo size={40} />
          {t('helpModal.title')}
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom color="primary" sx={{ mt: 2 }}>
            {t('helpModal.whatIsWaf')}
          </Typography>
          <Typography paragraph>
            {t('helpModal.wafDescription')}
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h5" gutterBottom color="primary">
            {t('helpModal.features')}
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <ShieldIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={t('helpModal.multiAttackDetection')}
                    secondary={t('helpModal.multiAttackDesc')}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <SpeedIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={t('helpModal.rateLimiting')}
                    secondary={t('helpModal.rateLimitingDesc')}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <AnalyticsIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={t('helpModal.ipReputation')}
                    secondary={t('helpModal.ipReputationDesc')}
                  />
                </ListItem>
              </List>
            </Box>
            
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <AutoFixHighIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={t('helpModal.adaptiveThresholds')}
                    secondary={t('helpModal.adaptiveDesc')}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <RealtimeIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={t('helpModal.realTimeMonitoring')}
                    secondary={t('helpModal.realTimeDesc')}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <NetworkCheckIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={t('helpModal.smartBlocking')}
                    secondary={t('helpModal.smartBlockingDesc')}
                  />
                </ListItem>
              </List>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h5" gutterBottom color="primary">
            {t('helpModal.attackTypes')}
          </Typography>
          
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>{t('helpModal.attackType')}</strong></TableCell>
                  <TableCell><strong>{t('helpModal.threshold')}</strong></TableCell>
                  <TableCell><strong>{t('helpModal.blockDuration')}</strong></TableCell>
                  <TableCell><strong>{t('helpModal.examplePattern')}</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>SQL Injection</TableCell>
                  <TableCell>2-10 (adaptive)</TableCell>
                  <TableCell>2 saat</TableCell>
                  <TableCell>' OR 1=1, UNION SELECT</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>XSS</TableCell>
                  <TableCell>1-8 (adaptive)</TableCell>
                  <TableCell>1 saat</TableCell>
                  <TableCell>&lt;script&gt;, javascript:</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Command Injection</TableCell>
                  <TableCell>1-5 (adaptive)</TableCell>
                  <TableCell>2 saat</TableCell>
                  <TableCell>; ls, | cat, && whoami</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>File Inclusion</TableCell>
                  <TableCell>1-5 (adaptive)</TableCell>
                  <TableCell>1.5 saat</TableCell>
                  <TableCell>../../../etc/passwd</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Rate Limiting</TableCell>
                  <TableCell>100 req/min</TableCell>
                  <TableCell>1 saat</TableCell>
                  <TableCell>Hızlı istek bombardımanı</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h5" gutterBottom color="primary">
            {t('helpModal.useCases')}
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
              <Card sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                <Typography variant="h6" gutterBottom color="primary">
                  {t('helpModal.webApps')}
                </Typography>
                <Typography variant="body2">
                  {t('helpModal.webAppsDesc')}
                </Typography>
              </Card>
            </Box>
            
            <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
              <Card sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                <Typography variant="h6" gutterBottom color="primary">
                  {t('helpModal.sectors')}
                </Typography>
                <Typography variant="body2">
                  {t('helpModal.sectorsDesc')}
                </Typography>
              </Card>
            </Box>
            
            <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
              <Card sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                <Typography variant="h6" gutterBottom color="primary">
                  {t('helpModal.security')}
                </Typography>
                <Typography variant="body2">
                  {t('helpModal.securityDesc')}
                </Typography>
              </Card>
            </Box>
            
            <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
              <Card sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                <Typography variant="h6" gutterBottom color="primary">
                  {t('helpModal.monitoring')}
                </Typography>
                <Typography variant="body2">
                  {t('helpModal.monitoringDesc')}
                </Typography>
              </Card>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h5" gutterBottom color="primary">
            {t('helpModal.technicalFeatures')}
          </Typography>
          
          <List>
            <ListItem>
              <ListItemText 
                primary={t('helpModal.patternMatching')}
                secondary={t('helpModal.patternMatchingDesc')}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary={t('helpModal.mlAlgorithm')}
                secondary={t('helpModal.mlAlgorithmDesc')}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary={t('helpModal.highPerformance')}
                secondary={t('helpModal.highPerformanceDesc')}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary={t('helpModal.modernUI')}
                secondary={t('helpModal.modernUIDesc')}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary={t('helpModal.realTimeUpdates')}
                secondary={t('helpModal.realTimeUpdatesDesc')}
              />
            </ListItem>
          </List>

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>{t('helpModal.tip')}</strong> {t('helpModal.tipDesc')}
            </Typography>
          </Alert>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setHelpOpen(false)} 
            variant="contained"
            sx={{ borderRadius: 2, px: 4 }}
          >
            {t('understand')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Gerçek Zamanlı Saldırı Bildirimleri */}
      {realTimeAttacks.length > 0 && (
        <Fade in={true}>
          <Card sx={{ mb: 3, bgcolor: '#fff3e0', border: '2px solid #ff9800' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="warning.main">
                {t('realTimeAttacks')}
              </Typography>
              {realTimeAttacks.slice(0, 3).map((attack, index) => (
                <Zoom in={true} key={index} style={{ transitionDelay: `${index * 100}ms` }}>
                  <Alert severity="warning" sx={{ mb: 1 }}>
                    <strong>{attack.attackType}</strong> {language === 'tr' ? 'saldırısı tespit edildi!' : 'attack detected!'} 
                    IP: <strong>{attack.ip}</strong> | 
                    {language === 'tr' ? 'Sayaç:' : 'Count:'} <strong>{attack.count}/{attack.threshold}</strong> | 
                    URL: <strong>{attack.method} {attack.url}</strong>
                  </Alert>
                </Zoom>
              ))}
            </CardContent>
          </Card>
        </Fade>
      )}

      {/* Son Engellenen IP'ler */}
      {recentBlocks.length > 0 && (
        <Fade in={true}>
          <Card sx={{ mb: 3, bgcolor: '#ffebee', border: '2px solid #f44336' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="error.main">
                {t('recentBlocks')}
              </Typography>
              {recentBlocks.map((block, index) => (
                <Zoom in={true} key={index} style={{ transitionDelay: `${index * 100}ms` }}>
                  <Alert severity="error" sx={{ mb: 1 }}>
                    IP <strong>{block.ip}</strong> {language === 'tr' ? 'engellendi!' : 'blocked!'} 
                    {language === 'tr' ? 'Sebep:' : 'Reason:'} <strong>{block.reason}</strong> | 
                    {language === 'tr' ? 'Zaman:' : 'Time:'} <strong>{new Date(block.timestamp).toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US')}</strong>
                  </Alert>
                </Zoom>
              ))}
            </CardContent>
          </Card>
        </Fade>
      )}

      {/* İstatistik Kartları */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <WarningIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    {t('totalAttacks')}
                  </Typography>
                  <Typography variant="h4">
                    {stats?.totalAttacks || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BlockIcon sx={{ fontSize: 40, color: 'error.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    {t('blockedIPs')}
                  </Typography>
                  <Typography variant="h4">
                    {stats?.blockedIPs || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SecurityIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    {t('trustedIPs')}
                  </Typography>
                  <Typography variant="h4">
                    {stats?.whitelistedIPs || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BlockIcon sx={{ fontSize: 40, color: 'secondary.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    {t('permanentBlocks')}
                  </Typography>
                  <Typography variant="h4">
                    {stats?.persistentBlockedIPs || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Saldırı Türleri Grafiği */}
      {chartData.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              {t('attackDistribution')}
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Engellenen IP'ler Tablosu */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {t('blockedIPsTable')}
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('ipAddress')}</TableCell>
                  <TableCell>{t('blockedTime')}</TableCell>
                  <TableCell>{t('reason')}</TableCell>
                  <TableCell>{t('actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {blockedIPs.map((blockedIP, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Chip label={blockedIP.ip} color="error" />
                    </TableCell>
                    <TableCell>
                      {new Date(blockedIP.blockedAt).toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US')}
                    </TableCell>
                    <TableCell>{blockedIP.reason}</TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleUnblockIP(blockedIP.ip)}
                      >
                        {t('unblock')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Saldırı Logları */}
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {t('recentAttackLogs')}
          </Typography>
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>{t('time')}</TableCell>
                  <TableCell>{t('ipAddress')}</TableCell>
                  <TableCell>{t('detail')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attackLogs.slice(0, 50).map((log, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {new Date(log.timestamp).toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US')}
                    </TableCell>
                    <TableCell>
                      <Chip label={log.ip} size="small" />
                    </TableCell>
                    <TableCell>{log.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

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
  );
};

export default App;
