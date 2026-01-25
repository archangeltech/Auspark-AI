
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.ts': 'text/javascript',
  '.tsx': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  // Health check for Cloud Run / Kubernetes
  if (req.url === '/_health') {
    res.writeHead(200);
    res.end('OK');
    return;
  }

  const urlPath = req.url.split('?')[0];
  let filePath = path.join(__dirname, urlPath === '/' ? 'index.html' : urlPath);

  let exists = fs.existsSync(filePath);
  if (exists && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
    exists = fs.existsSync(filePath);
  }

  if (!exists) {
    const extensions = ['.ts', '.tsx', '.js'];
    for (const ext of extensions) {
      if (fs.existsSync(filePath + ext)) {
        filePath += ext;
        exists = true;
        break;
      }
    }
  }

  if (!exists && !path.extname(urlPath)) {
    filePath = path.join(__dirname, 'index.html');
    exists = fs.existsSync(filePath);
  }

  if (!exists) {
    res.writeHead(404);
    res.end('404 Not Found');
    return;
  }

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end(`Server Error: ${err.code}`);
    } else {
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
        'Service-Worker-Allowed': '/'
      });
      res.end(data);
    }
  });
});

// Important: Listen on 0.0.0.0 for containerized environments
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AusPark AI Server v1.2.1`);
  console.log(`Port: ${PORT}`);
  console.log(`Host: 0.0.0.0`);
});
