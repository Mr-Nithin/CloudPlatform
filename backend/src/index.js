require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { sequelize } = require('./models');
const logger = require('./config/logger');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/naming-conventions', require('./routes/namingConventions'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/audit-logs', require('./routes/auditLogs'));
app.use('/api/access-rules', require('./routes/accessRules'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Global error handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await sequelize.authenticate();
    logger.info('Database connected');
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    logger.info('Models synced');
    app.listen(PORT, () => logger.info(`Backend running on port ${PORT}`));
  } catch (err) {
    logger.error('Failed to start:', err);
    process.exit(1);
  }
}

start();
