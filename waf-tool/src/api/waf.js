import express from 'express';
import { getWafStats, tempBlacklist, removeFromBlacklist } from '../middleware/waf';
var router = express.Router();
// WAF istatistiklerini getir
router.get('/stats', function (_, res) {
    try {
        var stats = getWafStats();
        res.json(stats);
    }
    catch (error) {
        console.error('Stats fetch error:', error);
        res.status(500).json({ error: 'İstatistikler alınırken bir hata oluştu' });
    }
});
// Engellenen IP'leri getir
router.get('/blocked-ips', function (_, res) {
    try {
        var blockedIPs = Array.from(tempBlacklist).map(function (ip) { return ({
            ip: ip,
            attackType: 'SQL_INJECTION',
            remainingTime: 3600000 // Örnek olarak 1 saat
        }); });
        res.json(blockedIPs);
    }
    catch (error) {
        console.error('Blocked IPs fetch error:', error);
        res.status(500).json({ error: 'Engellenen IP\'ler alınırken bir hata oluştu' });
    }
});
// IP engelini kaldır
router.post('/unblock/:ip', function (req, res) {
    try {
        var ip = req.params.ip;
        removeFromBlacklist(ip);
        res.json({ message: 'IP engeli kaldırıldı' });
    }
    catch (error) {
        console.error('Unblock IP error:', error);
        res.status(500).json({ error: 'IP engeli kaldırılırken bir hata oluştu' });
    }
});
export default router;
