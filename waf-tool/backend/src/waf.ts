/**
 * TitanWAF - Advanced Web Application Firewall
 * 
 * Core security engine with intelligent threat detection and adaptive response
 * Features: IP reputation system, adaptive thresholds, real-time monitoring
 * 
 * @author TitanWAF Team
 * @version 1.0.0
 * @license MIT
 */

import fs from 'fs'
import path from 'path'
import { Request, Response, NextFunction } from 'express'

// Real-time communication handlers for WebSocket broadcasting
let broadcastThreatDetected: ((data: any) => void) | null = null;
let broadcastIPBlocked: ((data: any) => void) | null = null;
let broadcastLogUpdate: ((data: any) => void) | null = null;

/**
 * Initialize WebSocket broadcast functions for real-time notifications
 * @param threatFn - Function to broadcast threat detection events
 * @param ipBlockedFn - Function to broadcast IP blocking events  
 * @param logUpdateFn - Function to broadcast log update events
 */
export function initializeBroadcastHandlers(threatFn: (data: any) => void, ipBlockedFn: (data: any) => void, logUpdateFn: (data: any) => void) {
    broadcastThreatDetected = threatFn;
    broadcastIPBlocked = ipBlockedFn;
    broadcastLogUpdate = logUpdateFn;
}

/**
 * IP Reputation tracking interface
 * Maintains comprehensive security profile for each IP address
 */
interface IPSecurityProfile {
    reputationScore: number; // Security score: 0 (malicious) to 100 (trusted)
    lastActivity: number;
    threatHistory: SecurityIncident[];
    requestLimiter: {
        requestCount: number;
        windowStartTime: number;
        violationCount: number;
    };
}

/**
 * Security incident record for threat tracking
 */
interface SecurityIncident {
    threatType: ThreatType;
    timestamp: number;
    severityLevel: number; // Threat severity: 1 (low) to 10 (critical)
    wasBlocked: boolean;
}

// Central IP security profiles registry
const ipSecurityProfiles: { [ip: string]: IPSecurityProfile } = {};

// Request rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1-minute sliding window
const MAX_REQUESTS_PER_WINDOW = 100; // Maximum requests per window
const VIOLATION_THRESHOLD = 3; // Violations before blocking

// Intelligent adaptive threshold system for threat detection
const THREAT_DETECTION_THRESHOLDS = {
    SQL_INJECTION: { baseline: 5, minimum: 2, maximum: 10 },
    XSS: { baseline: 3, minimum: 1, maximum: 8 },
    COMMAND_INJECTION: { baseline: 2, minimum: 1, maximum: 5 },
    FILE_INCLUSION: { baseline: 2, minimum: 1, maximum: 5 }
};

// File system paths for security lists
const trustedIPsPath = path.join(__dirname, '../../whitelist.txt')
const permanentBlocklistPath = path.join(__dirname, '../../blacklist.txt')
const temporaryBlocklistPath = path.join(__dirname, '../../temp-blacklist.txt')

/**
 * Load IP addresses from security list files
 * @param filePath - Path to the security list file
 * @returns Set of IP addresses
 */
function loadSecurityList(filePath: string): Set<string> {
    if (!fs.existsSync(filePath)) return new Set()
    return new Set(fs.readFileSync(filePath, 'utf8')
        .split('\n')
        .map(ip => ip.trim())
        .filter(ip => ip && ip.length > 0 && !ip.startsWith('#')))
}

/**
 * Save IP addresses to security list file
 * @param filePath - Path to the security list file
 * @param ipSet - Set of IP addresses to save
 */
function saveSecurityList(filePath: string, ipSet: Set<string>) {
    fs.writeFileSync(filePath, Array.from(ipSet).join('\n'), { encoding: 'utf8' })
}

/**
 * Persist temporary blocklist to file system
 */
