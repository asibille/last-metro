const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 3000;

// ------------------- CONFIGURATION POSTGRES -------------------
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'dernier_metro',
  user: process.env.DB_USER || 'app',
  password: process.env.DB_PASSWORD || 'app',
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  allowExitOnIdle: false,
});

// Test de connexion au démarrage
if (process.env.NODE_ENV !== 'test') {
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('❌ Erreur de connexion à PostgreSQL:', err);
    } else {
      console.log('✅ Connecté à PostgreSQL à', res.rows[0].now);
    }
  });
}

// ------------------- MIDDLEWARE -------------------
app.use(express.json());

// Logger simple (désactivé en test)
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      console.log(`${req.method} ${req.path} -> ${res.statusCode} (${Date.now() - start}ms)`);
    });
    next();
  });
}

// ------------------- ROUTES -------------------

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'ok',
      service: 'lastmetro-api',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      service: 'lastmetro-api',
      database: 'disconnected',
      error: err.message,
    });
  }
});

// Liste des lignes de métro
app.get('/metro-lines', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM metro_lines ORDER BY id');
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// GET /metro-lines/:id
app.get('/metro-lines/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM metro_lines WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// POST /metro-lines
app.post('/metro-lines', async (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const client = await pool.connect();
  try {
    const result = await client.query(
      'INSERT INTO metro_lines (name, color) VALUES ($1, $2) RETURNING *',
      [name, color || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// DELETE /metro-lines/:id
app.delete('/metro-lines/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('DELETE FROM metro_lines WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// POST /transfer (transaction example)
app.post('/transfer', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE accounts SET balance = balance - 100 WHERE id = 1');
    await client.query('UPDATE accounts SET balance = balance + 100 WHERE id = 2');
    await client.query('COMMIT');
    res.status(200).json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Lire la config
app.get('/config', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM config ORDER BY key');
    res.status(200).json({ count: result.rows.length, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Next metro
app.get('/next-metro', async (req, res) => {
  const station = req.query.station;
  if (!station) return res.status(400).json({ error: 'missing station parameter' });

  const client = await pool.connect();
  try {
    const result = await client.query("SELECT value FROM config WHERE key = 'metro.defaults'");
    if (result.rows.length === 0) return res.status(404).json({ error: 'config not found' });

    const defaults = result.rows[0].value;
    const headwayMin = defaults.headwayMin || 5;
    const now = new Date();
    const next = new Date(now.getTime() + headwayMin * 60 * 1000);
    const nextTime = `${String(next.getHours()).padStart(2,'0')}:${String(next.getMinutes()).padStart(2,'0')}`;

    res.status(200).json({
      station,
      line: defaults.line,
      nextArrival: nextTime,
      headwayMin,
      source: 'database'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Pool status
app.get('/pool-status', (req, res) => {
  res.status(200).json({
    totalConnections: pool.totalCount,
    idleConnections: pool.idleCount,
    waitingClients: pool.waitingCount,
  });
});

// ------------------- 404 -------------------
app.use((req, res) => res.status(404).json({ error: 'not found' }));

// ------------------- SERVEUR -------------------
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚇 Last Metro API sur http://localhost:${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
    console.log(`⚙️  Config: http://localhost:${PORT}/config`);
  });
}

// ------------------- CLEANUP -------------------
process.on('SIGTERM', () => {
  pool.end(() => {
    console.log('Pool PostgreSQL fermé');
    process.exit(0);
  });
});

module.exports = { app, pool };
