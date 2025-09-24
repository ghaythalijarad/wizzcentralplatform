const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    console.log(`📥 Request: ${req.url}`);
    
    if (req.url === '/' || req.url === '/test-order-assignment.html') {
        const filePath = path.join(__dirname, 'test-order-assignment.html');
        console.log(`📂 Serving file: ${filePath}`);
        
        fs.readFile(filePath, (err, data) => {
            if (err) {
                console.error(`❌ Error reading file: ${err.message}`);
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('File not found: ' + err.message);
                return;
            }
            console.log(`✅ File served successfully`);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    } else {
        console.log(`❌ 404 - Not found: ${req.url}`);
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
    }
});

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`🌐 Test server running at http://localhost:${PORT}`);
    console.log(`📱 Open http://localhost:${PORT}/test-order-assignment.html to test WebSocket integration`);
});