function persistTemporaryBlocklist() {
    fs.writeFileSync(temporaryBlocklistPath, Array.from(temporaryBlocklist).join('\n'), { encoding: 'utf8' })
}

/**
 * Load temporary blocklist from file system
 * @returns Set of temporarily blocked IP addresses
 */
function loadTemporaryBlocklist() {
    if (!fs.existsSync(temporaryBlocklistPath)) return new Set<string>()
    return new Set(fs.readFileSync(temporaryBlocklistPath, 'utf8').split('\n').map(ip => ip.trim()).filter(Boolean))
}

// Initialize security lists at startup
const trustedIPs = loadSecurityList(trustedIPsPath)
const permanentBlocklist = loadSecurityList(permanentBlocklistPath)
export const temporaryBlocklist = loadTemporaryBlocklist()

// Threat classification system
type ThreatType = 'SQL_INJECTION' | 'XSS' | 'COMMAND_INJECTION' | 'FILE_INCLUSION';

// Legacy threshold configuration (maintained for compatibility)
const LEGACY_THREAT_THRESHOLDS: Record<ThreatType, number> = {
    SQL_INJECTION: 5,
    XSS: 3,
    COMMAND_INJECTION: 2,
    FILE_INCLUSION: 2
};

// Threat detection counters per IP address
const threatCounters: { [ip: string]: { [threatType in ThreatType]?: number } } = {};

// IP reputation system
const ipReputations: { [ip: string]: IPSecurityProfile } = {};

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 100;
const RATE_LIMIT_VIOLATIONS_THRESHOLD = 3;

// Adaptive threshold system
const ADAPTIVE_THRESHOLDS = {
    SQL_INJECTION: { base: 5, min: 2, max: 10 },
    XSS: { base: 3, min: 1, max: 8 },
    COMMAND_INJECTION: { base: 2, min: 1, max: 5 },
    FILE_INCLUSION: { base: 2, min: 1, max: 5 }
};

const whitelistPath = path.join(__dirname, '../../whitelist.txt')
const blacklistPath = path.join(__dirname, '../../blacklist.txt')

function loadList(filePath: string): Set<string> {
    if (!fs.existsSync(filePath)) return new Set()
    return new Set(fs.readFileSync(filePath, 'utf8')
        .split('\n')
        .map(ip => ip.trim())
        .filter(ip => ip && ip.length > 0 && !ip.startsWith('#')))
}

function saveList(filePath: string, list: Set<string>) {
    fs.writeFileSync(filePath, Array.from(list).join('\n'), { encoding: 'utf8' })
}

// Load security lists at startup
const whitelist = loadList(whitelistPath)
const persistentBlacklist = loadList(blacklistPath)

// Attack type definitions
type AttackType = 'SQL_INJECTION' | 'XSS' | 'COMMAND_INJECTION' | 'FILE_INCLUSION';

// Attack thresholds configuration
const ATTACK_THRESHOLDS: Record<AttackType, number> = {
    SQL_INJECTION: 5,
    XSS: 3,
    COMMAND_INJECTION: 2,
    FILE_INCLUSION: 2
};

// Attack counters per IP and attack type
const attackCounts: { [ip: string]: { [attackType in AttackType]?: number } } = {};

// Get or create IP reputation profile
function getIPReputation(ip: string): IPSecurityProfile {
    if (!ipSecurityProfiles[ip]) {
        ipSecurityProfiles[ip] = {
            reputationScore: 50,
            lastActivity: Date.now(),
            threatHistory: [],
            requestLimiter: {
                requestCount: 0,
                windowStartTime: Date.now(),
                violationCount: 0
            }
        };
    }
    return ipSecurityProfiles[ip];
}

