// חיבור למסד הנתונים של Supabase
const { Pool } = require('pg');

// יצירת חיבור לבסיס הנתונים
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'institutions_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// בדיקת חיבור בזמן טעינת המודול
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ שגיאה בהתחברות למסד הנתונים:', err);
  } else {
    console.log('✅ מודול DB: התחברות למסד הנתונים הצליחה');
    release();
  }
});

module.exports = pool;