const https = require('https');

// Test the webhook verification
const testVerification = () => {
  const options = {
    hostname: 'localhost',
    port: process.env.PORT || 3000,
    path: '/?hub.mode=subscribe&hub.verify_token=' + encodeURIComponent(process.env.VERIFY_TOKEN) + '&hub.challenge=test_challenge',
    method: 'GET'
  };

  const req = https.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Response:', data);
      if (res.statusCode === 200 && data === 'test_challenge') {
        console.log('✅ Webhook verification test passed!');
      } else {
        console.log('❌ Webhook verification test failed');
      }
    });
  });

  req.on('error', (error) => {
    console.error('Error testing webhook:', error.message);
  });

  req.end();
};

// Only run the test if this file is executed directly
if (require.main === module) {
  if (!process.env.VERIFY_TOKEN) {
    console.error('ERROR: VERIFY_TOKEN environment variable is not set');
    console.log('Please set the VERIFY_TOKEN environment variable before running this test');
    process.exit(1);
  }
  
  testVerification();
}

module.exports = { testVerification };