// Update IP reputation score based on attack activity
function updateIPReputation(ip: string, attackType: AttackType, severity: number, blocked: boolean) {
    const reputation = getIPReputation(ip);
    
    reputation.threatHistory.push({
        threatType: attackType,
        timestamp: Date.now(),
        severityLevel: severity,
        wasBlocked: blocked
    });
    
    // Clean old records (24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    reputation.threatHistory = reputation.threatHistory.filter(record => record.timestamp > oneDayAgo);
    
    // Update score
    const scorePenalty = severity * (blocked ? 2 : 1);
    reputation.reputationScore = Math.max(0, reputation.reputationScore - scorePenalty);
    
    // Improve score over time
    const timeSinceLastUpdate = Date.now() - reputation.lastActivity;
    const hoursElapsed = timeSinceLastUpdate / (60 * 60 * 1000);
    const scoreImprovement = Math.min(10, hoursElapsed * 0.5);
    reputation.reputationScore = Math.min(100, reputation.reputationScore + scoreImprovement);
    
    reputation.lastActivity = Date.now();
}

// Rate limiting check
function checkRateLimit(ip: string): boolean {
    const reputation = getIPReputation(ip);
    const now = Date.now();
    
    // Start new window
    if (now - reputation.requestLimiter.windowStartTime > RATE_LIMIT_WINDOW) {
        reputation.requestLimiter.windowStartTime = now;
        reputation.requestLimiter.requestCount = 0;
    }
    
    reputation.requestLimiter.requestCount++;
    
    if (reputation.requestLimiter.requestCount > MAX_REQUESTS_PER_WINDOW) {
        reputation.requestLimiter.violationCount++;
        return false;
    }
    
    return true;
}

// Calculate adaptive threshold based on IP reputation
function getAdaptiveThreshold(attackType: AttackType, ip: string): number {
    const reputation = getIPReputation(ip);
    const config = ADAPTIVE_THRESHOLDS[attackType];
    
    let threshold = config.base;
    
    if (reputation.reputationScore < 20) {
        threshold = config.min;
    } else if (reputation.reputationScore > 80) {
        threshold = config.max;
    } else {
        const factor = (reputation.reputationScore - 20) / 60;
        threshold = Math.round(config.min + (config.max - config.min) * factor);
    }
    
    return threshold;
}

// Calculate attack severity based on payload content
function calculateAttackSeverity(attackType: AttackType, payload: string): number {
    let severity = 1;
    
    switch (attackType) {
        case 'SQL_INJECTION':
            if (payload.includes('drop') || payload.includes('delete')) severity = 10;
            else if (payload.includes('union') || payload.includes('select')) severity = 7;
            else if (payload.includes('or') || payload.includes('and')) severity = 4;
            break;
            
        case 'XSS':
            if (payload.includes('script') && payload.includes('document')) severity = 9;
            else if (payload.includes('script')) severity = 6;
            else if (payload.includes('javascript:')) severity = 5;
            break;
            
        case 'COMMAND_INJECTION':
            if (payload.includes('rm ') || payload.includes('del ')) severity = 10;
            else if (payload.includes('cat') || payload.includes('type')) severity = 6;
            else severity = 4;
            break;
            
        case 'FILE_INCLUSION':
            if (payload.includes('passwd') || payload.includes('shadow')) severity = 9;
            else if (payload.includes('../')) severity = 5;
            else severity = 3;
            break;
    }
    
    return severity;
}

function incrementAttackCount(ip: string, attackType: AttackType): number {
    if (!attackCounts[ip]) {
        attackCounts[ip] = {};
    }
    attackCounts[ip][attackType] = (attackCounts[ip][attackType] || 0) + 1;
    return attackCounts[ip][attackType] || 0;
}

function getClientIp(req: Request): string {
    let ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || ''
    // Convert IPv6 localhost to IPv4
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
        ip = '127.0.0.1'
    }
    // Remove IPv6 prefix
    if (ip.startsWith('::ffff:')) {
        ip = ip.replace('::ffff:', '')
    }
    return ip
}

