const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());
app.use(express.static(__dirname)); 

const db = new sqlite3.Database('./wordle.db', (err) => {
    if (err) {
        console.error("Error DB:", err.message);
    } else {
        console.log("Conectado a SQLite.");
    }
});

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            username TEXT NOT NULL, 
            email TEXT UNIQUE NOT NULL, 
            password TEXT NOT NULL
        )
    `);
    
    db.run(`
        CREATE TABLE IF NOT EXISTS games (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            user_email TEXT NOT NULL, 
            date_played TEXT NOT NULL, 
            won INTEGER NOT NULL, 
            attempts INTEGER NOT NULL, 
            time_seconds REAL NOT NULL, 
            UNIQUE(user_email, date_played)
        )
    `);
    
    db.run(`
        CREATE TABLE IF NOT EXISTS blog_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            username TEXT NOT NULL, 
            message TEXT NOT NULL, 
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;
    const passwordHash = bcrypt.hashSync(password, 10);
    
    db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`, [username, email, passwordHash], function(err) {
        if (err) {
            return res.status(400).json({ error: "Email registrado o error." });
        }
        res.status(201).json({ message: "Usuario creado", user: { username, email } });
    });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: "Credenciales incorrectas." });
        }
        res.status(200).json({ message: "Login exitoso", user: { username: user.username, email: user.email } });
    });
});

app.post('/api/save-game', (req, res) => {
    const { email, dateStr, won, attempts, time_seconds } = req.body;
    
    let wonValue = 0;
    if (won) {
        wonValue = 1;
    }
    
    db.run(`INSERT INTO games (user_email, date_played, won, attempts, time_seconds) VALUES (?, ?, ?, ?, ?)`, 
    [email, dateStr, wonValue, attempts, time_seconds], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: "Ya has jugado este día." });
            }
            return res.status(500).json({ error: "Error guardando partida." });
        }
        res.status(200).json({ message: "Partida guardada." });
    });
});

app.get('/api/stats/:email', (req, res) => {
    db.all(`SELECT won, attempts FROM games WHERE user_email = ? ORDER BY date_played ASC`, [req.params.email], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "Error" });
        }
        
        const stats = { played: rows.length, wins: 0, distribution: {1:0, 2:0, 3:0, 4:0, 5:0, 6:0}, currentStreak: 0, maxStreak: 0 };
        let streak = 0;
        
        rows.forEach(r => {
            if (r.won === 1) {
                stats.wins++;
                if (stats.distribution[r.attempts] !== undefined) {
                    stats.distribution[r.attempts]++;
                }
                streak++;
                if (streak > stats.maxStreak) {
                    stats.maxStreak = streak;
                }
            } else {
                streak = 0;
            }
        });
        
        stats.currentStreak = streak;
        res.status(200).json(stats);
    });
});

app.get('/api/ranking', (req, res) => {
    const query = `
        SELECT u.username, AVG(g.attempts) as avg_attempts, AVG(g.time_seconds) as avg_time, COUNT(g.id) as games_won 
        FROM users u 
        JOIN games g ON u.email = g.user_email 
        WHERE g.won = 1 
        GROUP BY u.email 
        ORDER BY avg_attempts ASC, avg_time ASC 
        LIMIT 10
    `;
    
    db.all(query, [], (err, rows) => {
        res.json(rows);
    });
});

app.get('/api/blog', (req, res) => {
    db.all(`SELECT username, message, timestamp FROM blog_posts ORDER BY timestamp DESC LIMIT 50`, [], (err, rows) => {
        res.json(rows);
    });
});

app.post('/api/blog', (req, res) => {
    const { username, message } = req.body;
    
    db.run(`INSERT INTO blog_posts (username, message) VALUES (?, ?)`, [username, message], function(err) {
        if (err) {
            return res.status(500).json({ error: "Error publicando." });
        }
        res.status(201).json({ message: "Publicado correctamente." });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});
