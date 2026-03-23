const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const redis = require('redis');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DATA_FILE = path.join(__dirname, 'data', 'inn.json');
const memoryStore = new Map();
let redisClient = null;
let redisReplicaClient = null;

const rawInnData = fs.readFileSync(DATA_FILE, 'utf8');
const innData = JSON.parse(rawInnData);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        mediaSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: ["'self'"],
      },
    },
  })
);

app.use(cors());
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true, limit: '8mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function resolveRedisUrl() {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }

  const host = process.env.REDIS_MASTER_SERVICE_HOST || process.env.REDIS_HOST;
  const port = process.env.REDIS_MASTER_SERVICE_PORT || process.env.REDIS_PORT || '6379';
  const password = process.env.REDIS_PASSWORD || process.env.REDIS_MASTER_SERVICE_PASSWORD;

  if (!host) {
    return null;
  }

  return password ? `redis://:${password}@${host}:${port}` : `redis://${host}:${port}`;
}

async function initRedis() {
  const redisUrl = resolveRedisUrl();
  if (!redisUrl) {
    console.log('Redis not configured. Using in-memory fallback.');
    return;
  }

  try {
    redisClient = redis.createClient({ url: redisUrl });
    redisClient.on('error', (error) => console.error('Redis master error:', error.message));
    await redisClient.connect();
    console.log('Connected to Redis master.');
  } catch (error) {
    console.error('Unable to connect to Redis master:', error.message);
    redisClient = null;
  }

  const replicaHost = process.env.REDIS_REPLICA_SERVICE_HOST || process.env.REDIS_SLAVE_SERVICE_HOST || 'redis-replica';
  const replicaPort = process.env.REDIS_REPLICA_SERVICE_PORT || process.env.REDIS_SLAVE_SERVICE_PORT || '6379';

  if (!redisClient) {
    return;
  }

  try {
    redisReplicaClient = redis.createClient({ url: `redis://${replicaHost}:${replicaPort}` });
    redisReplicaClient.on('error', () => {
      redisReplicaClient = null;
    });
    await redisReplicaClient.connect();
    console.log('Connected to Redis replica.');
  } catch (error) {
    console.log('Redis replica unavailable; reads will come from master.');
    redisReplicaClient = null;
  }
}

function getStoreKey(key) {
  return `iron-quill:${key}`;
}

async function listEntries(key) {
  const storeKey = getStoreKey(key);

  try {
    const client = redisReplicaClient || redisClient;
    if (client) {
      return (await client.lRange(storeKey, 0, -1)) || [];
    }
  } catch (error) {
    console.error('Redis read failed:', error.message);
  }

  return memoryStore.get(storeKey) || [];
}

async function addEntry(key, serializedEntry) {
  const storeKey = getStoreKey(key);

  try {
    if (redisClient) {
      await redisClient.rPush(storeKey, serializedEntry);
      return (await redisClient.lRange(storeKey, 0, -1)) || [];
    }
  } catch (error) {
    console.error('Redis write failed:', error.message);
  }

  const entries = memoryStore.get(storeKey) || [];
  entries.push(serializedEntry);
  memoryStore.set(storeKey, entries);
  return entries;
}

function validateAttachment(attachment) {
  if (!attachment) {
    return null;
  }

  const name = String(attachment.name || 'attachment').trim().slice(0, 120);
  const type = String(attachment.type || '').trim();
  const dataUrl = String(attachment.dataUrl || '').trim();

  if (!type.startsWith('image/') && !type.startsWith('audio/')) {
    return null;
  }

  if (!dataUrl.startsWith('data:')) {
    return null;
  }

  if (dataUrl.length > 2_500_000) {
    return null;
  }

  return { name, type, dataUrl };
}

function validateBody(body) {
  const guestName = String(body.guestName || '').trim();
  const message = String(body.message || '').trim();
  const mood = String(body.mood || '').trim();
  const rating = Number(body.rating || 0);
  const createdAt = body.createdAt || new Date().toISOString();
  const version = String(body.version || 'v1').trim();
  const attachment = validateAttachment(body.attachment);

  if (!guestName || !message || !mood || !rating) {
    return { error: 'guestName, message, mood, and rating are required.' };
  }

  if (guestName.length > 40 || message.length > 280) {
    return { error: 'The chronicle entry is too long.' };
  }

  if (rating < 1 || rating > 5) {
    return { error: 'rating must be between 1 and 5.' };
  }

  return {
    entry: {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      guestName,
      message,
      mood,
      rating,
      createdAt,
      version,
      attachment,
    },
  };
}

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', service: 'the-iron-quill', time: new Date().toISOString() });
});

app.get('/readyz', async (req, res) => {
  const backend = redisClient ? 'redis' : 'memory';
  res.json({ status: 'ready', backend, time: new Date().toISOString() });
});

app.get('/api/inn', (req, res) => {
  res.json(innData);
});

app.get('/entries/:key', async (req, res) => {
  try {
    const items = await listEntries(req.params.key);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: `Unable to open the chronicle: ${error.message}` });
  }
});

app.post('/entries/:key', async (req, res) => {
  const { error, entry } = validateBody(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  try {
    const items = await addEntry(req.params.key, JSON.stringify(entry));
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ error: `Unable to seal entry: ${err.message}` });
  }
});

app.get('/lrange/:key', async (req, res) => {
  try {
    const items = await listEntries(req.params.key);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/rpush/:key/:value', async (req, res) => {
  try {
    const legacyMessage = decodeURIComponent(req.params.value || '').trim();
    if (!legacyMessage) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const entry = {
      id: `${Date.now()}-legacy`,
      guestName: 'Legacy Visitor',
      message: legacyMessage,
      mood: 'solemn',
      rating: 3,
      createdAt: new Date().toISOString(),
      version: 'legacy',
      attachment: null,
    };

    const items = await addEntry(req.params.key, JSON.stringify(entry));
    return res.json(items);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/info', async (req, res) => {
  try {
    if (!redisClient) {
      return res.send('Redis unavailable. Using in-memory fallback.');
    }

    const info = await redisClient.info();
    return res.type('text/plain').send(info);
  } catch (error) {
    return res.status(500).send(error.message);
  }
});

app.get('/env', (req, res) => {
  res.json(process.env);
});

app.get('/hello', (req, res) => {
  const hostname = process.env.HOSTNAME || 'local-dev';
  res.send(`Welcome to The Iron Quill. The hall is open on ${hostname}.`);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function shutdown(signal) {
  console.log(`${signal} received. Closing server.`);
  try {
    if (redisReplicaClient) {
      await redisReplicaClient.quit();
    }
    if (redisClient) {
      await redisClient.quit();
    }
  } finally {
    process.exit(0);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

initRedis()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`The Iron Quill is listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });
