const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateAdmin } = require('../middleware/auth');

// הגנה על כל הנתיבים - דרישת הרשאת אדמין
router.use(authenticateAdmin);

// נקודת קצה להחזרת סטטיסטיקות למנהל המערכת
router.get('/stats', async (req, res) => {
  try {
    // סה"כ מוסדות
    const institutionsResult = await pool.query(`
      SELECT COUNT(*) as total_institutions FROM institutions
    `);
    
    // סה"כ משתמשים
    const usersResult = await pool.query(`
      SELECT COUNT(*) as total_users FROM users WHERE is_active = true
    `);
    
    // מוסדות חדשים החודש
    const newInstitutionsResult = await pool.query(`
      SELECT COUNT(*) as new_institutions 
      FROM institutions 
      WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `);
    
    // סה"כ תרומות החודש
    const donationsResult = await pool.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total 
      FROM donations 
      WHERE donation_date >= DATE_TRUNC('month', CURRENT_DATE)
    `);
    
    // התפלגות מוסדות לפי סוג
    const byTypeResult = await pool.query(`
      SELECT institution_type, COUNT(*) as count
      FROM institutions
      GROUP BY institution_type
      ORDER BY count DESC
    `);
    
    // התפלגות מוסדות לפי חבילה
    const byPackageResult = await pool.query(`
      SELECT package_type, COUNT(*) as count
      FROM institutions
      GROUP BY package_type
      ORDER BY count DESC
    `);
    
    res.json({
      total_institutions: parseInt(institutionsResult.rows[0].total_institutions),
      total_users: parseInt(usersResult.rows[0].total_users),
      new_institutions: parseInt(newInstitutionsResult.rows[0].new_institutions),
      monthly_donations: {
        count: parseInt(donationsResult.rows[0].count),
        total: parseFloat(donationsResult.rows[0].total)
      },
      by_type: byTypeResult.rows,
      by_package: byPackageResult.rows
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// נקודת קצה להחזרת פעילות אחרונה במערכת
router.get('/activity', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.id,
        a.action_type,
        a.resource_type,
        a.resource_id,
        a.created_at,
        i.name as institution_name,
        u.username
      FROM activity_log a
      LEFT JOIN institutions i ON a.institution_id = i.id
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 20
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching activity log:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// נקודת קצה להחזרת כל המוסדות למנהל המערכת
router.get('/institutions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, 
        (SELECT COUNT(*) FROM users WHERE institution_id = i.id) as user_count,
        (SELECT SUM(amount) FROM donations WHERE institution_id = i.id) as total_donations
      FROM institutions i
      ORDER BY i.name ASC
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching institutions:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// נקודת קצה להחזרת מוסד ספציפי לפי מזהה
router.get('/institutions/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // פרטי המוסד
    const institutionResult = await pool.query(`
      SELECT * FROM institutions WHERE id = $1
    `, [id]);
    
    if (institutionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }
    
    const institution = institutionResult.rows[0];
    
    // סטטיסטיקה על משתמשים
    const usersResult = await pool.query(`
      SELECT COUNT(*) as count FROM users WHERE institution_id = $1
    `, [id]);
    
    // סטטיסטיקה על תורמים
    const donorsResult = await pool.query(`
      SELECT COUNT(*) as count FROM donors WHERE institution_id = $1
    `, [id]);
    
    // סטטיסטיקה על תרומות
    const donationsResult = await pool.query(`
      SELECT 
        COUNT(*) as count, 
        COALESCE(SUM(amount), 0) as total_amount 
      FROM donations 
      WHERE institution_id = $1
    `, [id]);
    
    res.json({
      ...institution,
      stats: {
        users: parseInt(usersResult.rows[0].count),
        donors: parseInt(donorsResult.rows[0].count),
        donations: {
          count: parseInt(donationsResult.rows[0].count),
          total_amount: parseFloat(donationsResult.rows[0].total_amount)
        }
      }
    });
  } catch (err) {
    console.error('Error fetching institution details:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// נקודת קצה להוספת מוסד חדש
router.post('/institutions', async (req, res) => {
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
    
    // יצירת הגדרות ברירת מחדל למוסד
    await pool.query(`
      INSERT INTO institution_settings (institution_id)
      VALUES ($1)
    `, [result.rows[0].id]);
    
    // תיעוד הפעולה ביומן פעילות
    await pool.query(`
      INSERT INTO activity_log (
        user_id, 
        action_type, 
        resource_type, 
        resource_id, 
        details
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      req.user.id,
      'create',
      'institution',
      result.rows[0].id,
      JSON.stringify({ name: name })
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating institution:', err);
    
    // בדיקה לשגיאת כפילות מספר רישום
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
router.put('/institutions/:id', async (req, res) => {
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
    
    // תיעוד הפעולה ביומן פעילות
    await pool.query(`
      INSERT INTO activity_log (
        user_id, 
        action_type, 
        resource_type, 
        resource_id, 
        details
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      req.user.id,
      'update',
      'institution',
      id,
      JSON.stringify({ name: name })
    ]);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating institution:', err);
    
    // בדיקה לשגיאת כפילות מספר רישום
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
router.delete('/institutions/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // בדיקה אם המוסד קיים
    const checkResult = await pool.query('SELECT name FROM institutions WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }
    
    const institutionName = checkResult.rows[0].name;
    
    // בדיקה אם יש תרומות המקושרות למוסד
    const donationsCheck = await pool.query('SELECT COUNT(*) FROM donations WHERE institution_id = $1', [id]);
    if (parseInt(donationsCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete institution', 
        message: 'לא ניתן למחוק את המוסד כי קיימות תרומות המקושרות אליו' 
      });
    }
    
    // מחיקת הגדרות המוסד
    await pool.query('DELETE FROM institution_settings WHERE institution_id = $1', [id]);
    
    // מחיקת משתמשי המוסד
    await pool.query('DELETE FROM users WHERE institution_id = $1', [id]);
    
    // מחיקת תורמים של המוסד
    await pool.query('DELETE FROM donors WHERE institution_id = $1', [id]);
    
    // מחיקת המוסד
    await pool.query('DELETE FROM institutions WHERE id = $1', [id]);
    
    // תיעוד הפעולה ביומן פעילות
    await pool.query(`
      INSERT INTO activity_log (
        user_id, 
        action_type, 
        resource_type, 
        resource_id, 
        details
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      req.user.id,
      'delete',
      'institution',
      id,
      JSON.stringify({ name: institutionName })
    ]);
    
    res.status(200).json({ success: true, message: 'Institution deleted successfully' });
  } catch (err) {
    console.error('Error deleting institution:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// נקודת קצה להחזרת משתמשי המערכת למנהל
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.username, u.email, u.role, u.is_active, u.created_at, u.last_login,
        i.name as institution_name, i.id as institution_id
      FROM users u
      LEFT JOIN institutions i ON u.institution_id = i.id
      ORDER BY u.username ASC
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// נקודת קצה להחזרת משתמש ספציפי
router.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT u.id, u.username, u.email, u.role, u.is_active, u.created_at, u.last_login,
        i.name as institution_name, i.id as institution_id
      FROM users u
      LEFT JOIN institutions i ON u.institution_id = i.id
      WHERE u.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// נקודת קצה להוספת משתמש חדש
router.post('/users', async (req, res) => {
  const {
    username,
    email,
    password,
    role,
    institution_id
  } = req.body;
  
  try {
    // בדיקת תקינות נתונים
    if (role === 'institution' && !institution_id) {
      return res.status(400).json({ 
        error: 'Invalid data', 
        message: 'יש לבחור מוסד עבור משתמש מסוג מוסד' 
      });
    }
    
    // הצפנת הסיסמה (באמצעות bcrypt למשל)
    // const hashedPassword = await bcrypt.hash(password, 10);
    // בשלב זה, נשתמש בסיסמה לא מוצפנת לצורך הדגמה
    const hashedPassword = password;
    
    const result = await pool.query(`
      INSERT INTO users (
        username,
        email,
        password_hash,
        role,
        institution_id,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username, email, role, institution_id, is_active, created_at
    `, [
      username,
      email,
      hashedPassword,
      role,
      role === 'admin' ? null : institution_id,
      true
    ]);
    
    // תיעוד הפעולה ביומן פעילות
    await pool.query(`
      INSERT INTO activity_log (
        user_id, 
        action_type, 
        resource_type, 
        resource_id, 
        details
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      req.user.id,
      'create',
      'user',
      result.rows[0].id,
      JSON.stringify({ username, role })
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating user:', err);
    
    // בדיקה לשגיאת כפילות שם משתמש או אימייל
    if (err.code === '23505') {
      if (err.constraint === 'users_username_key') {
        return res.status(400).json({ 
          error: 'Duplicate username', 
          message: 'שם המשתמש כבר קיים במערכת' 
        });
      }
      if (err.constraint === 'users_email_key') {
        return res.status(400).json({ 
          error: 'Duplicate email', 
          message: 'כתובת האימייל כבר קיימת במערכת' 
        });
      }
    }
    
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// נקודת קצה לעדכון משתמש קיים
router.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const {
    email,
    role,
    institution_id,
    is_active
  } = req.body;
  
  try {
    // בדיקה אם המשתמש קיים
    const checkResult = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // בדיקת תקינות נתונים
    if (role === 'institution' && !institution_id) {
      return res.status(400).json({ 
        error: 'Invalid data', 
        message: 'יש לבחור מוסד עבור משתמש מסוג מוסד' 
      });
    }
    
    const result = await pool.query(`
      UPDATE users
      SET 
        email = $1,
        role = $2,
        institution_id = $3,
        is_active = $4,
        updated_at = NOW()
      WHERE id = $5
      RETURNING id, username, email, role, institution_id, is_active, created_at
    `, [
      email,
      role,
      role === 'admin' ? null : institution_id,
      is_active,
      id
    ]);
    
    // תיעוד הפעולה ביומן פעילות
    await pool.query(`
      INSERT INTO activity_log (
        user_id, 
        action_type, 
        resource_type, 
        resource_id, 
        details
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      req.user.id,
      'update',
      'user',
      id,
      JSON.stringify({ role, is_active })
    ]);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating user:', err);
    
    // בדיקה לשגיאת כפילות אימייל
    if (err.code === '23505' && err.constraint === 'users_email_key') {
      return res.status(400).json({ 
        error: 'Duplicate email', 
        message: 'כתובת האימייל כבר קיימת במערכת' 
      });
    }
    
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// ייצוא המודול
module.exports = router;