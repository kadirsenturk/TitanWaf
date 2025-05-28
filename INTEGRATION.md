# 🔗 TitanWAF Integration Guide

Complete guide for integrating TitanWAF with your existing web applications and websites.

## 🎯 Integration Overview

TitanWAF can be integrated with your web applications in several ways:

1. **Reverse Proxy Mode** (Recommended) - TitanWAF sits in front of your application
2. **Middleware Integration** - Direct integration into your Node.js/Express applications
3. **API Gateway Mode** - Protect multiple services through a single entry point
4. **Cloud Integration** - Deploy with cloud load balancers and CDNs

## 🛡️ Method 1: Reverse Proxy Mode (Recommended)

This is the most common and secure way to protect existing websites without modifying application code.

### Architecture
```
Internet → TitanWAF (Port 80/443) → Your Website (Port 8080/3000/etc)
```

### Step 1: Configure TitanWAF as Reverse Proxy

Create `nginx-proxy.conf`:
```nginx
# /etc/nginx/sites-available/titanwaf-proxy
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    
    # TitanWAF Integration
    location / {
        # First pass through TitanWAF
        proxy_pass http://127.0.0.1:3003/proxy;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Original-URI $request_uri;
        
        # TitanWAF will forward clean requests to your app
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # TitanWAF Admin Panel (restrict access)
    location /titanwaf-admin {
        allow 192.168.1.0/24;  # Your admin network
        allow 10.0.0.0/8;      # Internal network
        deny all;
        
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Step 2: Configure TitanWAF Backend for Proxy Mode

Modify `waf-tool/backend/src/server.ts`:
```typescript
// Add proxy endpoint
app.use('/proxy', (req: Request, res: Response, next: NextFunction) => {
    // Apply WAF protection
    wafMiddleware(req, res, (error?: any) => {
        if (error) {
            // Request blocked by WAF
            return res.status(403).json({
                error: 'Request blocked by security policy',
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'] || 'unknown'
            });
        }
        
        // Forward clean requests to your application
        const targetUrl = process.env.TARGET_APP_URL || 'http://localhost:8080';
        
        const options = {
            target: targetUrl,
            changeOrigin: true,
            pathRewrite: {
                '^/proxy': '' // Remove /proxy prefix
            },
            onError: (err: any, req: Request, res: Response) => {
                console.error('Proxy error:', err);
                res.status(502).json({ error: 'Bad Gateway' });
            }
        };
        
        const proxy = createProxyMiddleware(options);
        proxy(req, res, next);
    });
});
```

### Step 3: Environment Configuration

Create `.env` file:
```env
# TitanWAF Configuration
NODE_ENV=production
PORT=3003
TARGET_APP_URL=http://localhost:8080  # Your actual application

# Security Settings
RATE_LIMIT_WINDOW=60000
MAX_REQUESTS_PER_WINDOW=1000
BLOCK_DURATION=300000
WHITELIST_AUTO_ADD=true

# Logging
LOG_LEVEL=info
ENABLE_DETAILED_LOGS=true
```

## 🔧 Method 2: Middleware Integration

For Node.js/Express applications, integrate TitanWAF directly as middleware.

### Step 1: Install TitanWAF as Package

```bash
# In your existing project
npm install titanwaf-middleware
```

### Step 2: Integrate into Your Express App

```javascript
// app.js or server.js
const express = require('express');
const { TitanWAF } = require('titanwaf-middleware');

const app = express();

// Initialize TitanWAF
const waf = new TitanWAF({
    logLevel: 'info',
    rateLimit: {
        windowMs: 60000,
        maxRequests: 100
    },
    adaptiveThresholds: {
        SQL_INJECTION: { base: 5, min: 2, max: 10 },
        XSS: { base: 3, min: 1, max: 8 }
    },
    whitelist: ['192.168.1.0/24'], // Your trusted networks
    enableRealTimeMonitoring: true
});

// Apply WAF protection to all routes
app.use(waf.middleware());

// Your existing routes
app.get('/', (req, res) => {
    res.send('Hello World - Protected by TitanWAF!');
});

app.post('/api/users', (req, res) => {
    // This endpoint is now protected
    res.json({ message: 'User created successfully' });
});

// WAF Admin endpoints (optional)
app.use('/waf-admin', waf.adminRoutes());

app.listen(3000, () => {
    console.log('🛡️ Application running with TitanWAF protection on port 3000');
});
```

### Step 3: Custom Protection Rules

```javascript
// Custom protection for specific endpoints
app.post('/api/login', 
    waf.customProtection({
        maxAttempts: 5,
        blockDuration: 900000, // 15 minutes
        enableCaptcha: true
    }),
    (req, res) => {
        // Login logic
    }
);

// Protect file uploads
app.post('/api/upload',
    waf.fileProtection({
        maxSize: '10MB',
        allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        scanForMalware: true
    }),
    (req, res) => {
        // File upload logic
    }
);
```

## 🌐 Method 3: API Gateway Mode

Protect multiple services through a single TitanWAF instance.

### Architecture
```
Internet → TitanWAF Gateway → Service 1 (API)
                           → Service 2 (Web App)
                           → Service 3 (Admin Panel)
```

### Configuration

```javascript
// gateway-config.js
const services = {
    'api.yourdomain.com': {
        target: 'http://api-service:3001',
        protection: 'high',
        rateLimit: 1000
    },
    'app.yourdomain.com': {
        target: 'http://web-app:3002',
        protection: 'medium',
        rateLimit: 500
    },
    'admin.yourdomain.com': {
        target: 'http://admin-panel:3003',
        protection: 'maximum',
        rateLimit: 100,
        whitelist: ['192.168.1.0/24']
    }
};

// Apply service-specific protection
app.use((req, res, next) => {
    const host = req.get('host');
    const service = services[host];
    
    if (!service) {
        return res.status(404).json({ error: 'Service not found' });
    }
    
    // Apply service-specific WAF rules
    const wafConfig = getWAFConfig(service.protection);
    wafMiddleware(wafConfig)(req, res, next);
});
```

## ☁️ Method 4: Cloud Integration

### AWS Application Load Balancer + TitanWAF

```yaml
# aws-alb-config.yml
Resources:
  TitanWAFTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Port: 3003
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckPath: /api/waf/health
      
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
        
  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TitanWAFTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
```

### Cloudflare + TitanWAF

```javascript
// cloudflare-worker.js
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    // Pre-filter with Cloudflare
    const clientIP = request.headers.get('CF-Connecting-IP');
    
    // Forward to TitanWAF
    const titanwafUrl = 'https://your-titanwaf-instance.com/proxy';
    const modifiedRequest = new Request(titanwafUrl, {
        method: request.method,
        headers: {
            ...request.headers,
            'X-Original-URL': request.url,
            'X-Client-IP': clientIP
        },
        body: request.body
    });
    
    return fetch(modifiedRequest);
}
```

## 🔒 WordPress Integration

Protect WordPress sites with TitanWAF.

### Step 1: WordPress Plugin (Custom)

```php
<?php
// wp-content/plugins/titanwaf/titanwaf.php
/*
Plugin Name: TitanWAF Protection
Description: Integrates TitanWAF security for WordPress
Version: 1.0.0
*/

class TitanWAF_WordPress {
    private $waf_endpoint = 'http://localhost:3003/validate';
    
    public function __construct() {
        add_action('init', array($this, 'check_request'));
        add_action('wp_login_failed', array($this, 'log_failed_login'));
    }
    
