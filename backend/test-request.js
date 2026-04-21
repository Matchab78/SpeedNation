const http = require('http');

const data = JSON.stringify({
  email: 'test@example.com',
  password: 'test123'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, function(res) {
  console.log('Status:', res.statusCode);
  res.on('data', function(chunk) {
    console.log('Response:', chunk.toString());
  });
});

req.on('error', function(err) {
  console.error('Request error:', err);
});

req.write(data);
req.end();
