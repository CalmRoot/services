require("dotenv").config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { initializeSecrets } = require('./config/secrets-manager');
const authRoutes = require('./routes/auth.routes');
const wellnessRoutes = require('./routes/wellness');
const { runDefaultSeed } = require('./seeds/defaultData.seed');

const app = express();
const PORT = process.env.PORT || 3001;

let isReady = false;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '10kb' }));
app.use(morgan('combined'));

app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/ready', (req, res) => {
  if (isReady) {
    res.status(200).json({
      status: 'ready',
      service: 'auth-service',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      status: 'not ready',
      service: 'auth-service',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});


app.get('/api/auth/healthz', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/auth/ready', (req, res) => {
  if (isReady) {
    res.status(200).json({ status: 'ready', service: 'auth-service' });
  } else {
    res.status(503).json({ status: 'not ready', service: 'auth-service' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/wellness', wellnessRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

const start = async () => {
  try {
    await initializeSecrets(['calmroot/prod/jwt']);
    await runDefaultSeed();
    isReady = true;
    app.listen(PORT, () => {
      console.log(`Auth service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start Auth service:', error);
    process.exit(1);
  }
};

start();