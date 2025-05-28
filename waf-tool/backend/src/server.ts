/**
 * TitanWAF - Advanced Web Application Firewall
 * 
 * Express.js server with real-time WebSocket communication
 * Provides admin API endpoints and protected test routes
 * 
 * @author TitanWAF Team
 * @version 1.0.0
 * @license MIT
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import fs from 'fs';
import path from 'path';
import { wafMiddleware, getWafStats, removeFromBlacklist, temporaryBlocklist, initializeBroadcastHandlers, setLanguage, addToWhitelist, removeFromWhitelist } from './waf';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const port = 3003;

// Middleware configuration
app.use(cors());
app.use(express.json());

// File system paths
const suspiciousLogPath = path.join(__dirname, '../../../waf-suspicious-log.txt');

// WebSocket connection management
io.on('connection', (socket) => {
  console.log('TitanWAF Admin Panel Connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('TitanWAF Admin Panel Disconnected:', socket.id);
  });
});

/**
 * Broadcast real-time threat detection events
 * @param threatData - Threat detection data
 */
function broadcastThreatDetection(threatData: any) {
  io.emit('newAttack', threatData);
}

/**
 * Broadcast real-time IP blocking events
 * @param blockingData - IP blocking data
 */
function broadcastIPBlocking(blockingData: any) {
  io.emit('ipBlocked', blockingData);
}

/**
 * Broadcast real-time log update events
 * @param logData - Log update data
 */
function broadcastLogUpdates(logData: any) {
  io.emit('logUpdate', logData);
}

// Initialize WAF broadcast handlers
initializeBroadcastHandlers(broadcastThreatDetection, broadcastIPBlocking, broadcastLogUpdates);

// Admin API endpoints (exempt from WAF protection)
app.get('/api/waf/stats', (req: Request, res: Response) => {
  try {
    const stats = getWafStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
});

app.get('/api/waf/blocked-ips', (req: Request, res: Response) => {
  try {
    const blockedIPs = Array.from(temporaryBlocklist).map(ip => ({
      ip,
      blockedAt: new Date().toISOString(),
      reason: 'Threat detection'
    }));
    res.json(blockedIPs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve blocked IPs' });
  }
});

app.get('/api/waf/attack-logs', (req: Request, res: Response) => {
  try {
    if (!fs.existsSync(suspiciousLogPath)) {
      return res.json([]);
    }
    
    const logs = fs.readFileSync(suspiciousLogPath, 'utf8')
      .split('\n')
      .filter(line => line.trim())
      .slice(-100) // Last 100 logs
      .map(line => {
        const parts = line.split(' - ');
        return {
          timestamp: parts[0],
          ip: parts[1],
          message: parts.slice(2).join(' - ')
        };
      })
      .reverse(); // Show newest logs first
    
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve attack logs' });
  }
});

app.delete('/api/waf/unblock/:ip', (req: Request, res: Response) => {
  try {
    const { ip } = req.params;
    removeFromBlacklist(ip);
    res.json({ message: `${ip} address removed from blocklist` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unblock IP address' });
  }
});

app.post('/api/waf/block-ip', (req: Request, res: Response) => {
  try {
    const { ip } = req.body;
    if (!ip) {
      return res.status(400).json({ error: 'IP address is required' });
    }
    
    temporaryBlocklist.add(ip);
    res.json({ message: `${ip} address has been blocked` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to block IP address' });
  }
});

app.get('/api/waf/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    service: 'TitanWAF',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Whitelist management endpoints
app.post('/api/waf/whitelist', (req: Request, res: Response) => {
  try {
    const { ip } = req.body;
    if (!ip) {
      return res.status(400).json({ error: 'IP address is required' });
    }
    
    addToWhitelist(ip);
    res.json({ message: `${ip} address has been added to whitelist` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add IP to whitelist' });
  }
});

app.delete('/api/waf/whitelist/:ip', (req: Request, res: Response) => {
  try {
    const { ip } = req.params;
    removeFromWhitelist(ip);
    res.json({ message: `${ip} address removed from whitelist` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove IP from whitelist' });
  }
});

app.get('/api/waf/whitelist', (req: Request, res: Response) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const whitelistPath = path.join(__dirname, '../../whitelist.txt');
    
    if (!fs.existsSync(whitelistPath)) {
      return res.json([]);
    }
    
    const whitelistedIPs = fs.readFileSync(whitelistPath, 'utf8')
      .split('\n')
      .map((ip: string) => ip.trim())
      .filter((ip: string) => ip && ip.length > 0)
      .map((ip: string) => ({
        ip,
        addedAt: new Date().toISOString(),
        reason: 'Trusted IP'
      }));
    
    res.json(whitelistedIPs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve whitelisted IPs' });
  }
});

// Language switching endpoint
app.post('/api/waf/language', (req: Request, res: Response) => {
  try {
    const { language } = req.body;
    if (!language || !['tr', 'en'].includes(language)) {
      return res.status(400).json({ error: 'Invalid language. Must be tr or en.' });
    }
    
    setLanguage(language);
    res.json({ message: `Language changed to ${language}`, language });
  } catch (error) {
    res.status(500).json({ error: 'Failed to change language' });
  }
});

// WAF-protected endpoints
app.use('/login', wafMiddleware);
app.use('/contact', wafMiddleware);
app.use('/search', wafMiddleware);
app.use('/file', wafMiddleware);
app.use('/api/test', wafMiddleware);

// Test endpoints for security validation
app.post('/login', (req: Request, res: Response) => {
  res.json({ message: 'Login endpoint - Protected by TitanWAF' });
});

app.post('/contact', (req: Request, res: Response) => {
  res.json({ message: 'Contact endpoint - Protected by TitanWAF' });
});

app.post('/search', (req: Request, res: Response) => {
  res.json({ message: 'Search endpoint - Protected by TitanWAF' });
});

app.get('/file', (req: Request, res: Response) => {
  res.json({ message: 'File endpoint - Protected by TitanWAF' });
});

app.post('/api/test', (req: Request, res: Response) => {
  res.json({ message: 'Test endpoint - Protected by TitanWAF' });
});

// Start TitanWAF server
server.listen(port, () => {
  console.log(`🛡️  TitanWAF Admin API Server running on port ${port}`);
  console.log(`📊 Admin API endpoints (WAF exempt):`);
  console.log(`   - GET /api/waf/stats`);
  console.log(`   - GET /api/waf/blocked-ips`);
  console.log(`   - GET /api/waf/attack-logs`);
  console.log(`   - DELETE /api/waf/unblock/:ip`);
  console.log(`   - POST /api/waf/block-ip`);
  console.log(`   - GET /api/waf/whitelist`);
  console.log(`   - POST /api/waf/whitelist`);
  console.log(`   - DELETE /api/waf/whitelist/:ip`);
  console.log(`   - GET /api/waf/health`);
  console.log(`🔒 Protected test endpoints (WAF enabled):`);
  console.log(`   - POST /api/test`);
  console.log(`   - POST /login`);
  console.log(`   - POST /contact`);
  console.log(`   - POST /search`);
  console.log(`   - GET /file`);
  console.log(`🚀 TitanWAF is ready to protect your applications!`);
}); 