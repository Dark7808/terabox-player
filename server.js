const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}
app.use(express.static(publicDir));

const VALID_DOMAINS = [
    'terabox', '1024tera', 'terasharelink', 
    'nephobox', 'momerybox', 'tibibox', 'freeterabox'
];

app.post('/api/extract', async (req, res) => {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
        return res.status(400).json({ success: false, message: 'অনুগ্রহ করে একটি লিংক প্রদান করুন।' });
    }

    const isValidTeraBox = VALID_DOMAINS.some(domain => url.toLowerCase().includes(domain)) && url.includes('/s/');

    if (!isValidTeraBox) {
        return res.status(400).json({ 
            success: false, 
            message: 'দয়া করে একটি সঠিক TeraBox বা সংশ্লিষ্ট শেয়ার লিংক প্রদান করুন।' 
        });
    }

    try {
        const targetApi = `https://terabox-dl.qt0.workers.dev/api/get-info?shorturl=${encodeURIComponent(url)}`;
        
        const response = await axios.get(targetApi, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 15000
        });

        if (response.data && response.data.downloadUrl) {
            return res.json({
                success: true,
                title: response.data.fileName || 'TeraBox_Video.mp4',
                size: response.data.fileSize || 'N/A',
                stream_url: response.data.downloadUrl,
                download_url: response.data.downloadUrl
            });
        } else {
            return res.status(400).json({ success: false, message: 'লিংক থেকে ভিডিও ডেটা এক্সট্র্যাক্ট করা যায়নি।' });
        }

    } catch (error) {
        return res.status(500).json({ success: false, message: 'সার্ভার প্রসেসিং ত্রুটি। কিছুক্ষণ পর আবার চেষ্টা করুন।' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
