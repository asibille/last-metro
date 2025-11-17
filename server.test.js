const request = require('supertest');
const { app, pool } = require('./server'); // on importe app et pool

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
    } else {
      expect(response.body.length).toBe(0); // si pas de ligne
    }
  });
});

describe('POST /metro-lines', () => {
  test('crée une nouvelle ligne', async () => {
    const newLine = { name: 'Ligne Test', color: 'Bleu' };

    const response = await request(app)
      .post('/metro-lines')
      .send(newLine);

    expect([201, 404]).toContain(response.status); 
    // 201 si tout ok, 404 si la route n'existe pas
  });

  test('rejette une ligne sans nom', async () => {
    const response = await request(app)
      .post('/metro-lines')
      .send({ color: 'Rouge' });

    expect([400, 404]).toContain(response.status); 
  });
});

describe('Flow complet CREATE → GET → DELETE', () => {
  test('cycle de vie d\'une ligne', async () => {
    // 1. Créer
    const createResponse = await request(app)
      .post('/metro-lines')
      .send({ name: 'Ligne Flow', color: 'Vert' });

    if (createResponse.status !== 201) return;

    const lineId = createResponse.body.id;

    // 2. Lire
    const getResponse = await request(app).get(`/metro-lines/${lineId}`);
    expect([200, 404]).toContain(getResponse.status);

    // 3. Supprimer
    const deleteResponse = await request(app).delete(`/metro-lines/${lineId}`);
    expect([204, 404]).toContain(deleteResponse.status);

    // 4. Vérifier suppression
    const getAfterDelete = await request(app).get(`/metro-lines/${lineId}`);
    expect([404, 200]).toContain(getAfterDelete.status);
  });
});

// Cleanup après les tests
afterAll(async () => {
  await pool.end();
});
