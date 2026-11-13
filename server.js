/**
 * Zero-dependency local server for PMI Pearl City Chapter (PMIPCC) Resource System
 * Supports full cross-device synchronization:
 * - Centralized Allocation Logs, Reports & Directory Sync
 * - Dual-mode LAN & Localhost binding with automatic Network IP discovery
 * Usage: node server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Helper: Format IST Timestamp (UTC+5:30)
function getISTTimestamp(date = new Date()) {
  try {
    const options = {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    return new Intl.DateTimeFormat('en-IN', options).format(date) + ' IST';
  } catch (e) {
    const d = new Date(date);
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const ist = new Date(utc + (3600000 * 5.5));
    return ist.toLocaleString('en-GB') + ' IST';
  }
}

// Helper: Extract client IP address
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  let clientIp = (forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress) || '127.0.0.1';
  if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
    clientIp = '127.0.0.1';
  } else if (clientIp.startsWith('::ffff:')) {
    clientIp = clientIp.substring(7);
  }
  return clientIp;
}

// Helper: Get local network IPv4 addresses for mobile access
function getLocalNetworkIps() {
  const ips = [];
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push(net.address);
      }
    }
  }
  return ips;
}

// Helper: Read JSON file safely
function readJsonFile(fileName, defaultVal = []) {
  const filePath = path.join(DATA_DIR, fileName);
  try {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      // Strip UTF-8 BOM if present
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      return JSON.parse(content.trim() || '[]');
    }
  } catch (e) {
    console.error(`Error reading ${fileName}:`, e.message);
  }
  return defaultVal;
}

// Helper: Write JSON file safely with OneDrive/Windows EBUSY retry resilience
function writeJsonFile(fileName, data, retries = 5) {
  const filePath = path.join(DATA_DIR, fileName);
  const content = JSON.stringify(data, null, 2);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    } catch (e) {
      if (attempt === retries) {
        console.error(`Error writing ${fileName} after ${retries} attempts:`, e.message);
        return false;
      }
      // Brief pause to allow OneDrive/antivirus file locks to release
      const start = Date.now();
      while (Date.now() - start < 100) {}
    }
  }
  return false;
}

// Helper: Parse incoming JSON body
function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 10 * 1024 * 1024) {
        req.destroy();
        resolve(null);
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

// Helper: Send JSON response with universal CORS headers
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.end(JSON.stringify(data));
}

// Seed initial data files if empty or missing
function seedDataFilesIfEmpty() {
  const allocsPath = path.join(DATA_DIR, 'allocations.json');
  const portsPath = path.join(DATA_DIR, 'portfolios.json');
  const peoplePath = path.join(DATA_DIR, 'people.json');

  let allocs = readJsonFile('allocations.json', []);
  let ports = readJsonFile('portfolios.json', []);
  let people = readJsonFile('people.json', []);

  if (allocs.length === 0 || ports.length === 0 || people.length === 0) {
    try {
      const initPath = path.join(__dirname, 'js', 'initialData.js');
      if (fs.existsSync(initPath)) {
        const initContent = fs.readFileSync(initPath, 'utf8');
        const fn = new Function('window', initContent + '; return window.INITIAL_DATA;');
        const fakeWindow = {};
        const initialData = fn(fakeWindow);
        if (initialData) {
          if (allocs.length === 0 && Array.isArray(initialData.logs) && initialData.logs.length > 0) {
            writeJsonFile('allocations.json', initialData.logs);
          }
          if (ports.length === 0 && Array.isArray(initialData.portfolios) && initialData.portfolios.length > 0) {
            writeJsonFile('portfolios.json', initialData.portfolios);
          }
          if (people.length === 0 && Array.isArray(initialData.people) && initialData.people.length > 0) {
            writeJsonFile('people.json', initialData.people);
          }
        }
      }
    } catch (e) {
      console.error('Error seeding data files:', e.message);
    }
  }
}
seedDataFilesIfEmpty();

const server = http.createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400'
    });
    res.end();
    return;
  }

  let reqPath = decodeURI(req.url.split('?')[0]);
  const clientIp = getClientIp(req);

  // Fast console request logging for monitoring cross-device activity
  if (reqPath.startsWith('/api/')) {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${reqPath} from ${clientIp}`);
  }

  // ========================================================
  // 1. CLIENT CONNECTION INFO
  // ========================================================
  if (reqPath === '/api/client-info') {
    const istString = getISTTimestamp(new Date());
    sendJson(res, 200, {
      ip: clientIp,
      userAgent: req.headers['user-agent'] || '',
      timestampIST: istString
    });
    return;
  }

  // ========================================================
  // 2. ALLOCATION LOGS REST API
  // ========================================================
  if (reqPath === '/api/logs' || reqPath === '/api/allocations') {
    if (req.method === 'GET') {
      const logs = readJsonFile('allocations.json', []);
      sendJson(res, 200, logs);
      return;
    }

    if (req.method === 'POST') {
      const body = await parseBody(req);
      const incoming = Array.isArray(body) ? body : [body];
      const existing = readJsonFile('allocations.json', []);
      const existingMap = new Map();
      existing.forEach(item => { if (item && item.id) existingMap.set(item.id, item); });
      incoming.forEach(item => { if (item && item.id) existingMap.set(item.id, item); });

      const updated = Array.from(existingMap.values());
      updated.sort((a, b) => new Date(b.submittedAt || b.createdAt || 0) - new Date(a.submittedAt || a.createdAt || 0));

      writeJsonFile('allocations.json', updated);
      sendJson(res, 200, { success: true, logs: updated });
      return;
    }
  }

  // Delete single allocation log
  if (reqPath.startsWith('/api/logs/') && req.method === 'DELETE') {
    const idToDelete = decodeURIComponent(reqPath.replace('/api/logs/', ''));
    const existing = readJsonFile('allocations.json', []);
    const updated = existing.filter(l => l && l.id !== idToDelete);
    writeJsonFile('allocations.json', updated);
    sendJson(res, 200, { success: true, logs: updated });
    return;
  }

  // Update single allocation log
  if (reqPath.startsWith('/api/logs/') && req.method === 'PUT') {
    const idToUpdate = decodeURIComponent(reqPath.replace('/api/logs/', ''));
    const body = await parseBody(req);
    const existing = readJsonFile('allocations.json', []);
    const updated = existing.map(l => (l && l.id === idToUpdate ? { ...l, ...body, updatedAt: new Date().toISOString() } : l));
    writeJsonFile('allocations.json', updated);
    sendJson(res, 200, { success: true, logs: updated });
    return;
  }

  // ========================================================
  // 3. PORTFOLIOS REST API
  // ========================================================
  if (reqPath === '/api/portfolios') {
    if (req.method === 'GET') {
      const portfolios = readJsonFile('portfolios.json', []);
      sendJson(res, 200, portfolios);
      return;
    }
    if (req.method === 'POST') {
      const newPort = await parseBody(req);
      const existing = readJsonFile('portfolios.json', []);
      if (newPort && newPort.id) {
        existing.push(newPort);
        writeJsonFile('portfolios.json', existing);
      }
      sendJson(res, 200, { success: true, portfolios: existing });
      return;
    }
  }

  if (reqPath.startsWith('/api/portfolios/') && req.method === 'PUT') {
    const idToUpdate = decodeURIComponent(reqPath.replace('/api/portfolios/', ''));
    const body = await parseBody(req);
    const existing = readJsonFile('portfolios.json', []);
    const updated = existing.map(p => (p && p.id === idToUpdate ? { ...p, ...body, updatedAt: new Date().toISOString() } : p));
    writeJsonFile('portfolios.json', updated);
    sendJson(res, 200, { success: true, portfolios: updated });
    return;
  }

  if (reqPath.startsWith('/api/portfolios/') && req.method === 'DELETE') {
    const idToDelete = decodeURIComponent(reqPath.replace('/api/portfolios/', ''));
    const existing = readJsonFile('portfolios.json', []);
    const updated = existing.filter(p => p && p.id !== idToDelete);
    writeJsonFile('portfolios.json', updated);

    // Also remove people belonging to this portfolio
    const people = readJsonFile('people.json', []);
    const remainingPeople = people.filter(p => p && p.portfolioId !== idToDelete);
    writeJsonFile('people.json', remainingPeople);

    sendJson(res, 200, { success: true, portfolios: updated });
    return;
  }

  // ========================================================
  // 4. PEOPLE REST API
  // ========================================================
  if (reqPath === '/api/people') {
    if (req.method === 'GET') {
      const people = readJsonFile('people.json', []);
      sendJson(res, 200, people);
      return;
    }
    if (req.method === 'POST') {
      const newPerson = await parseBody(req);
      const existing = readJsonFile('people.json', []);
      if (newPerson && newPerson.id) {
        existing.push(newPerson);
        writeJsonFile('people.json', existing);
      }
      sendJson(res, 200, { success: true, people: existing });
      return;
    }
  }

  if (reqPath.startsWith('/api/people/') && req.method === 'PUT') {
    const idToUpdate = decodeURIComponent(reqPath.replace('/api/people/', ''));
    const body = await parseBody(req);
    const existing = readJsonFile('people.json', []);
    const updated = existing.map(p => (p && p.id === idToUpdate ? { ...p, ...body, updatedAt: new Date().toISOString() } : p));
    writeJsonFile('people.json', updated);
    sendJson(res, 200, { success: true, people: updated });
    return;
  }

  if (reqPath.startsWith('/api/people/') && req.method === 'DELETE') {
    const idToDelete = decodeURIComponent(reqPath.replace('/api/people/', ''));
    const existing = readJsonFile('people.json', []);
    const updated = existing.filter(p => p && p.id !== idToDelete);
    writeJsonFile('people.json', updated);
    sendJson(res, 200, { success: true, people: updated });
    return;
  }

  // ========================================================
  // 5. FULL TWO-WAY CROSS-DEVICE SYNC (/api/sync)
  // ========================================================
  if (reqPath === '/api/sync') {
    if (req.method === 'GET' || req.method === 'POST') {
      let logs = readJsonFile('allocations.json', []);
      let portfolios = readJsonFile('portfolios.json', []);
      let people = readJsonFile('people.json', []);

      if (req.method === 'POST') {
        const body = await parseBody(req);
        if (body && typeof body === 'object' && Array.isArray(body.logs) && body.logs.length > 0) {
          const allocMap = new Map();
          logs.forEach(l => { if (l && l.id) allocMap.set(l.id, l); });
          body.logs.forEach(l => { if (l && l.id) allocMap.set(l.id, l); });
          logs = Array.from(allocMap.values());
          logs.sort((a, b) => new Date(b.submittedAt || b.createdAt || 0) - new Date(a.submittedAt || a.createdAt || 0));
          writeJsonFile('allocations.json', logs);
        }
      }

      sendJson(res, 200, {
        success: true,
        serverTimeIST: getISTTimestamp(new Date()),
        logs,
        portfolios,
        people
      });
      return;
    }
  }

  // ========================================================
  // 5. STATIC ASSET SERVING
  // ========================================================
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const filePath = path.join(__dirname, reqPath);

  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    fs.createReadStream(filePath).pipe(res);
  });
});

// Bind to 0.0.0.0 to enable mobile, tablet & LAN cross-device access
server.listen(PORT, '0.0.0.0', () => {
  const localIps = getLocalNetworkIps();
  console.log('================================================================');
  console.log('🏛️  PMI PEARL CITY CHAPTER (PMIPCC) RESOURCE ALLOCATION SERVER');
  console.log('----------------------------------------------------------------');
  console.log(`💻  Laptop / Local URL : http://localhost:${PORT}`);
  if (localIps.length > 0) {
    localIps.forEach(ip => {
      console.log(`📱  Mobile / LAN URL   : http://${ip}:${PORT}`);
    });
  } else {
    console.log(`📱  Mobile / LAN URL   : http://<your-laptop-ip>:${PORT}`);
  }
  console.log('⚡  Two-Way Multi-Device Sync Active: Mobile + Laptop + Tablet');
  console.log('================================================================');
});