    public function check_request() {
        $request_data = array(
            'url' => $_SERVER['REQUEST_URI'],
            'method' => $_SERVER['REQUEST_METHOD'],
            'ip' => $this->get_client_ip(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'],
            'post_data' => $_POST,
            'get_data' => $_GET
        );
        
        $response = wp_remote_post($this->waf_endpoint, array(
            'body' => json_encode($request_data),
            'headers' => array('Content-Type' => 'application/json')
        ));
        
        if (is_wp_error($response)) {
            return; // Allow request if WAF is down
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if ($data['blocked']) {
            wp_die('Request blocked by security policy', 'Security Alert', array('response' => 403));
        }
    }
    
    private function get_client_ip() {
        $ip_keys = array('HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR');
        foreach ($ip_keys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                return $_SERVER[$key];
            }
        }
        return '0.0.0.0';
    }
}

new TitanWAF_WordPress();
?>
```

### Step 2: .htaccess Configuration

```apache
# .htaccess
RewriteEngine On

# Redirect all requests through TitanWAF first
RewriteCond %{REQUEST_URI} !^/titanwaf-check
RewriteRule ^(.*)$ http://localhost:3003/wordpress-proxy/$1 [P,L]

# Block direct access to sensitive files
<Files "wp-config.php">
    Order allow,deny
    Deny from all
</Files>
```

## 🛠️ E-commerce Integration (Shopify, WooCommerce)

### Shopify App Integration

```javascript
// shopify-app/server.js
const express = require('express');
const { TitanWAF } = require('titanwaf-middleware');

const app = express();

// Initialize TitanWAF for e-commerce
const waf = new TitanWAF({
    ecommerce: true,
    protectCheckout: true,
    fraudDetection: true,
    paymentProtection: {
        enabled: true,
        maxAmount: 10000,
        suspiciousPatterns: ['rapid_purchases', 'multiple_cards']
    }
});

// Protect all Shopify webhooks
app.use('/webhooks', waf.webhookProtection());

// Protect customer data endpoints
app.use('/api/customers', waf.dataProtection({
    piiProtection: true,
    encryptionRequired: true
}));

app.listen(3000);
```

### WooCommerce Integration

```php
// wp-content/themes/your-theme/functions.php
add_action('woocommerce_checkout_process', 'titanwaf_protect_checkout');

function titanwaf_protect_checkout() {
    $waf_data = array(
        'action' => 'checkout',
        'customer_ip' => WC_Geolocation::get_ip_address(),
        'order_total' => WC()->cart->get_total(''),
        'payment_method' => WC()->session->get('chosen_payment_method'),
        'billing_email' => $_POST['billing_email']
    );
    
    $response = wp_remote_post('http://localhost:3003/ecommerce/validate', array(
        'body' => json_encode($waf_data),
        'headers' => array('Content-Type' => 'application/json')
    ));
    
    $result = json_decode(wp_remote_retrieve_body($response), true);
    
    if ($result['blocked']) {
        wc_add_notice($result['message'], 'error');
    }
}
```

## 📊 Monitoring and Analytics Integration

### Google Analytics Integration

```javascript
// Send security events to GA
function sendSecurityEvent(eventType, details) {
    gtag('event', 'security_event', {
        'event_category': 'TitanWAF',
        'event_label': eventType,
        'custom_parameter_1': details.ip,
        'custom_parameter_2': details.attack_type
    });
}

// In your WAF event handler
waf.on('attack_detected', (event) => {
    sendSecurityEvent('attack_blocked', {
        ip: event.ip,
        attack_type: event.type,
        severity: event.severity
    });
});
```

### Slack/Discord Notifications

```javascript
// notifications.js
const { WebClient } = require('@slack/web-api');
const slack = new WebClient(process.env.SLACK_TOKEN);

waf.on('high_severity_attack', async (event) => {
    await slack.chat.postMessage({
        channel: '#security-alerts',
        text: `🚨 High severity attack detected!
        IP: ${event.ip}
        Type: ${event.attack_type}
        Target: ${event.target_url}
        Time: ${new Date().toISOString()}`
    });
});
```

## 🔧 Custom Rules and Configurations

### Industry-Specific Configurations

```javascript
// healthcare-config.js (HIPAA Compliance)
const healthcareWAF = new TitanWAF({
    compliance: 'HIPAA',
    dataProtection: {
        piiDetection: true,
        phiProtection: true,
        auditLogging: true
    },
    customRules: [
        {
            name: 'PHI_Protection',
            pattern: /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
            action: 'block',
            severity: 10
        }
    ]
});

// financial-config.js (PCI DSS Compliance)
const financialWAF = new TitanWAF({
    compliance: 'PCI_DSS',
    paymentProtection: true,
    customRules: [
        {
            name: 'Credit_Card_Protection',
            pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,
            action: 'encrypt_and_log',
            severity: 9
        }
    ]
});
```

## 🚀 Performance Optimization

### Caching Integration

```javascript
// redis-cache.js
const redis = require('redis');
const client = redis.createClient();

// Cache WAF decisions
waf.use('cache', {
    provider: 'redis',
    client: client,
    ttl: 300, // 5 minutes
    keyPrefix: 'titanwaf:'
});

// Cache whitelist lookups
waf.use('whitelist_cache', {
    enabled: true,
    size: 10000,
    ttl: 3600
});
```

### CDN Integration

```javascript
// cdn-config.js
const cdnWAF = new TitanWAF({
    cdn: {
        enabled: true,
        provider: 'cloudflare',
        edgeRules: true,
        geoBlocking: ['CN', 'RU'], // Block specific countries
        rateLimitByCountry: {
            'US': 1000,
            'EU': 800,
            'default': 100
        }
    }
});
```

## 📋 Integration Checklist

### Pre-Integration
- [ ] Backup your current website/application
- [ ] Test TitanWAF in staging environment
- [ ] Configure SSL certificates
- [ ] Set up monitoring and alerting
- [ ] Plan rollback strategy

### During Integration
- [ ] Deploy TitanWAF instance
- [ ] Configure reverse proxy/middleware
- [ ] Test all critical user flows
- [ ] Verify admin panel access
- [ ] Check performance impact

### Post-Integration
- [ ] Monitor attack logs for false positives
- [ ] Fine-tune security rules
- [ ] Set up automated backups
- [ ] Configure alerting thresholds
- [ ] Document configuration for team

## 🆘 Troubleshooting Common Integration Issues

### Issue: High False Positive Rate
```bash
# Solution: Adjust thresholds
curl -X POST http://localhost:3003/api/waf/config \
  -H "Content-Type: application/json" \
  -d '{
    "adaptive_thresholds": {
      "SQL_INJECTION": {"base": 8, "min": 5, "max": 15}
    }
  }'
```

### Issue: Performance Impact
```javascript
// Solution: Enable caching and optimize rules
const optimizedWAF = new TitanWAF({
    performance: {
        enableCaching: true,
        asyncProcessing: true,
        batchLogging: true,
        skipStaticFiles: true
    }
});
```

### Issue: SSL/TLS Problems
```nginx
# Solution: Proper SSL termination
server {
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://titanwaf:3003;
        proxy_ssl_verify off;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📞 Support and Resources

### Getting Help
- **Integration Support**: integration@titanwaf.com
- **Documentation**: [Integration Wiki](https://github.com/yourusername/TitanWAF/wiki/integration)
- **Community**: [Discord Server](https://discord.gg/titanwaf)
- **Professional Services**: Available for enterprise customers

### Additional Resources
- **Video Tutorials**: Step-by-step integration guides
- **Sample Configurations**: Ready-to-use configs for popular platforms
- **Best Practices**: Security recommendations and optimization tips
- **Migration Tools**: Automated migration from other WAF solutions

---

**🛡️ Your website is now protected by TitanWAF!**

*Enterprise-grade security made simple.* 