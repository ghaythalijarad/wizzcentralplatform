const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

app.listen(PORT, () => {
    console.log(`🚀 Minimal test server running on http://localhost:${PORT}`);
    console.log('Test endpoints:');
    console.log(`  Health: http://localhost:${PORT}/health`);
    console.log(`  Test: http://localhost:${PORT}/test`);
});
