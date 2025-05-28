import { detectSQLInjection } from '../utils/sqlInjectionDetector'
import { detectXSS } from '../utils/xssDetector'
import { detectCommandInjection } from '../utils/commandInjectionDetector'
import { detectFileInclusion } from '../utils/fileInclusionDetector'
import fs from 'fs'
import path from 'path'
import { Request, Response, NextFunction } from 'express'

const whitelistPath = path.join(__dirname, '../../whitelist.txt')
const blacklistPath = path.join(__dirname, '../../blacklist.txt')
const tempBlacklistPath = path.join(__dirname, '../../temp-blacklist.txt')

function loadList(filePath: string): Set<string> {
    if (!fs.existsSync(filePath)) return new Set()
    return new Set(fs.readFileSync(filePath, 'utf8').split('\n').map(ip => ip.trim()).filter(Boolean))
}

function saveList(filePath: string, list: Set<string>) {
    fs.writeFileSync(filePath, Array.from(list).join('\n'), { encoding: 'utf8' })
}

function saveTempBlacklist() {
    fs.writeFileSync(tempBlacklistPath, Array.from(tempBlacklist).join('\n'), { encoding: 'utf8' })
}

function loadTempBlacklist() {
    if (!fs.existsSync(tempBlacklistPath)) return new Set<string>()
    return new Set(fs.readFileSync(tempBlacklistPath, 'utf8').split('\n').map(ip => ip.trim()).filter(Boolean))
}

// Başlangıçta yükle
const whitelist = loadList(whitelistPath)
const persistentBlacklist = loadList(blacklistPath)
export const tempBlacklist = loadTempBlacklist()

// Saldırı türleri için tip tanımı
type AttackType = 'SQL_INJECTION' | 'XSS' | 'COMMAND_INJECTION' | 'FILE_INCLUSION';

// Saldırı türleri ve eşik değerleri
const ATTACK_THRESHOLDS: Record<AttackType, number> = {
    SQL_INJECTION: 5,
    XSS: 3,
    COMMAND_INJECTION: 2,
    FILE_INCLUSION: 2
};

// Saldırı türleri için ayrı sayaçlar
const attackCounts: { [ip: string]: { [attackType in AttackType]?: number } } = {};

function incrementAttackCount(ip: string, attackType: AttackType): number {
    if (!attackCounts[ip]) {
        attackCounts[ip] = {};
    }
    attackCounts[ip][attackType] = (attackCounts[ip][attackType] || 0) + 1;
    return attackCounts[ip][attackType] || 0;
}

function getClientIp(req: Request): string {
    let ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || ''
    // IPv6 localhost adreslerini IPv4'e çevir
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
        ip = '127.0.0.1'
    }
    // IPv6 prefix'ini kaldır
    if (ip.startsWith('::ffff:')) {
        ip = ip.replace('::ffff:', '')
    }
    return ip
}

function checkAllFields(obj: any, detector: (input: string) => boolean): boolean {
    if (!obj) return false;
    if (typeof obj === 'string') {
        return detector(obj);
    }
    if (typeof obj === 'object') {
        return Object.values(obj).some(val => checkAllFields(val, detector));
    }
    return false;
}

export function wafMiddleware(req: Request, res: Response, next: NextFunction) {
    const clientIp = getClientIp(req)
    console.log('Client IP:', clientIp)

    // Whitelist kontrolü
    if (whitelist.has(clientIp)) {
        console.log('IP whitelist\'te:', clientIp)
        return next()
    }

    // Kalıcı blacklist kontrolü
    if (persistentBlacklist.has(clientIp)) {
        console.log('IP kalıcı blacklist\'te:', clientIp)
        return res.status(403).json({ error: 'Bu IP adresi kalıcı olarak engellenmiştir.' })
    }

    // Geçici blacklist kontrolü
    if (tempBlacklist.has(clientIp)) {
        console.log('IP geçici blacklist\'te:', clientIp)
        return res.status(403).json({ error: 'Bu IP adresi geçici olarak engellenmiştir.' })
    }

    // Saldırı tespiti
    let attackDetected = false;
    let attackType: AttackType | '' = '';

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
        const count = incrementAttackCount(clientIp, attackType);

        // Eşik değerini kontrol et
        if (count >= ATTACK_THRESHOLDS[attackType]) {
            tempBlacklist.add(clientIp);
            saveTempBlacklist();
            return res.status(403).json({
                error: 'Bu IP adresi geçici olarak engellenmiştir.',
                reason: `${attackType} saldırısı tespit edildi.`
            });
        }

        return res.status(403).json({
            error: 'Saldırı tespit edildi.',
            type: attackType,
            remainingAttempts: ATTACK_THRESHOLDS[attackType] - count
        });
    }

    next()
}

export function getWafStats() {
    const stats = {
        totalAttacks: 0,
        attackTypes: {} as Record<AttackType, number>,
        blockedIPs: tempBlacklist.size,
        whitelistedIPs: whitelist.size,
        persistentBlockedIPs: persistentBlacklist.size
    };

    // Tüm IP'lerdeki saldırı sayılarını topla
    Object.values(attackCounts).forEach(ipAttacks => {
        Object.entries(ipAttacks).forEach(([type, count]) => {
            if (count) {
                stats.totalAttacks += count;
                stats.attackTypes[type as AttackType] = (stats.attackTypes[type as AttackType] || 0) + count;
            }
        });
    });

    return stats;
}

export function removeFromBlacklist(ip: string) {
    tempBlacklist.delete(ip)
    saveTempBlacklist()
}

export function addToBlacklist(ip: string) {
    persistentBlacklist.add(ip)
    saveList(blacklistPath, persistentBlacklist)
}

export function removeFromWhitelist(ip: string) {
    whitelist.delete(ip)
    saveList(whitelistPath, whitelist)
}

export function addToWhitelist(ip: string) {
    whitelist.add(ip)
    saveList(whitelistPath, whitelist)
}