export function getWafStats() {
    const stats = {
        totalAttacks: 0,
        attackTypes: {} as Record<AttackType, number>,
        blockedIPs: temporaryBlocklist.size,
        whitelistedIPs: whitelist.size,
        persistentBlockedIPs: persistentBlacklist.size,
        ipReputations: Object.keys(ipSecurityProfiles).length,
        averageReputation: 0
    };

    // Sum all attack counts across IPs
    Object.values(attackCounts).forEach(ipAttacks => {
        Object.entries(ipAttacks).forEach(([type, count]) => {
            if (count) {
                stats.totalAttacks += count;
                stats.attackTypes[type as AttackType] = (stats.attackTypes[type as AttackType] || 0) + count;
            }
        });
    });

    // Calculate average reputation
    const reputationScores = Object.values(ipSecurityProfiles).map(rep => rep.reputationScore);
    if (reputationScores.length > 0) {
        stats.averageReputation = Math.round(reputationScores.reduce((a, b) => a + b, 0) / reputationScores.length);
    }

    return stats;
}

// Track timeout IDs for automatic unblocking
const blockTimeouts: { [ip: string]: NodeJS.Timeout } = {};

export function removeFromBlacklist(ip: string) {
    temporaryBlocklist.delete(ip)
    persistTemporaryBlocklist()
    
    // Remove from persistent blacklist if present
    const currentPersistentBlacklist = loadList(blacklistPath);
    if (currentPersistentBlacklist.has(ip)) {
        currentPersistentBlacklist.delete(ip);
        saveList(blacklistPath, currentPersistentBlacklist);
        console.log(`🧹 Manual unblock: IP ${ip} removed from persistent blacklist`);
    }
    
    // Cancel active timeout if exists
    if (blockTimeouts[ip]) {
        clearTimeout(blockTimeouts[ip]);
        delete blockTimeouts[ip];
        console.log(`🔓 Manual unblock: Timeout cancelled for IP ${ip}`);
    }
    
    // Clear attack counts
    if (attackCounts[ip]) {
        delete attackCounts[ip];
        console.log(`🧹 Manual unblock: Attack counts cleared for IP ${ip}`);
    }
    
    // Improve IP reputation
    if (ipSecurityProfiles[ip]) {
        ipSecurityProfiles[ip].reputationScore = 75;
        ipSecurityProfiles[ip].threatHistory = [];
        console.log(`📈 Manual unblock: IP reputation reset for IP ${ip}`);
    }
    
    // Add IP to whitelist automatically
    whitelist.add(ip);
    saveList(whitelistPath, whitelist);
    console.log(`🤍 Manual unblock: IP ${ip} automatically added to whitelist`);
    
    // Add log entry
    const unblockLogEntry = `${new Date().toISOString()} - ${ip} - MANUAL_UNBLOCK: IP manually unblocked and added to whitelist\n`;
    const suspiciousLogPath = path.join(__dirname, '../../../waf-suspicious-log.txt');
    writeLogAndBroadcast(suspiciousLogPath, unblockLogEntry);
    
    console.log(`✅ IP ${ip} completely unblocked and whitelisted`);
}

export function addToBlacklist(ip: string) {
    temporaryBlocklist.add(ip)
    persistTemporaryBlocklist()
}

export function removeFromWhitelist(ip: string) {
    whitelist.delete(ip)
    saveList(whitelistPath, whitelist)
}

export function addToWhitelist(ip: string) {
    whitelist.add(ip)
    saveList(whitelistPath, whitelist)
    
    // Improve IP reputation
    const reputation = getIPReputation(ip);
    reputation.reputationScore = 100;
}

