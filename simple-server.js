#!/usr/bin/env node

const express = require('express');
const path = require('path');
const app = express();
const PORT = 8080;

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

// Route to serve pages
app.get('/pages/:page', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'pages', req.params.page));
});

// Route to serve includes
app.get('/includes/:file', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'includes', req.params.file));
});

// Default route to dashboard
app.get('/', (req, res) => {
    res.redirect('/pages/dashboard.html');
});

app.listen(PORT, () => {
    console.log(`🚀 WizzCentral Platform running at http://localhost:${PORT}`);
    console.log(`📊 Customers page: http://localhost:${PORT}/pages/customers.html`);
    console.log(`📈 Dashboard: http://localhost:${PORT}/pages/dashboard.html`);
});
