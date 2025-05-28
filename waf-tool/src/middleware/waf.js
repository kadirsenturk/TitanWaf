import { detectSQLInjection } from '../utils/sqlInjectionDetector';
import { detectXSS } from '../utils/xssDetector';
import { detectCommandInjection } from '../utils/commandInjectionDetector';
import { detectFileInclusion } from '../utils/fileInclusionDetector';
import fs from 'fs';
import path from 'path';
var whitelistPath = path.join(__dirname, '../../whitelist.txt');
var blacklistPath = path.join(__dirname, '../../blacklist.txt');
var tempBlacklistPath = path.join(__dirname, '../../temp-blacklist.txt');
function loadList(filePath) {
    if (!fs.existsSync(filePath))
        return new Set();
    return new Set(fs.readFileSync(filePath, 'utf8').split('\n').map(function (ip) { return ip.trim(); }).filter(Boolean));
}
function saveList(filePath, list) {
    fs.writeFileSync(filePath, Array.from(list).join('\n'), { encoding: 'utf8' });
}
function saveTempBlacklist() {
    fs.writeFileSync(tempBlacklistPath, Array.from(tempBlacklist).join('\n'), { encoding: 'utf8' });
}
function loadTempBlacklist() {
    if (!fs.existsSync(tempBlacklistPath))
        return new Set();
    return new Set(fs.readFileSync(tempBlacklistPath, 'utf8').split('\n').map(function (ip) { return ip.trim(); }).filter(Boolean));
}
// Başlangıçta yükle
var whitelist = loadList(whitelistPath);
var persistentBlacklist = loadList(blacklistPath);
export var tempBlacklist = loadTempBlacklist();
// Saldırı türleri ve eşik değerleri
var ATTACK_THRESHOLDS = {
    SQL_INJECTION: 5,
    XSS: 3,
    COMMAND_INJECTION: 2,
    FILE_INCLUSION: 2
};
// Saldırı türleri için ayrı sayaçlar
var attackCounts = {};
function incrementAttackCount(ip, attackType) {
    if (!attackCounts[ip]) {
        attackCounts[ip] = {};
    }
    attackCounts[ip][attackType] = (attackCounts[ip][attackType] || 0) + 1;
    return attackCounts[ip][attackType] || 0;
}
function getClientIp(req) {
    var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    // IPv6 localhost adreslerini IPv4'e çevir
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
        ip = '127.0.0.1';
    }
    // IPv6 prefix'ini kaldır
    if (ip.startsWith('::ffff:')) {
        ip = ip.replace('::ffff:', '');
    }
    return ip;
}
function checkAllFields(obj, detector) {
    if (!obj)
        return false;
    if (typeof obj === 'string') {
        return detector(obj);
    }
    if (typeof obj === 'object') {
        return Object.values(obj).some(function (val) { return checkAllFields(val, detector); });
    }
    return false;
}
export function wafMiddleware(req, res, next) {
    var clientIp = getClientIp(req);
    console.log('Client IP:', clientIp);
    // Whitelist kontrolü
    if (whitelist.has(clientIp)) {
        console.log('IP whitelist\'te:', clientIp);
        return next();
    }
    // Kalıcı blacklist kontrolü
    if (persistentBlacklist.has(clientIp)) {
        console.log('IP kalıcı blacklist\'te:', clientIp);
        return res.status(403).json({ error: 'Bu IP adresi kalıcı olarak engellenmiştir.' });
    }
    // Geçici blacklist kontrolü
    if (tempBlacklist.has(clientIp)) {
        console.log('IP geçici blacklist\'te:', clientIp);
        return res.status(403).json({ error: 'Bu IP adresi geçici olarak engellenmiştir.' });
    }
    // Saldırı tespiti
    var attackDetected = false;
    var attackType = '';
    // SQL Injection kontrolü
    if (checkAllFields(req.body, detectSQLInjection)) {
        attackType = 'SQL_INJECTION';
        attackDetected = true;
    }
    // XSS kontrolü
    else if (checkAllFields(req.body, detectXSS)) {
        attackType = 'XSS';
        attackDetected = true;
    }
    // Command Injection kontrolü
    else if (checkAllFields(req.body, detectCommandInjection)) {
        attackType = 'COMMAND_INJECTION';
        attackDetected = true;
    }
    // File Inclusion kontrolü
    else if (checkAllFields(req.body, detectFileInclusion)) {
        attackType = 'FILE_INCLUSION';
        attackDetected = true;
    }
    if (attackDetected && attackType) {
        console.log('Saldırı tespit edildi:', {
            ip: clientIp,
            type: attackType,
            endpoint: req.originalUrl,
            body: req.body
        });
        // Saldırı sayacını artır
        var count = incrementAttackCount(clientIp, attackType);
        // Eşik değerini kontrol et
        if (count >= ATTACK_THRESHOLDS[attackType]) {
            tempBlacklist.add(clientIp);
            saveTempBlacklist();
            return res.status(403).json({
                error: 'Bu IP adresi geçici olarak engellenmiştir.',
                reason: "".concat(attackType, " sald\u0131r\u0131s\u0131 tespit edildi.")
            });
        }
        return res.status(403).json({
            error: 'Saldırı tespit edildi.',
            type: attackType,
            remainingAttempts: ATTACK_THRESHOLDS[attackType] - count
        });
    }
    next();
}
export function getWafStats() {
    var stats = {
        totalAttacks: 0,
        attackTypes: {},
        blockedIPs: tempBlacklist.size,
        whitelistedIPs: whitelist.size,
        persistentBlockedIPs: persistentBlacklist.size
    };
    // Tüm IP'lerdeki saldırı sayılarını topla
    Object.values(attackCounts).forEach(function (ipAttacks) {
        Object.entries(ipAttacks).forEach(function (_a) {
            var type = _a[0], count = _a[1];
            if (count) {
                stats.totalAttacks += count;
                stats.attackTypes[type] = (stats.attackTypes[type] || 0) + count;
            }
        });
    });
    return stats;
}
export function removeFromBlacklist(ip) {
    tempBlacklist.delete(ip);
    saveTempBlacklist();
}
export function addToBlacklist(ip) {
    persistentBlacklist.add(ip);
    saveList(blacklistPath, persistentBlacklist);
}
export function removeFromWhitelist(ip) {
    whitelist.delete(ip);
    saveList(whitelistPath, whitelist);
}
export function addToWhitelist(ip) {
    whitelist.add(ip);
    saveList(whitelistPath, whitelist);
}
