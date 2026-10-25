const https = require('https');

https.get('https://github.com/himanshupandit566-alt/Smart-Notes-AI/actions/runs/39600034680/job/119221909959', { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    console.log('HTML length:', body.length);
    // Find any JSON embedded in page containing log information
    const match = body.match(/https:\/\/[^"']+\/logs[^"']*/g);
    console.log('Found log URLs:', match);
    const blobMatch = body.match(/https:\/\/pipelines\.actions\.githubusercontent\.com[^"']+/g);
    console.log('Pipelines URLs:', blobMatch);
  });
});
