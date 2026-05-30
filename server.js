const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`[HTTP] Request: ${req.url}`);
  
  // Default routing to index.html
  let filePath = req.url === '/' ? './index.html' : '.' + req.url;
  
  // Remove query parameters or hash from path for file resolution
  const cleanPath = filePath.split('?')[0].split('#')[0];
  const absolutePath = path.resolve(__dirname, cleanPath);
  
  // Ensure security: prevent walking out of workspace
  if (!absolutePath.startsWith(__dirname)) {
    res.statusCode = 403;
    res.end('Access Denied');
    return;
  }
  
  fs.stat(absolutePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fall back to index.html for SPA routing
      const indexPath = path.resolve(__dirname, 'index.html');
      fs.readFile(indexPath, (err, data) => {
        if (err) {
          res.statusCode = 500;
          res.end('Error loading index.html');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);
        }
      });
      return;
    }
    
    fs.readFile(absolutePath, (err, data) => {
      if (err) {
        res.statusCode = 500;
        res.end(`Error reading file: ${err.message}`);
        return;
      }
      
      const ext = path.extname(absolutePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 LOCAL DEV SERVER RUNNING SUCCESSFULLY!`);
  console.log(`👉 Open: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
