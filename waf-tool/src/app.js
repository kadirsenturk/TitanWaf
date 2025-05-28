import express from 'express';
import { wafMiddleware } from './middleware/waf';
var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// WAF middleware'i burada!
app.use(wafMiddleware);
app.get('/login', function (req, res) {
    res.send('<form method="POST"><input name="username"><input name="password"><button type="submit">Giriş</button></form>');
});
app.post('/login', function (req, res) {
    var _a = req.body, username = _a.username, password = _a.password;
    res.send("Kullan\u0131c\u0131 ad\u0131: ".concat(username, ", \u015Eifre: ").concat(password));
});
app.listen(3000, function () {
    console.log('Server is running on port 3000');
});
