import express from 'express';
import { getWafStats, tempBlacklist, removeFromBlacklist } from '../middleware/waf';

const router = express.Router();

// WAF istatistiklerini getir
router.get('/stats', (_, res) => {
    try {
        const stats = getWafStats();
        res.json(stats);
    } catch (error) {
        console.error('Stats fetch error:', error);
        res.status(500).json({ error: 'İstatistikler alınırken bir hata oluştu' });
    }
});

// Engellenen IP'leri getir
router.get('/blocked-ips', (_, res) => {
    try {
        const blockedIPs = Array.from(tempBlacklist).map(ip => ({
            ip,
            attackType: 'SQL_INJECTION', // Bu kısmı gerçek saldırı türüne göre güncelleyin
            remainingTime: 3600000 // Örnek olarak 1 saat
        }));
        res.json(blockedIPs);
    } catch (error) {
        console.error('Blocked IPs fetch error:', error);
        res.status(500).json({ error: 'Engellenen IP\'ler alınırken bir hata oluştu' });
    }
});

// IP engelini kaldır
router.post('/unblock/:ip', (req, res) => {
    try {
        const { ip } = req.params;
        removeFromBlacklist(ip);
        res.json({ message: 'IP engeli kaldırıldı' });
    } catch (error) {
        console.error('Unblock IP error:', error);
        res.status(500).json({ error: 'IP engeli kaldırılırken bir hata oluştu' });
    }
});

export default router; 