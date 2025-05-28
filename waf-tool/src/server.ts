import express from 'express';

const app = express();

app.use(express.urlencoded({ extended: true }));

app.get('/login', (req, res) => {
    res.send('<form method="POST"><input name="username"><input name="password"><button type="submit">Giriş</button></form>');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // Burada kullanıcı adı ve şifre ile ilgili işlemleri yapabilirsiniz
    res.send(`Kullanıcı adı: ${username}, Şifre: ${password}`);
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});