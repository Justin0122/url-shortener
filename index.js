import express from 'express';
import bodyParser from 'body-parser';
import mysql from 'mysql2/promise';
import { nanoid } from 'nanoid';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

app.use(bodyParser.json());

app.post('/shorten', async (req, res) => {
    const originalUrl = req.body.url;
    const shortCode = nanoid(8);

    if (!originalUrl) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        await db.execute('INSERT INTO urls (original_url, short_code) VALUES (?, ?)', [originalUrl, shortCode]);
        const shortUrl = `${req.protocol}://${req.get('host')}/${shortCode}`;
        res.json({ originalUrl, shortUrl });
    } catch (err) {
        console.error('Error saving URL:', err);
        return res.status(500).json({ error: 'Database error' });
    }
});

app.get('/:shortCode', async (req, res) => {
    const { shortCode } = req.params;

    try {
        const [results] = await db.execute('SELECT original_url FROM urls WHERE short_code = ?', [shortCode]);
        if (results.length === 0) return res.status(404).json({ error: 'URL not found' });

        const originalUrl = results[0].original_url;
        res.redirect(originalUrl);
    } catch (err) {
        console.error('Error fetching URL:', err);
        return res.status(500).json({ error: 'Database error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
