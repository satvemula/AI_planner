const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  // Default to index.html for all routes
  let filePath = path.join(__dirname, req.url);
  
  if (req.url === '/') {
    filePath = path.join(__dirname, 'index.html');
  }

  // If it's a directory or doesn't have an extension, serve index.html
  if (!path.extname(filePath)) {
    filePath = path.join(__dirname, 'index.html');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath);
    let contentType = 'text/html';
    
    if (ext === '.js') contentType = 'application/javascript';
    if (ext === '.css') contentType = 'text/css';
    if (ext === '.json') contentType = 'application/json';
    if (ext === '.svg') contentType = 'image/svg+xml';
    if (ext === '.png') contentType = 'image/png';
    if (ext === '.jpg') contentType = 'image/jpeg';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});