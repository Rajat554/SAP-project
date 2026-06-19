const http = require('http');

function makeRequest(urlPath) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4004,
      path: urlPath,
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + Buffer.from('admin:admin123').toString('base64'),
        'Accept': 'application/json'
      }
    };

    console.log(`\nRequesting: http://localhost:4004${urlPath}`);

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

async function run() {
  try {
    // 1. Get raw entities
    const rawRes = await makeRequest('/odata/v4/wash-wizard/ServiceAnalyticsSet?$top=2');
    console.log('Status Code:', rawRes.statusCode);
    console.log('Body:', rawRes.body);

    // 2. Simple aggregation $apply groupby
    const applyRes1 = await makeRequest('/odata/v4/wash-wizard/ServiceAnalyticsSet?$apply=groupby((ServiceType),aggregate(Amount%20with%20sum%20as%20Amount))');
    console.log('Status Code:', applyRes1.statusCode);
    console.log('Body:', applyRes1.body);

    // 3. Daily overview aggregation
    const applyRes2 = await makeRequest('/odata/v4/wash-wizard/ServiceAnalyticsSet?$apply=groupby((ServiceDate),aggregate(Amount%20with%20sum%20as%20Amount))');
    console.log('Status Code:', applyRes2.statusCode);
    console.log('Body:', applyRes2.body);

  } catch (err) {
    console.error('Error during request:', err);
  }
}

run();
