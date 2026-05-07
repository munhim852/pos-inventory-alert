const http = require('http');
const fs = require('fs/promises');
const path = require('path');

const port = Number(process.env.PORT ?? 5173);
const functionUrl = process.env.POS_FUNCTION_URL
    ?? 'https://f1-bqamdrc8epekgqbw.canadacentral-01.azurewebsites.net/api/httpreceivesales';
const uiDir = path.join(__dirname, '..', 'ui');

const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8'
};

async function readRequestBody(request) {
    const chunks = [];

    for await (const chunk of request) {
        chunks.push(chunk);
    }

    return Buffer.concat(chunks).toString('utf8');
}

async function proxyOrder(request, response) {
    const body = await readRequestBody(request);
    const functionResponse = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
    });
    const result = await functionResponse.text();

    response.writeHead(functionResponse.status, {
        'Content-Type': functionResponse.headers.get('content-type') ?? 'application/json'
    });
    response.end(result);
}

async function serveStatic(request, response) {
    const requestPath = request.url === '/' ? '/index.html' : request.url;
    const filePath = path.normalize(path.join(uiDir, requestPath));

    if (!filePath.startsWith(uiDir)) {
        response.writeHead(403);
        response.end('Forbidden');
        return;
    }

    try {
        const file = await fs.readFile(filePath);
        const ext = path.extname(filePath);

        response.writeHead(200, {
            'Content-Type': contentTypes[ext] ?? 'application/octet-stream'
        });
        response.end(file);
    } catch {
        response.writeHead(404);
        response.end('Not found');
    }
}

const server = http.createServer(async (request, response) => {
    try {
        if (request.method === 'POST' && request.url === '/api/order') {
            await proxyOrder(request, response);
            return;
        }

        if (request.method === 'GET') {
            await serveStatic(request, response);
            return;
        }

        response.writeHead(405);
        response.end('Method not allowed');
    } catch (error) {
        response.writeHead(500, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ status: 'error', message: error.message }));
    }
});

server.listen(port, () => {
    console.log(`POS test UI running at http://localhost:${port}`);
    console.log(`Proxying orders to ${functionUrl}`);
});
