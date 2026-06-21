require("dotenv").config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { initializeSecrets } = require('./config/secrets-manager');
const therapistRoutes = require('./routes/therapist.routes');
const { seedAvailability } = require('./seeds/availability.seed');

const app = express();
const PORT = process.env.PORT || 3003;

let isReady = false;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '10kb' }));
app.use(morgan('combined'));

app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'therapist-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/ready', (req, res) => {
  if (isReady) {
    res.status(200).json({
      status: 'ready',
      service: 'therapist-service',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      status: 'not ready',
      service: 'therapist-service',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'therapist-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use('/api/therapist', therapistRoutes);

app.get('/api/therapist/healthz', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'therapist-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/therapist/ready', (req, res) => {
  if (isReady) {
    res.status(200).json({ status: 'ready', service: 'therapist-service' });
  } else {
    res.status(503).json({ status: 'not ready', service: 'therapist-service' });
  }
});


app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

const start = async () => {
  try {
    await initializeSecrets(['calmroot/production/jwt-secret']);
    setTimeout(() => seedAvailability(), 3000);
    isReady = true;
    app.listen(PORT, () => {
      console.log(`Therapist service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start Therapist service:', error);
    process.exit(1);
  }
};

start();