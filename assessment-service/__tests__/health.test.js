const request = require('supertest');
const express = require('express');

const app = express();

app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'assessment-service' });
});

app.get('/ready', (req, res) => {
  res.status(200).json({ status: 'ready', service: 'assessment-service' });
});

describe('Assessment Service Health Endpoints', () => {
  test('GET /healthz returns 200', async () => {
    const res = await request(app).get('/healthz');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  test('GET /ready returns 200', async () => {
    const res = await request(app).get('/ready');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ready');
  });
});