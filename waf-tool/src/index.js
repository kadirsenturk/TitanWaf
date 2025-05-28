import express from 'express';
import { wafMiddleware } from './middleware/waf';
import wafRoutes from './api/waf';
var app = express();
var port = process.env.PORT || 3000;
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// WAF middleware'ini tüm isteklere uygula
app.use(wafMiddleware);
// WAF API rotaları
app.use('/api/waf', wafRoutes);
// Ana sayfa
app.get('/', function (_, res) {
    res.json({ message: 'WAF API is running' });
});
// Sunucuyu başlat
app.listen(port, function () {
    console.log("WAF server is running on port ".concat(port));
});
