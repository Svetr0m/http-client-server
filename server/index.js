const express = require('express');
const fetch = require('node-fetch');
const { URL } = require('url');
const cors = require('cors');
const db = require('./db.json');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/urls', (req, res) => {
  const kw = req.query.kw;
  if (!kw || !db[kw]) {
    return res.status(404).json({ error: 'Keyword not found' });
  }
  res.json({ urls: db[kw] });
});

const axios = require('axios');

app.get('/download', async (req, res) => {
  try {
    const rawUrl = req.query.url;
    if (!rawUrl) {
      return res.status(400).json({ error: 'URL missing' });
    }

    const decodedUrl = decodeURIComponent(rawUrl);

    if (!/^https?:\/\//i.test(decodedUrl)) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    console.log('Downloading from:', decodedUrl);

    const response = await axios.get(decodedUrl, {
      responseType: 'stream'
    });

    const total = +response.headers['content-length'] || null;
    if (total) res.setHeader('X-Total-Size', total);

    res.setHeader('Content-Type', 'application/octet-stream');

    response.data.pipe(res); // 
  } catch (err) {
    console.error('Download error:', err.message);
    res.status(500).json({ error: 'Download failed: ' + err.message });
  }
});


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});