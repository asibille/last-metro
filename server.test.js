const request = require('supertest');
const { app, pool } = require('./server');

beforeAll(async () => {
  // Nettoyer la table avant les tests
  await pool.query('DELETE FROM metro_lines');
});

describe('GET /metro-lines', () => {
  test('retourne la liste des lignes', async () => {
    const response = await request(app).get('/metro-lines');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('chaque ligne a les propriétés requises', async () => {
    const response = await request(app).get('/metro-lines');
    if (response.body.length > 0) {
      const line = response.body[0];
      expect(line).toHaveProperty('id');
      expect(line).toHaveProperty('name');
      expect(line).toHaveProperty('color');
    }
  });
});

describe('POST /metro-lines', () => {
  test('crée une nouvelle ligne', async () => {
    const newLine = { name: 'Ligne Test', color: 'Bleu' };
    const response = await request(app).post('/metro-lines').send(newLine);
    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Ligne Test');
  });

  test('rejette une ligne sans nom', async () => {
    const response = await request(app).post('/metro-lines').send({ color: 'Rouge' });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});

describe('Flow complet CREATE → GET → DELETE', () => {
  test('cycle de vie d\'une ligne', async () => {
    const createResponse = await request(app).post('/metro-lines').send({ name: 'Ligne Flow', color: 'Vert' });
    expect(createResponse.status).toBe(201);
    const lineId = createResponse.body.id;

    const getResponse = await request(app).get(`/metro-lines/${lineId}`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.name).toBe('Ligne Flow');

    const deleteResponse = await request(app).delete(`/metro-lines/${lineId}`);
    expect(deleteResponse.status).toBe(204);

    const getAfterDelete = await request(app).get(`/metro-lines/${lineId}`);
    expect(getAfterDelete.status).toBe(404);
  });
});

// Cleanup
afterAll(async () => {
  await pool.end();
});
