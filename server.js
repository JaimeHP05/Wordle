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
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    `);
});

app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;

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
    const { email, password } = req.body;
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

app.listen(PORT, () => {
    console.log("Servidor Backend corriendo en http://localhost:" + PORT);
});
