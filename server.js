// require('dotenv').config();
// console.log("🔍 DATABASE_URL:", process.env.DATABASE_URL);

// const express = require('express');
// const cors = require('cors');
// const path = require('path');
// const bodyParser = require('body-parser');
// const { Pool } = require('pg');

// // יצירת אפליקציית Express
// const app = express();
// const PORT = process.env.PORT || 3001;

// // מידלוור
// app.use(cors());
// app.use(express.json());
// app.use(bodyParser.json());
// app.use(express.static(path.join(__dirname, 'public')));

// // חיבור ל-Supabase עם SSL
// const pool = new Pool({
//   user: process.env.DB_USER || 'postgres',
//   host: process.env.DB_HOST || 'localhost',
//   database: process.env.DB_NAME || 'institutions_db',
//   password: process.env.DB_PASSWORD || 'password',
//   port: process.env.DB_PORT || 5432,
//   connectionString: process.env.DATABASE_URL,
//   ssl: { rejectUnauthorized: false }
// });

// // בדיקת חיבור למסד הנתונים
// pool.connect((err, client, release) => {
//   if (err) {
//     console.error('❌ שגיאה בהתחברות למסד הנתונים:', err);
//   } else {
//     console.log('✅ התחברות למסד הנתונים הצליחה');
//     release();
//   }
// });

