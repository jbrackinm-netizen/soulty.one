require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;

let SECRETS = {};
let supabase = null;

app.use(helmet());
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5000',
      'https://soulty.one',
      'https://*.soulty.one',
    ],
  })
);
app.use(morgan('combined', { skip: (req) => req.path === '/health' }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function initialize() {
  const gcpProjectId = process.env.GCP_PROJECT_ID;

  if (gcpProjectId) {
    console.log('Loading secrets from GCP Secret Manager...');
    const { loadAllSecrets } = require('./config/secrets');
    SECRETS = await loadAllSecrets();
    console.log('✓ Secrets loaded from GCP');
  } else {
    console.log('GCP_PROJECT_ID not set — loading secrets from environment variables');
    SECRETS = {
      'anthropic-api-key': process.env.ANTHROPIC_API_KEY || '',
      'openai-api-key': process.env.OPENAI_API_KEY || '',
      'gemini-api-key': process.env.GEMINI_API_KEY || '',
      'supabase-url': process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      'supabase-key': process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      'jwt-secret': process.env.JWT_SECRET || '',
    };
  }

  const supabaseUrl = SECRETS['supabase-url'];
  const supabaseKey = SECRETS['supabase-key'];

  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠ Supabase credentials not found — memory and data routes will be unavailable');
  } else {
    console.log('Initializing Supabase...');
    supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error) {
      console.warn('⚠ Supabase connection check failed:', error.message);
    } else {
      console.log('✓ Supabase connected');
    }
  }
}

function mountRoutes() {
  app.use('/api/routes', require('./api/routes')(SECRETS, supabase));
  app.use('/api/agents', require('./agents/orchestrator')(SECRETS, supabase));
  app.use('/api/memory', require('./memory/manager')(SECRETS, supabase));
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

async function start() {
  await initialize();
  mountRoutes();

  app.listen(PORT, () => {
    console.log(`✓ Nexus Brain running on port ${PORT}`);
    console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app;
