const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

const db = new sqlite3.Database('./wordle.db', (err) => {
    if (err) {
        console.error("Error al abrir la base de datos:", err.message);
    } else {
        console.log("Conectado con éxito a la Base de Datos SQLite.");
    }
});

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS users (" +
        "id INTEGER PRIMARY KEY AUTOINCREMENT," +
        "username TEXT NOT NULL," +
        "email TEXT UNIQUE NOT NULL," +
        "password TEXT NOT NULL" +
    ")");

    db.run("CREATE TABLE IF NOT EXISTS games (" +
        "id INTEGER PRIMARY KEY AUTOINCREMENT," +
        "user_email TEXT NOT NULL," +
        "date_played TEXT NOT NULL," +
        "won INTEGER NOT NULL," +
        "attempts INTEGER NOT NULL," +
        "time_seconds REAL NOT NULL," +
        "UNIQUE(user_email, date_played)" +
    ")");

    db.run("CREATE TABLE IF NOT EXISTS blog_posts (" +
        "id INTEGER PRIMARY KEY AUTOINCREMENT," +
        "username TEXT NOT NULL," +
        "message TEXT NOT NULL," +
        "timestamp DATETIME DEFAULT CURRENT_TIMESTAMP" +
    ")");
});

app.post('/api/register', (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;

    const saltRounds = 10;
    const passwordHash = bcrypt.hashSync(password, saltRounds);

    const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
    
    db.run(sql, [username, email, passwordHash], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: "Este email ya está registrado." });
            }
            return res.status(500).json({ error: "Error interno del servidor." });
        }
        res.status(201).json({ message: "Usuario creado", user: { username: username, email: email } });
    });
});

app.post('/api/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    
    const sql = "SELECT * FROM users WHERE email = ?";
    
    db.get(sql, [email], (err, user) => {
        if (err) {
            return res.status(500).json({ error: "Error en el servidor." });
        }
        if (!user) {
            return res.status(401).json({ error: "Credenciales incorrectas." });
        }
        
        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Credenciales incorrectas." });
        }

        res.status(200).json({ message: "Login exitoso", user: { username: user.username, email: user.email } });
    });
});

app.get('/api/stats/:email', (req, res) => {
    const email = req.params.email;
    const sql = "SELECT won, attempts FROM games WHERE user_email = ?";
    
    db.all(sql, [email], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "Error" });
        }
        const stats = { played: rows.length, wins: 0, distribution: {1:0, 2:0, 3:0, 4:0, 5:0, 6:0} };
        
        rows.forEach(r => {
            if (r.won === 1) {
                stats.wins++;
                if (stats.distribution[r.attempts] !== undefined) {
                    stats.distribution[r.attempts]++;
                }
            }
        });
        res.status(200).json(stats);
    });
});

app.get('/api/ranking', (req, res) => {
    const sql = "SELECT u.username, AVG(g.attempts) as avg_attempts, AVG(g.time_seconds) as avg_time, COUNT(g.id) as games_won " +
                "FROM users u " +
                "JOIN games g ON u.email = g.user_email " +
                "WHERE g.won = 1 " +
                "GROUP BY u.email " +
                "ORDER BY avg_attempts ASC, avg_time ASC " +
                "LIMIT 10";
                
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "Error calculando ranking" });
        }
        res.status(200).json(rows);
    });
});

app.post('/api/save-game', (req, res) => {
    const email = req.body.email;
    const dateStr = req.body.dateStr;
    const won = req.body.won;
    const attempts = req.body.attempts;
    const time_seconds = req.body.time_seconds;
    
    let wonValue = 0;
    if (won) {
        wonValue = 1;
    }
    
    const sql = "INSERT INTO games (user_email, date_played, won, attempts, time_seconds) VALUES (?, ?, ?, ?, ?)";

    db.run(sql, [email, dateStr, wonValue, attempts, time_seconds], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: "Ya has jugado este día." });
            }
            return res.status(500).json({ error: "Error guardando partida." });
        }
        res.status(200).json({ message: "Partida guardada." });
    });
});

app.get("/api/blog", (req, res) => {
    const sql = "SELECT username, message, timestamp FROM blog_posts ORDER BY timestamp DESC LIMIT 50";
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "Error leyendo blog" });
        }
        res.json(rows);
    });
});

app.post("/api/blog", (req, res) => {
    const username = req.body.username;
    const message = req.body.message;
    const sql = "INSERT INTO blog_posts (username, message) VALUES (?, ?)";
    
    db.run(sql, [username, message], function(err) {
        if (err) {
            return res.status(500).json({ error: "Error publicando." });
        }
        res.status(201).json({ message: "Publicado correctamente." });
    });
});

app.listen(PORT, () => {
    console.log("Servidor Backend corriendo en http://localhost:" + PORT);
});