// // יצירת טבלאות אם לא קיימות
// async function createTablesIfNotExist() {
//   try {
//     // טבלת מוסדות
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS institutions (
//         id SERIAL PRIMARY KEY,
//         name VARCHAR(255) NOT NULL,
//         contact_name VARCHAR(255) NOT NULL,
//         contact_phone VARCHAR(50) NOT NULL,
//         address TEXT NOT NULL,
//         website VARCHAR(255),
//         institution_type VARCHAR(100) NOT NULL,
//         registration_number VARCHAR(50) UNIQUE NOT NULL,
//         authorization_level VARCHAR(50) NOT NULL,
//         max_users INTEGER NOT NULL,
//         package_type VARCHAR(50) NOT NULL,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       )
//     `);
    
//     // טבלת תורמים
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS donors (
//         id SERIAL PRIMARY KEY,
//         institution_id INTEGER REFERENCES institutions(id),
//         name VARCHAR(255) NOT NULL,
//         phone VARCHAR(50),
//         email VARCHAR(255),
//         address TEXT,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       )
//     `);
    
//     // טבלת תרומות
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS donations (
//         id SERIAL PRIMARY KEY,
//         institution_id INTEGER REFERENCES institutions(id),
//         donor_id INTEGER REFERENCES donors(id),
//         amount DECIMAL(10, 2) NOT NULL,
//         date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         notes TEXT
//       )
//     `);
    
//     console.log("✅ טבלאות נוצרו או כבר קיימות במסד הנתונים");
//   } catch (err) {
//     console.error("❌ שגיאה ביצירת טבלאות:", err);
//   }
// }

// // הרצת פונקציית יצירת הטבלאות בהפעלת השרת
// createTablesIfNotExist();

// // ============ נתיבי API ===============

// // ------ נתיבי תרומות ------
// app.get('/gettrumot', async (req, res) => {
//   console.log("📥 קיבלנו פנייה ל- /gettrumot");

//   try {
//     const result = await pool.query(`
//       SELECT donors.name, donors.phone, donations.amount, donations.date
//       FROM donations
//       JOIN donors ON donors.id = donations.donor_id
//       ORDER BY donations.date DESC
//     `);

//     console.log("✅ שלפנו נתוני תרומות:", result.rows.length);
//     res.json(result.rows);
//   } catch (err) {
//     console.error("❌ DB ERROR:", err);
//     res.status(500).json({ error: 'Database error', details: err.message });
//   }
// });

// // ------ נתיבי מוסדות ------
// // נקודת קצה להחזרת כל המוסדות
// app.get('/api/institutions', async (req, res) => {
//   console.log("📥 קיבלנו פנייה ל- /api/institutions");
//   try {
//     const result = await pool.query(`
//       SELECT * FROM institutions
//       ORDER BY name ASC
//     `);
//     console.log("✅ שלפנו נתוני מוסדות:", result.rows.length);
//     res.json(result.rows);
//   } catch (err) {
//     console.error("❌ DB ERROR:", err);
//     res.status(500).json({ error: 'Database error', details: err.message });
//   }
// });

// // נקודת קצה לחיפוש מוסדות
// app.get('/api/institutions/search/:term', async (req, res) => {
//   const { term } = req.params;
//   console.log(`📥 קיבלנו פנייה לחיפוש מוסדות לפי "${term}"`);
  
//   try {
//     const result = await pool.query(`
//       SELECT * FROM institutions
//       WHERE 
//         name ILIKE $1 OR
//         contact_name ILIKE $1 OR
//         address ILIKE $1 OR
//         registration_number ILIKE $1
//       ORDER BY name ASC
//     `, [`%${term}%`]);
    
//     console.log("✅ נמצאו מוסדות בחיפוש:", result.rows.length);
//     res.json(result.rows);
//   } catch (err) {
//     console.error("❌ DB ERROR:", err);
//     res.status(500).json({ error: 'Database error', details: err.message });
//   }
// });

// // נקודת קצה למידע סטטיסטי על המוסדות
// app.get('/api/institutions/stats/summary', async (req, res) => {
//   console.log("📥 קיבלנו פנייה למידע סטטיסטי על המוסדות");
  
//   try {
//     // מספר המוסדות לפי סוג
//     const typeStats = await pool.query(`
//       SELECT institution_type, COUNT(*) as count
//       FROM institutions
//       GROUP BY institution_type
//       ORDER BY count DESC
//     `);
    
//     // מספר המוסדות לפי חבילה
//     const packageStats = await pool.query(`
//       SELECT package_type, COUNT(*) as count
//       FROM institutions
//       GROUP BY package_type
//       ORDER BY count DESC
//     `);
    
//     // סה"כ מספר המוסדות
//     const totalInstitutions = await pool.query(`
//       SELECT COUNT(*) as total
//       FROM institutions
//     `);
    
//     // סה"כ משתמשים
//     const totalUsers = await pool.query(`
//       SELECT SUM(max_users) as total_users
//       FROM institutions
//     `);
    
//     res.json({
//       total_institutions: parseInt(totalInstitutions.rows[0].total),
//       total_users: parseInt(totalUsers.rows[0].total_users) || 0,
//       by_type: typeStats.rows,
//       by_package: packageStats.rows
//     });
//   } catch (err) {
//     console.error("❌ DB ERROR:", err);
//     res.status(500).json({ error: 'Database error', details: err.message });
//   }
// });

// // נקודת קצה להחזרת מוסד ספציפי לפי מזהה
// app.get('/api/institutions/:id', async (req, res) => {
//   const { id } = req.params;
//   console.log(`📥 קיבלנו פנייה למוסד מס' ${id}`);
  
//   try {
//     const result = await pool.query(`
//       SELECT * FROM institutions
//       WHERE id = $1
//     `, [id]);
    
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'Institution not found' });
//     }
    
//     res.json(result.rows[0]);
//   } catch (err) {
//     console.error("❌ DB ERROR:", err);
//     res.status(500).json({ error: 'Database error', details: err.message });
//   }
// });

// // נקודת קצה להוספת מוסד חדש
// app.post('/api/institutions', async (req, res) => {
//   const {
//     name,
//     contact_name,
//     contact_phone,
//     address,
//     website,
//     institution_type,
//     registration_number,
//     authorization_level,
//     max_users,
//     package_type
//   } = req.body;
  
//   console.log("📥 קיבלנו פנייה ליצירת מוסד חדש:", name);
  
//   try {
//     const result = await pool.query(`
//       INSERT INTO institutions (
//         name,
//         contact_name,
//         contact_phone,
//         address,
//         website,
//         institution_type,
//         registration_number,
//         authorization_level,
//         max_users,
//         package_type
//       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
//       RETURNING *
//     `, [
//       name,
//       contact_name,
//       contact_phone,
//       address,
//       website,
//       institution_type,
//       registration_number,
//       authorization_level,
//       max_users,
//       package_type
//     ]);
    
//     console.log("✅ מוסד חדש נוצר בהצלחה:", result.rows[0].id);
//     res.status(201).json(result.rows[0]);
//   } catch (err) {
//     console.error("❌ DB ERROR:", err);
    
//     // בדיקה לשגיאת כפילות של מספר רישום
//     if (err.code === '23505' && err.constraint === 'institutions_registration_number_key') {
//       return res.status(400).json({ 
//         error: 'Duplicate registration number', 
//         message: 'מספר הרישום כבר קיים במערכת' 
//       });
//     }
    
//     res.status(500).json({ error: 'Database error', details: err.message });
//   }
// });

// // נקודת קצה לעדכון מוסד קיים
// app.put('/api/institutions/:id', async (req, res) => {
//   const { id } = req.params;
//   const {
//     name,
//     contact_name,
//     contact_phone,
//     address,
//     website,
//     institution_type,
//     registration_number,
//     authorization_level,
//     max_users,
//     package_type
//   } = req.body;
  
//   console.log(`📥 קיבלנו פנייה לעדכון מוסד מס' ${id}`);
  
//   try {
//     // בדיקה אם המוסד קיים
//     const checkResult = await pool.query('SELECT id FROM institutions WHERE id = $1', [id]);
//     if (checkResult.rows.length === 0) {
//       return res.status(404).json({ error: 'Institution not found' });
//     }
    
//     const result = await pool.query(`
//       UPDATE institutions
//       SET 
//         name = $1,
//         contact_name = $2,
//         contact_phone = $3,
//         address = $4,
//         website = $5,
//         institution_type = $6,
//         registration_number = $7,
//         authorization_level = $8,
//         max_users = $9,
//         package_type = $10,
//         updated_at = NOW()
//       WHERE id = $11
//       RETURNING *
//     `, [
//       name,
//       contact_name,
//       contact_phone,
//       address,
//       website,
//       institution_type,
//       registration_number,
//       authorization_level,
//       max_users,
//       package_type,
//       id
//     ]);
    
//     console.log("✅ מוסד עודכן בהצלחה:", id);
//     res.json(result.rows[0]);
//   } catch (err) {
//     console.error("❌ DB ERROR:", err);
    
//     // בדיקה לשגיאת כפילות של מספר רישום
//     if (err.code === '23505' && err.constraint === 'institutions_registration_number_key') {
//       return res.status(400).json({ 
//         error: 'Duplicate registration number', 
//         message: 'מספר הרישום כבר קיים במערכת' 
//       });
//     }
    
//     res.status(500).json({ error: 'Database error', details: err.message });
//   }
// });

// // נקודת קצה למחיקת מוסד
// app.delete('/api/institutions/:id', async (req, res) => {
//   const { id } = req.params;
//   console.log(`📥 קיבלנו פנייה למחיקת מוסד מס' ${id}`);
  
//   try {
//     // בדיקה אם המוסד קיים
//     const checkResult = await pool.query('SELECT id FROM institutions WHERE id = $1', [id]);
//     if (checkResult.rows.length === 0) {
//       return res.status(404).json({ error: 'Institution not found' });
//     }
    
//     // בדיקה אם יש תרומות או נתונים אחרים המקושרים למוסד זה
//     const donationsCheck = await pool.query('SELECT COUNT(*) FROM donations WHERE institution_id = $1', [id]);
//     if (parseInt(donationsCheck.rows[0].count) > 0) {
//       return res.status(400).json({ 
//         error: 'Cannot delete institution', 
//         message: 'לא ניתן למחוק את המוסד כי קיימות תרומות המקושרות אליו' 
//       });
//     }
    
//     // מחיקת המוסד
//     await pool.query('DELETE FROM institutions WHERE id = $1', [id]);
    
//     console.log("✅ מוסד נמחק בהצלחה:", id);
//     res.status(200).json({ success: true, message: 'Institution deleted successfully' });
//   } catch (err) {
//     console.error("❌ DB ERROR:", err);
//     res.status(500).json({ error: 'Database error', details: err.message });
//   }
// });

// // ============ נתיבי HTML ===============
// // דף הבית
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// // דף תרומות
// app.get('/donations', async (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// // דף מוסדות
// app.get('/institutions', async (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// // טיפול בנתיבים לא מוגדרים - החזרת שגיאה 404
// app.use((req, res) => {
//   res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
// });

// // הפעלת השרת
// app.listen(PORT, () => {
//   console.log(`🚀 השרת פועל בכתובת: http://localhost:${PORT}`);
// });

// module.exports = app; // ייצוא האפליקציה עבור בדיקות


// // נקודת קצה להתחברות
// app.post('/api/auth/login', async (req, res) => {
//   // קוד ההתחברות...
// });

// // נקודת קצה להתנתקות
// app.post('/api/auth/logout', (req, res) => {
//   res.json({ success: true });
// });

// // ניתובים לדפי HTML
// app.get('/login', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'login.html'));
// });

// app.get('/admin', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
// });

// app.get('/admin/institutions', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'admin', 'institutions.html'));
// });

// app.get('/institution', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'institution', 'index.html'));
// });
require('dotenv').config();
console.log("🔍 DATABASE_URL:", process.env.DATABASE_URL);

const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

// יצירת אפליקציית Express
const app = express();
const PORT = process.env.PORT || 3001;

// מידלוור
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// חיבור ל-Supabase עם SSL
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'institutions_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// בדיקת חיבור למסד הנתונים
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ שגיאה בהתחברות למסד הנתונים:', err);
  } else {
    console.log('✅ התחברות למסד הנתונים הצליחה');
    release();
  }
});

