import express from 'express';
var app = express();
app.use(express.urlencoded({ extended: true }));
app.get('/login', function (req, res) {
    res.send('<form method="POST"><input name="username"><input name="password"><button type="submit">Giriş</button></form>');
});
app.post('/login', function (req, res) {
    var _a = req.body, username = _a.username, password = _a.password;
    // Burada kullanıcı adı ve şifre ile ilgili işlemleri yapabilirsiniz
    res.send("Kullan\u0131c\u0131 ad\u0131: ".concat(username, ", \u015Eifre: ").concat(password));
});
app.listen(3000, function () {
    console.log('Server is running on port 3000');
});
