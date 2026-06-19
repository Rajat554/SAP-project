const http = require('http');
const fs = require('fs');

const options = {
  hostname: 'localhost',
  port: 4004,
  path: '/odata/v4/wash-wizard/$metadata',
  method: 'GET',
  headers: {
    'Authorization': 'Basic ' + Buffer.from('admin:admin123').toString('base64'),
    'Accept': 'application/xml'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    fs.writeFileSync('edmx_output.xml', data);
    console.log('Metadata written to edmx_output.xml. Status code:', res.statusCode);
  });
});

req.on('error', (err) => {
  console.error('Error fetching metadata:', err);
});

req.end();
