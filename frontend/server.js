const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const API_PORT = 3000;

const server = http.createServer((req, res) => {
    // Proxy API requests to regions-api server
    if (req.url.startsWith('/api/')) {
        const options = {
            hostname: 'localhost',
            port: API_PORT,
            path: req.url,
            method: req.method,
            headers: req.headers
        };

        const proxy = http.request(options, (apiRes) => {
            res.writeHead(apiRes.statusCode, apiRes.headers);
            apiRes.pipe(res);
        });

        proxy.on('error', (err) => {
            console.error('API Proxy Error:', err.message);
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'API server unavailable' }));
        });

        req.pipe(proxy);
        return;
    }

    let filePath = path.join(__dirname, req.url);
    
    // Check if file exists first
    if (!fs.existsSync(filePath)) {
        // Handle root directory
        if (req.url === '/') {
            filePath = path.join(__dirname, 'pages', 'customers.html');
        } else {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 Not Found</h1>', 'utf-8');
            return;
        }
    }
    
    // If it's a directory, serve index.html
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    }
    
    // Handle root directory
    if (req.url === '/') {
        filePath = path.join(__dirname, 'pages', 'customers.html');
    }
    
    // Get file extension
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.wasm': 'application/wasm'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${error.code} ..\n`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Customers page: http://localhost:${PORT}/pages/customers.html`);
});
