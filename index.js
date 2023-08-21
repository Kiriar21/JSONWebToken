import express from 'express';
import jsonwebtoken from 'jsonwebtoken';
import config from './config.js';

const app = express();

app.use(express.json())

const ACCESS_TOKEN = config.ACCESS_TOKEN 
const REFRESH_TOKEN = config.REFRESH_TOKEN

const authMiddleware = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token){
        return res.sendStatus(401);
    }

    jsonwebtoken.verify(token, ACCESS_TOKEN, (err, data) => {
        console.log(data)
        if(err){
            console.log("NIeprawidłowy token")
            return res.sendStatus(403);
        }
        console.log("Prawidłowy token")
        req.user = data;
        next();
    })
}

//imitacja BD
const users = [
    { id: 1, email: 'kiriar@gmail.com', name: 'Kiriar'},
    { id: 2, email: 'kiriar@o2.com', name: 'Kiriar1'}
]

let refreshTokens = []

app.get('/', (req, res) => {
    res.send("Witaj na stronie głównej.")
})
app.get('/admin', authMiddleware, (req, res) => {
    res.send("Witaj w panelu admina")
})
app.post('/login', (req, res) => {
    const user = users.find(user => user.email === req.body.email)
    //Powinno byc czy uzytkownik istnieje i czy haslo sie zgadza
    if(!user){
        return res.sendStatus(401); // nieautoryzowany uzytkownik
    }
    const payload = user;
    const token = jsonwebtoken.sign(payload, ACCESS_TOKEN, {expiresIn: '15s'})
    const refreshToken = jsonwebtoken.sign(payload, REFRESH_TOKEN)
    refreshTokens.push(refreshToken)
    res.json({token, refreshToken})
})

app.post('/refresh-token', (req, res) => {
    const { token } = req.body;
    if (!refreshTokens.includes(token)){
        return res.sendStatus(403); // 
    }

    jsonwebtoken.verify(token, REFRESH_TOKEN, (err, data) => {
        if (err){
            return res.sendStatus(403); //
        } 
        const payload = {
            id: data.id,
            name: data.name,
            email: data.email,
        }
        const newAccessToken = jsonwebtoken.sign(payload, ACCESS_TOKEN, {expiresIn: '15s'})
        res.json({token: newAccessToken})
    })
})

//usuwanie tokenu
app.delete('/logout', (req, res) => {
    const { refreshToken } = req.body
    refreshTokens = refreshTokens.filter(t => t !== refreshToken)
    res.sendStatus(204)
})

app.listen(1024, () => {
    console.log('listening on port 1024 ')
})