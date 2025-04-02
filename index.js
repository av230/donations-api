require('dotenv').config();
console.log("🔍 DATABASE_URL:", process.env.DATABASE_URL);

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// חיבור ל-Supabase עם SSL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.get('/gettrumot', async (req, res) => {
  console.log("📥 קיבלנו פנייה ל- /donations");

  try {
    const result = await pool.query(`
      SELECT donors.name, donors.phone, donations.amount, donations.date
      FROM donations
      JOIN donors ON donors.id = donations.donor_id
      ORDER BY donations.date DESC
    `);

    console.log("✅ שלפנו נתונים:", result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ DB ERROR:", err); // הדפסה משופרת עם אייקון
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/donations', async (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
