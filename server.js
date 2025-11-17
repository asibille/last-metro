const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration PostgreSQL
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
});

// Middleware JSON
app.use(express.json());

// Logger simple
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.path} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// ------------------- ROUTES -------------------

// GET /metro-lines
app.get('/metro-lines', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM metro_lines');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Erreur GET /metro-lines:', err);
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
    console.error('Erreur POST /metro-lines:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// GET /metro-lines/:id
app.get('/metro-lines/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM metro_lines WHERE id=$1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(200).json(result.rows[0]);
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
    const result = await client.query('DELETE FROM metro_lines WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// 404
app.use((req, res) => res.status(404).json({ error: 'not found' }));

// Serveur uniquement si pas en test
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚇 Last Metro API sur http://localhost:${PORT}`);
  });
}

// Export app + pool pour tests
module.exports = { app, pool };