// יצירת טבלאות אם לא קיימות
async function createTablesIfNotExist() {
  try {
    // טבלת משתמשים
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        role VARCHAR(20) NOT NULL,
        institution_id INTEGER,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `);
    
    // טבלת מוסדות
    await pool.query(`
      CREATE TABLE IF NOT EXISTS institutions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        contact_name VARCHAR(255) NOT NULL,
        contact_phone VARCHAR(50) NOT NULL,
        address TEXT NOT NULL,
        website VARCHAR(255),
        institution_type VARCHAR(100) NOT NULL,
        registration_number VARCHAR(50) UNIQUE NOT NULL,
        authorization_level VARCHAR(50) NOT NULL,
        max_users INTEGER NOT NULL,
        package_type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // הוספת מוסד לדוגמה אם אין מוסדות
    const institutionsCount = await pool.query(`SELECT COUNT(*) FROM institutions`);
    if (parseInt(institutionsCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO institutions (
          name, 
          contact_name, 
          contact_phone, 
          address, 
          website, 
          institution_type, 
          registration_number, 
          authorization_level, 
          max_users, 
          package_type
        ) VALUES 
        ('עמותת אור לילד', 'ישראל ישראלי', '052-1234567', 'רחוב הרצל 10, תל אביב', 'https://example.org', 'עמותה', '580123456', 'admin', 50, 'premium')
      `);
      console.log("✅ נוצר מוסד לדוגמה");
    }
    
    // טבלת תורמים
    await pool.query(`
      CREATE TABLE IF NOT EXISTS donors (
        id SERIAL PRIMARY KEY,
        institution_id INTEGER REFERENCES institutions(id),
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // טבלת תרומות
    await pool.query(`
      CREATE TABLE IF NOT EXISTS donations (
        id SERIAL PRIMARY KEY,
        institution_id INTEGER REFERENCES institutions(id),
        donor_id INTEGER REFERENCES donors(id),
        amount DECIMAL(10, 2) NOT NULL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      )
    `);
    
    // בדיקה אם יש משתמשים, ואם לא יצירת משתמש אדמין
    const usersCount = await pool.query(`SELECT COUNT(*) FROM users`);
    if (parseInt(usersCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO users (
          username,
          password_hash,
          email,
          role,
          is_active
        ) VALUES (
          'admin',
          'admin123', -- בסביבת ייצור צריך להשתמש בהצפנה אמיתית
          'admin@example.com',
          'admin',
          true
        )
      `);
      console.log("✅ נוצר משתמש אדמין");
    }
    
    console.log("✅ טבלאות נוצרו או כבר קיימות במסד הנתונים");
  } catch (err) {
    console.error("❌ שגיאה ביצירת טבלאות:", err);
  }
}

// הרצת פונקציית יצירת הטבלאות בהפעלת השרת
createTablesIfNotExist();

// ============ נתיבי API ===============

// ------ נתיבי אימות ------
// נקודת קצה להתחברות
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  console.log("📥 קיבלנו פנייה להתחברות:", username);
  
  try {
    // בדיקת שם משתמש וסיסמה מול מסד הנתונים
    const result = await pool.query(`
      SELECT 
        u.id, 
        u.username, 
        u.password_hash, 
        u.role, 
        u.institution_id
      FROM users u
      WHERE u.username = $1 AND u.is_active = true
    `, [username]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Authentication failed', 
        message: 'שם משתמש או סיסמה שגויים' 
      });
    }
    
    const user = result.rows[0];
    
    // בדיקת סיסמה (כרגע השוואה פשוטה, במערכת אמיתית צריך להשתמש ב-bcrypt)
    // במערכת אמיתית:
    // const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    const isPasswordValid = (password === user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Authentication failed', 
        message: 'שם משתמש או סיסמה שגויים' 
      });
    }
    
    // עדכון זמן התחברות אחרון
    await pool.query(`
      UPDATE users
      SET last_login = NOW()
      WHERE id = $1
    `, [user.id]);
    
    // יצירת טוקן JWT פשוט (במערכת אמיתית צריך להשתמש בספריית JWT)
    // במערכת אמיתית: 
    // const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    const token = `fake-token-${user.id}-${Date.now()}`;
    
    // החזרת פרטי המשתמש והטוקן
    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      institution_id: user.institution_id,
      token: token
    });
    
    console.log("✅ התחברות בוצעה בהצלחה:", user.username);
  } catch (err) {
    console.error("❌ שגיאה בהתחברות:", err);
    res.status(500).json({ error: 'Server error', message: 'שגיאת שרת, אנא נסה שוב מאוחר יותר' });
  }
});

// נקודת קצה להתנתקות
app.post('/api/auth/logout', (req, res) => {
  // אין צורך בלוגיקה מיוחדת בצד שרת, כי הטוקן נשמר בצד לקוח
  res.json({ success: true, message: 'התנתקות בוצעה בהצלחה' });
});

// ------ נתיבי תרומות ------
app.get('/gettrumot', async (req, res) => {
  console.log("📥 קיבלנו פנייה ל- /gettrumot");

  try {
    const result = await pool.query(`
      SELECT donors.name, donors.phone, donations.amount, donations.date
      FROM donations
      JOIN donors ON donors.id = donations.donor_id
      ORDER BY donations.date DESC
    `);

    console.log("✅ שלפנו נתוני תרומות:", result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ DB ERROR:", err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// ------ נתיבי מוסדות ------
// נקודת קצה להחזרת כל המוסדות
app.get('/api/institutions', async (req, res) => {
  console.log("📥 קיבלנו פנייה ל- /api/institutions");
  try {
    const result = await pool.query(`
      SELECT * FROM institutions
      ORDER BY name ASC
    `);
    console.log("✅ שלפנו נתוני מוסדות:", result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ DB ERROR:", err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// נקודת קצה לחיפוש מוסדות
app.get('/api/institutions/search/:term', async (req, res) => {
  const { term } = req.params;
  console.log(`📥 קיבלנו פנייה לחיפוש מוסדות לפי "${term}"`);
  
  try {
    const result = await pool.query(`
      SELECT * FROM institutions
      WHERE 
        name ILIKE $1 OR
        contact_name ILIKE $1 OR
        address ILIKE $1 OR
        registration_number ILIKE $1
      ORDER BY name ASC
    `, [`%${term}%`]);
    
    console.log("✅ נמצאו מוסדות בחיפוש:", result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ DB ERROR:", err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// נקודת קצה למידע סטטיסטי על המוסדות
app.get('/api/institutions/stats/summary', async (req, res) => {
  console.log("📥 קיבלנו פנייה למידע סטטיסטי על המוסדות");
  
  try {
    // מספר המוסדות לפי סוג
    const typeStats = await pool.query(`
      SELECT institution_type, COUNT(*) as count
      FROM institutions
      GROUP BY institution_type
      ORDER BY count DESC
    `);
    
    // מספר המוסדות לפי חבילה
    const packageStats = await pool.query(`
      SELECT package_type, COUNT(*) as count
      FROM institutions
      GROUP BY package_type
      ORDER BY count DESC
    `);
    
    // סה"כ מספר המוסדות
    const totalInstitutions = await pool.query(`
      SELECT COUNT(*) as total
      FROM institutions
    `);
    
    // סה"כ משתמשים
    const totalUsers = await pool.query(`
      SELECT SUM(max_users) as total_users
      FROM institutions
    `);
    
    // מוסדות חדשים החודש
    const newInstitutions = await pool.query(`
      SELECT COUNT(*) as count
      FROM institutions
      WHERE created_at >= date_trunc('month', CURRENT_DATE)
    `);
    
    res.json({
      total_institutions: parseInt(totalInstitutions.rows[0].total),
      total_users: parseInt(totalUsers.rows[0].total_users) || 0,
      new_institutions: parseInt(newInstitutions.rows[0].count) || 0,
      by_type: typeStats.rows,
      by_package: packageStats.rows
    });
  } catch (err) {
    console.error("❌ DB ERROR:", err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// נקודת קצה להחזרת מוסד ספציפי לפי מזהה
app.get('/api/institutions/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`📥 קיבלנו פנייה למוסד מס' ${id}`);
  
  try {
    const result = await pool.query(`
      SELECT * FROM institutions
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ DB ERROR:", err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// נקודת קצה להוספת מוסד חדש
app.post('/api/institutions', async (req, res) => {
  const {
    name,
    contact_name,
    contact_phone,
    address,
    website,
    institution_type,
    registration_number,
    authorization_level,
    max_users,
    package_type
  } = req.body;
  
  console.log("📥 קיבלנו פנייה ליצירת מוסד חדש:", name);
  
  try {
    const result = await pool.query(`
      INSERT INTO institutions (
        name,
        contact_name,
        contact_phone,
        address,
        website,
        institution_type,
        registration_number,
        authorization_level,
        max_users,
        package_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      name,
      contact_name,
      contact_phone,
      address,
      website,
      institution_type,
      registration_number,
      authorization_level,
      max_users,
      package_type
    ]);
    
    console.log("✅ מוסד חדש נוצר בהצלחה:", result.rows[0].id);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ DB ERROR:", err);
    
    // בדיקה לשגיאת כפילות של מספר רישום
    if (err.code === '23505' && err.constraint === 'institutions_registration_number_key') {
      return res.status(400).json({ 
        error: 'Duplicate registration number', 
        message: 'מספר הרישום כבר קיים במערכת' 
      });
    }
    
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// נקודת קצה לעדכון מוסד קיים
app.put('/api/institutions/:id', async (req, res) => {
  const { id } = req.params;
  const {
    name,
    contact_name,
    contact_phone,
    address,
    website,
    institution_type,
    registration_number,
    authorization_level,
    max_users,
    package_type
  } = req.body;
  
  console.log(`📥 קיבלנו פנייה לעדכון מוסד מס' ${id}`);
  
  try {
    // בדיקה אם המוסד קיים
    const checkResult = await pool.query('SELECT id FROM institutions WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }
    
    const result = await pool.query(`
      UPDATE institutions
      SET 
        name = $1,
        contact_name = $2,
        contact_phone = $3,
        address = $4,
        website = $5,
        institution_type = $6,
        registration_number = $7,
        authorization_level = $8,
        max_users = $9,
        package_type = $10,
        updated_at = NOW()
      WHERE id = $11
      RETURNING *
    `, [
      name,
      contact_name,
      contact_phone,
      address,
      website,
      institution_type,
      registration_number,
      authorization_level,
      max_users,
      package_type,
      id
    ]);
    
    console.log("✅ מוסד עודכן בהצלחה:", id);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ DB ERROR:", err);
    
    // בדיקה לשגיאת כפילות של מספר רישום
    if (err.code === '23505' && err.constraint === 'institutions_registration_number_key') {
      return res.status(400).json({ 
        error: 'Duplicate registration number', 
        message: 'מספר הרישום כבר קיים במערכת' 
      });
    }
    
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// נקודת קצה למחיקת מוסד
app.delete('/api/institutions/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`📥 קיבלנו פנייה למחיקת מוסד מס' ${id}`);
  
  try {
    // בדיקה אם המוסד קיים
    const checkResult = await pool.query('SELECT id FROM institutions WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }
    
    // בדיקה אם יש תרומות או נתונים אחרים המקושרים למוסד זה
    const donationsCheck = await pool.query('SELECT COUNT(*) FROM donations WHERE institution_id = $1', [id]);
    if (parseInt(donationsCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete institution', 
        message: 'לא ניתן למחוק את המוסד כי קיימות תרומות המקושרות אליו' 
      });
    }
    
    // מחיקת המוסד
    await pool.query('DELETE FROM institutions WHERE id = $1', [id]);
    
    console.log("✅ מוסד נמחק בהצלחה:", id);
    res.status(200).json({ success: true, message: 'Institution deleted successfully' });
  } catch (err) {
    console.error("❌ DB ERROR:", err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// ============ נתיבי HTML ===============
// דף הבית
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// דף התחברות
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// דף מנהל המערכת
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// דף ניהול מוסדות למנהל
app.get('/admin/institutions', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'institutions.html'));
});

// דף ראשי למוסד
app.get('/institution', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'institution', 'index.html'));
});

// דף תרומות
app.get('/donations', async (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// דף מוסדות
app.get('/institutions', async (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// טיפול בנתיבים לא מוגדרים - החזרת שגיאה 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// הפעלת השרת
app.listen(PORT, () => {
  console.log(`🚀 השרת פועל בכתובת: http://localhost:${PORT}`);
});
// דף ניהול תורמים למוסד
app.get('/institution/donors', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'institution', 'donors.html'));
});

// דף ניהול תרומות למוסד
app.get('/institution/donations', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'institution', 'donations.html'));
});
module.exports = app; // ייצוא האפליקציה עבור בדיקות