require("dotenv").config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { initializeSecrets } = require('./config/secrets-manager');
const assessmentRoutes = require('./routes/assessment.routes');
const { seedTemplates } = require('./seeds/templates.seed');

const app = express();
const PORT = process.env.PORT || 3002;

let isReady = false;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '10kb' }));
app.use(morgan('combined'));

app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'assessment-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/ready', (req, res) => {
  if (isReady) {
    res.status(200).json({
      status: 'ready',
      service: 'assessment-service',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      status: 'not ready',
      service: 'assessment-service',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'assessment-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use('/api/assessment', assessmentRoutes);

app.get('/api/assessment/healthz', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'assessment-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/assessment/ready', (req, res) => {
  if (isReady) {
    res.status(200).json({ status: 'ready', service: 'assessment-service' });
  } else {
    res.status(503).json({ status: 'not ready', service: 'assessment-service' });
  }
});


app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

const start = async () => {
  try {
    await initializeSecrets(['calmroot/production/jwt-secret']);
    await seedTemplates();
    isReady = true;
    app.listen(PORT, () => {
      console.log(`Assessment service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start Assessment service:', error);
    process.exit(1);
  }
};

start();