const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ping Route for Uptime
app.get('/ping', (req, res) => res.status(200).send('OK'));

// Extract API with Fallback Mechanism
app.post('/api/extract', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ success: false, message: 'TeraBox লিংক প্রদান করুন।' });
    }

    // Primary API
    try {
        const response = await axios.get(`https://terabox-dl.qt0.workers.dev/api?url=${encodeURIComponent(url)}`, {
            timeout: 8000
        });

        if (response.data && (response.data.stream_url || response.data.download_url || response.data.url)) {
            return res.json({
                success: true,
                title: response.data.title || response.data.file_name || 'TeraBox Video',
                stream_url: response.data.stream_url || response.data.url || response.data.download_url,
                download_url: response.data.download_url || response.data.url || response.data.stream_url,
                thumbnail: response.data.thumbnail || ''
            });
        }
    } catch (primaryError) {
        console.log('Primary API failed, trying fallback API...');
    }

    // Fallback API 1
    try {
        const fallbackResponse = await axios.get(`https://terabox-videodownloader.vercel.app/api/proxy?url=${encodeURIComponent(url)}`, {
            timeout: 8000
        });

        if (fallbackResponse.data && fallbackResponse.data.direct_link) {
            return res.json({
                success: true,
                title: fallbackResponse.data.file_name || 'TeraBox Video',
                stream_url: fallbackResponse.data.direct_link,
                download_url: fallbackResponse.data.direct_link,
                thumbnail: fallbackResponse.data.thumb || ''
            });
        }
    } catch (fallbackError) {
        console.log('Fallback API failed...');
    }

    return res.status(500).json({
        success: false,
        message: 'সার্ভার প্রসেসিং ত্রুটি। API সার্ভিসটি ডাউন রয়েছে, অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।'
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