// Translation system
const translations = {
    tr: {
        blocked_temp: "BLOCKED: Geçici engelleme listesinde",
        blocked_persistent: "BLOCKED: Kalıcı engelleme listesinde", 
        blocked_rate_limit: "BLOCKED: Rate limit ihlali ({violations} ihlal)",
        whitelist_passed: "WHITELIST: İstek whitelist'ten geçti",
        rate_limit_warning: "RATE_LIMIT_WARNING: Dakikada {requests} istek",
        attack_detected: "{type}: Saldırı tespit edildi ({count}/{threshold}) Şiddet: {severity} - {method} {url}",
        ip_blocked_attack: "IP_BLOCKED: {type} saldırısı nedeniyle engellendi (Şiddet: {severity}, Reputation: {reputation})",
        ip_blocked_threshold: "IP_BLOCKED: {type} eşik değeri aşıldı ({count}/{threshold})"
    },
    en: {
        blocked_temp: "BLOCKED: In temporary blacklist",
        blocked_persistent: "BLOCKED: In persistent blacklist",
        blocked_rate_limit: "BLOCKED: Rate limit violation ({violations} violations)",
        whitelist_passed: "WHITELIST: Request passed through whitelist",
        rate_limit_warning: "RATE_LIMIT_WARNING: {requests} requests per minute",
        attack_detected: "{type}: Attack detected ({count}/{threshold}) Severity: {severity} - {method} {url}",
        ip_blocked_attack: "IP_BLOCKED: Blocked due to {type} attack (Severity: {severity}, Reputation: {reputation})",
        ip_blocked_threshold: "IP_BLOCKED: {type} threshold exceeded ({count}/{threshold})"
    }
};

// Default language
let currentLanguage: 'tr' | 'en' = 'en';

// Language switching function
export function setLanguage(language: 'tr' | 'en') {
    currentLanguage = language;
}

// Translation function - Always use English for logs
function t(key: string, params?: Record<string, string | number>): string {
    // Always use English for logs
    let message = translations['en'][key as keyof typeof translations.tr] || key;
    
    if (params) {
        Object.entries(params).forEach(([param, value]) => {
            message = message.replace(`{${param}}`, String(value));
        });
    }
    
    return message;
}

// Log writing and real-time notification helper function
function writeLogAndBroadcast(logPath: string, logEntry: string) {
    fs.appendFileSync(logPath, logEntry);
    
    // Send log update notification
    if (broadcastLogUpdate) {
        const parts = logEntry.trim().split(' - ');
        broadcastLogUpdate({
            timestamp: parts[0],
            ip: parts[1],
            message: parts.slice(2).join(' - ')
        });
    }
}

