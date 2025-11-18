const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 3000;

// Choix de la base suivant l'environnement
const databaseName =
    process.env.NODE_ENV === 'test'
        ? (process.env.DB_NAME || 'dernier_metro_test')  // 👉 pour tests GitHub Actions & Jest
        : (process.env.DB_NAME || 'dernier_metro');      // 👉 pour dev / prod / Docker

// Pool PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: databaseName,
    user: process.env.DB_USER || 'app',
    password: process.env.DB_PASSWORD || 'app',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Log connexion sauf en test
if (process.env.NODE_ENV !== 'test') {
    pool.query('SELECT NOW()', (err, res) => {
        if (err) console.error('❌ Erreur PostgreSQL :', err);
        else console.log('✅ Connecté PostgreSQL à', res.rows[0].now, 'DB =', databaseName);
    });
}

app.use(express.json());

// Logger sauf en test
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        if (process.env.NODE_ENV !== 'test') {
            console.log(`${req.method} ${req.path} -> ${res.statusCode} (${Date.now() - start}ms)`);
        }
    });
    next();
});

// =========================
// ENDPOINTS
// =========================

app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.status(200).json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
    } catch (err) {
        res.status(503).json({ status: 'error', database: 'disconnected', error: err.message });
    }
});

app.get('/config', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM config ORDER BY key');
        res.status(200).json({ count: result.rows.length, data: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/next-metro', async (req, res) => {
    const station = req.query.station;
    if (!station) return res.status(400).json({ error: 'missing station parameter' });

    try {
        const result = await pool.query("SELECT value FROM config WHERE key='metro.defaults'");
        if (result.rows.length === 0) return res.status(404).json({ error: 'config not found' });

        const defaults = result.rows[0].value;
        const headwayMin = defaults.headwayMin || 5;

        const now = new Date();
        const next = new Date(now.getTime() + headwayMin * 60000);

        const nextTime = `${next.getHours().toString().padStart(2, '0')}:${next.getMinutes().toString().padStart(2, '0')}`;

        res.status(200).json({
            station,
            line: defaults.line,
            nextArrival: nextTime,
            headwayMin,
            source: 'database'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =========================
// CRUD METRO LINES
// =========================

app.get('/metro-lines', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM metro_lines ORDER BY id');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/metro-lines', async (req, res) => {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    try {
        const result = await pool.query(
            'INSERT INTO metro_lines (name, color) VALUES ($1, $2) RETURNING *',
            [name, color]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/metro-lines/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM metro_lines WHERE id=$1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'not found' });
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/metro-lines/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM metro_lines WHERE id=$1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'not found' });
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 404
app.use((req, res) => res.status(404).json({ error: 'not found' }));

// Serveur
let server;
if (process.env.NODE_ENV !== 'test') {
    server = app.listen(PORT, () => {
        console.log(`🚇 Last Metro API sur http://localhost:${PORT}`);
    });

    process.on('SIGTERM', async () => {
        await pool.end();
        server.close();
    });
}

module.exports = { app, pool, server };
