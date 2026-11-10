const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.env.PORT || 5501);
const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.js': 'application/javascript; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
};

http.createServer((request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const requestPath = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
    const filePath = path.resolve(root, `.${requestPath}`);

    if (!filePath.startsWith(`${root}${path.sep}`)) {
        response.writeHead(403);
        response.end('Forbidden');
        return;
    }

    fs.readFile(filePath, (error, file) => {
        if (error) {
            response.writeHead(404);
            response.end('Not found');
            return;
        }

        response.writeHead(200, {
            'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
        });
        response.end(file);
    });
}).listen(port, '127.0.0.1', () => {
    console.log(`Frontend running at http://127.0.0.1:${port}`);
});