// WAF Middleware
export function wafMiddleware(req: Request, res: Response, next: NextFunction) {
    const ip = getClientIp(req);
    const logPath = path.join(__dirname, '../../../waf-log.txt');
    const suspiciousLogPath = path.join(__dirname, '../../../waf-suspicious-log.txt');
    
    // Reload security lists for current state
    const currentWhitelist = loadList(whitelistPath);
    const currentPersistentBlacklist = loadList(blacklistPath);
    const currentTempBlacklist = loadTemporaryBlocklist();
    
    // Log normal requests
    const logEntry = `${new Date().toISOString()} - ${ip} - ${req.method} ${req.url}\n`;
    writeLogAndBroadcast(logPath, logEntry);

    // Rate limiting check
    if (!checkRateLimit(ip)) {
        const reputation = getIPReputation(ip);
        if (reputation.requestLimiter.violationCount >= VIOLATION_THRESHOLD) {
            temporaryBlocklist.add(ip);
            persistTemporaryBlocklist();
            
            const rateLimitLogEntry = `${new Date().toISOString()} - ${ip} - BLOCKED: Rate limit violation (${reputation.requestLimiter.violationCount} violations)\n`;
            writeLogAndBroadcast(suspiciousLogPath, rateLimitLogEntry);
            
            // Send real-time notification
            if (broadcastIPBlocked) {
                broadcastIPBlocked({
                    ip,
                    attackType: 'RATE_LIMIT',
                    timestamp: new Date().toISOString(),
                    reason: `BLOCKED: Rate limit violation (${reputation.requestLimiter.violationCount} violations)`
                });
            }
            
            return res.status(429).json({ 
                error: 'Rate limit exceeded. IP address has been blocked.',
                retryAfter: 3600
            });
        } else {
            const rateLimitWarningEntry = `${new Date().toISOString()} - ${ip} - RATE_LIMIT_WARNING: ${reputation.requestLimiter.requestCount} requests per minute\n`;
            writeLogAndBroadcast(suspiciousLogPath, rateLimitWarningEntry);
            
            return res.status(429).json({ 
                error: 'Rate limit exceeded. Please send requests more slowly.',
                retryAfter: 60
            });
        }
    }

    // Temporary blacklist check
    if (currentTempBlacklist.has(ip) || temporaryBlocklist.has(ip)) {
        const blockLogEntry = `${new Date().toISOString()} - ${ip} - BLOCKED: In temporary blacklist\n`;
        writeLogAndBroadcast(suspiciousLogPath, blockLogEntry);
        return res.status(403).json({ error: 'BLOCKED: In temporary blacklist' });
    }

    // Persistent blacklist check
    if (currentPersistentBlacklist.has(ip)) {
        const blockLogEntry = `${new Date().toISOString()} - ${ip} - BLOCKED: In persistent blacklist\n`;
        writeLogAndBroadcast(suspiciousLogPath, blockLogEntry);
        return res.status(403).json({ error: 'BLOCKED: In persistent blacklist' });
    }

    // Attack detection - Check whitelisted IPs as well
    const requestData = JSON.stringify({ 
        body: req.body, 
        query: req.query, 
        params: req.params,
        headers: req.headers 
    }).toLowerCase();

    let attackDetected = false;
    let attackType: AttackType | null = null;
    let attackSeverity = 1;

    // SQL Injection detection
    const sqlPatterns = [
        /(\bor\b|\band\b)\s+\d+\s*=\s*\d+/,
        /union\s+select/,
        /select\s+.*\s+from/,
        /insert\s+into/,
        /delete\s+from/,
        /update\s+.*\s+set/,
        /drop\s+table/,
        /create\s+table/,
        /alter\s+table/,
        /exec\s*\(/,
        /execute\s*\(/,
        /sp_/,
        /xp_/,
        /--/,
        /\/\*/,
        /\*\//,
        /;/,
        /'/,
        /"/,
        /`/,
        /\\/,
        /%27/,
        /%22/,
        /%2d%2d/,
        /%2f%2a/,
        /%2a%2f/
    ];

    if (sqlPatterns.some(pattern => pattern.test(requestData))) {
        attackDetected = true;
        attackType = 'SQL_INJECTION';
        attackSeverity = calculateAttackSeverity(attackType, requestData);
    }

    // XSS detection
    const xssPatterns = [
        /<script/,
        /<\/script>/,
        /javascript:/,
        /on\w+\s*=/,
        /<iframe/,
        /<object/,
        /<embed/,
        /<link/,
        /<meta/,
        /<style/,
        /expression\s*\(/,
        /eval\s*\(/,
        /alert\s*\(/,
        /confirm\s*\(/,
        /prompt\s*\(/,
        /document\./,
        /window\./,
        /%3cscript/,
        /%3c%2fscript%3e/,
        /&lt;script/,
        /&lt;\/script&gt;/
    ];

    if (xssPatterns.some(pattern => pattern.test(requestData))) {
        attackDetected = true;
        attackType = 'XSS';
        attackSeverity = calculateAttackSeverity(attackType, requestData);
    }

    // Command Injection detection
    const cmdPatterns = [
        /;\s*(ls|dir|cat|type|more|less|head|tail|grep|find|ps|netstat|whoami|id|uname|pwd|cd)\b/,
        /\|\s*(ls|dir|cat|type|more|less|head|tail|grep|find|ps|netstat|whoami|id|uname|pwd|cd)\b/,
        /&&\s*(ls|dir|cat|type|more|less|head|tail|grep|find|ps|netstat|whoami|id|uname|pwd|cd)\b/,
        /\$\(/,
        /`[^`]*`/,
        /\|\|/,
        /&amp;&amp;/,
        /%3b/,
        /%7c/,
        /%26/
    ];

    if (cmdPatterns.some(pattern => pattern.test(requestData))) {
        attackDetected = true;
        attackType = 'COMMAND_INJECTION';
        attackSeverity = calculateAttackSeverity(attackType, requestData);
    }

    // File Inclusion detection
    const filePatterns = [
        /\.\.\//,
        /\.\.%2f/,
        /\.\.%5c/,
        /\.\.\\/,
        /\/etc\/passwd/,
        /\/etc\/shadow/,
        /\/proc\/self\/environ/,
        /\/var\/log/,
        /c:\\windows\\system32/,
        /c:%5cwindows%5csystem32/,
        /file:\/\//,
        /php:\/\//,
        /data:\/\//,
        /expect:\/\//,
        /zip:\/\//
    ];

    if (filePatterns.some(pattern => pattern.test(requestData))) {
        attackDetected = true;
        attackType = 'FILE_INCLUSION';
        attackSeverity = calculateAttackSeverity(attackType, requestData);
    }

    // Whitelist check - After attack detection
    if (currentWhitelist.has(ip)) {
        if (attackDetected && attackType) {
            // Whitelisted IP is attacking - remove from whitelist and add to blacklist
            whitelist.delete(ip);
            saveList(whitelistPath, whitelist);
            temporaryBlocklist.add(ip);
            persistTemporaryBlocklist();
            
            // Lower IP reputation
            updateIPReputation(ip, attackType, attackSeverity, true);
            const reputation = getIPReputation(ip);
            
            // Set block timeout
            const blockDuration = getBlockDuration(attackType, attackSeverity, reputation.reputationScore);
            const timeoutId = setTimeout(() => {
                temporaryBlocklist.delete(ip);
                persistTemporaryBlocklist();
                delete blockTimeouts[ip];
                console.log(`⏰ Auto-unblock: IP ${ip} automatically unblocked after ${blockDuration} minutes`);
            }, blockDuration * 60 * 1000);
            
            blockTimeouts[ip] = timeoutId;
            console.log(`⏱️ Block timeout set for IP ${ip}: ${blockDuration} minutes`);
            
            const whitelistViolationEntry = `${new Date().toISOString()} - ${ip} - WHITELIST_VIOLATION: ${attackType} attack detected, removed from whitelist and blocked (Severity: ${attackSeverity}, Reputation: ${reputation.reputationScore})\n`;
            writeLogAndBroadcast(suspiciousLogPath, whitelistViolationEntry);
            
            // Send real-time notification
            if (broadcastIPBlocked) {
                broadcastIPBlocked({
                    ip,
                    attackType,
                    timestamp: new Date().toISOString(),
                    reason: `WHITELIST_VIOLATION: ${attackType} attack detected, removed from whitelist`,
                    severity: attackSeverity,
                    reputation: reputation.reputationScore,
                    blockDuration: `${blockDuration} minutes`
                });
            }
            
            return res.status(403).json({ 
                error: 'WHITELIST_VIOLATION: Attack detected from trusted IP, access revoked',
                attackType,
                severity: attackSeverity,
                blockDuration: `${blockDuration} minutes`,
                reputation: reputation.reputationScore
            });
        } else {
            // Whitelisted IP making normal request - allow through
            const whitelistLogEntry = `${new Date().toISOString()} - ${ip} - WHITELIST: Request passed through whitelist\n`;
            writeLogAndBroadcast(suspiciousLogPath, whitelistLogEntry);
            return next();
        }
    }

    if (attackDetected && attackType) {
        const count = incrementAttackCount(ip, attackType);
        const adaptiveThreshold = getAdaptiveThreshold(attackType, ip);
        
        // Update IP reputation
        updateIPReputation(ip, attackType, attackSeverity, false);
        
        const suspiciousLogEntry = `${new Date().toISOString()} - ${ip} - ${attackType}: Attack detected (${count}/${adaptiveThreshold}) Severity: ${attackSeverity} - ${req.method} ${req.url}\n`;
        writeLogAndBroadcast(suspiciousLogPath, suspiciousLogEntry);

        // Send real-time notification
        if (broadcastThreatDetected) {
            broadcastThreatDetected({
                ip,
                attackType,
                count,
                threshold: adaptiveThreshold,
                severity: attackSeverity,
                timestamp: new Date().toISOString(),
                method: req.method,
                url: req.url,
                userAgent: req.headers['user-agent'] || 'Unknown',
                reputation: getIPReputation(ip).reputationScore
            });
        }

        if (count >= adaptiveThreshold) {
            temporaryBlocklist.add(ip);
            persistTemporaryBlocklist();
            
            // Update IP reputation (blocked)
            updateIPReputation(ip, attackType, attackSeverity, true);
            
            const blockLogEntry = `${new Date().toISOString()} - ${ip} - IP_BLOCKED: Blocked due to ${attackType} attack (Severity: ${attackSeverity}, Reputation: ${getIPReputation(ip).reputationScore})\n`;
            writeLogAndBroadcast(suspiciousLogPath, blockLogEntry);
            
            // Send real-time notification
            if (broadcastIPBlocked) {
                broadcastIPBlocked({
                    ip,
                    attackType,
                    timestamp: new Date().toISOString(),
                    reason: `IP_BLOCKED: Blocked due to ${attackType} attack (Severity: ${attackSeverity}, Reputation: ${getIPReputation(ip).reputationScore})`,
                    reputation: getIPReputation(ip).reputationScore
                });
            }
            
            // Remove block after specified duration based on reputation
            const blockDuration = getBlockDuration(attackType, attackSeverity, getIPReputation(ip).reputationScore);
            
            // Store timeout ID
            const timeoutId = setTimeout(() => {
                temporaryBlocklist.delete(ip);
                persistTemporaryBlocklist();
                delete blockTimeouts[ip];
                const unblockLogEntry = `${new Date().toISOString()} - ${ip} - AUTO_UNBLOCK: Block removed after ${blockDuration} minutes\n`;
                writeLogAndBroadcast(suspiciousLogPath, unblockLogEntry);
                console.log(`⏰ Auto unblock: IP ${ip} automatically unblocked after ${blockDuration} minutes`);
            }, blockDuration * 60 * 1000);
            
            // Store timeout ID
            blockTimeouts[ip] = timeoutId;
            console.log(`⏱️ Block timeout set for IP ${ip}: ${blockDuration} minutes`);

            return res.status(403).json({ 
                error: `IP_BLOCKED: Blocked due to ${attackType} attack (Severity: ${attackSeverity}, Reputation: ${getIPReputation(ip).reputationScore})`,
                attackType,
                severity: attackSeverity,
                blockDuration: `${blockDuration} minutes`,
                reputation: getIPReputation(ip).reputationScore
            });
        }
    }

    next();
}

function getBlockDuration(attackType: AttackType, severity: number, reputation: number): number {
    const baseDurations: Record<AttackType, number> = {
        SQL_INJECTION: 120,
        XSS: 60,
        COMMAND_INJECTION: 120,
        FILE_INCLUSION: 90
    };
    
    let duration = baseDurations[attackType];
    
    // Increase duration based on severity
    duration = duration * (severity / 5);
    
    // Adjust duration based on reputation
    if (reputation < 20) {
        duration = duration * 2;
    } else if (reputation > 80) {
        duration = duration * 0.5;
    }
    
    return Math.round(Math.max(30, Math.min(480, duration)));
} 