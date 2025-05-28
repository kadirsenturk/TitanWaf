import express, { Request, Response } from 'express';
import { wafMiddleware } from './middleware/waf';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// WAF middleware'i burada!
app.use(wafMiddleware);

app.get('/login', (req, res) => {
    res.send('<form method="POST"><input name="username"><input name="password"><button type="submit">Giriş</button></form>');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    res.send(`Kullanıcı adı: ${username}, Şifre: ${password}`);
});

app.get('/', (req, res) => {
  res.send('Backend çalışıyor!');
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});