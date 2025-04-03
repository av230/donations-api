// public/js/institution/dashboard.js
document.addEventListener('DOMContentLoaded', async function() {
    // קבלת פרטי המשתמש מהאחסון המקומי
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    
    if (!user || !user.institution_id) {
      // אם אין מזהה מוסד, הפנייה לדף התחברות
      window.location.href = '/login';
      return;
    }
  
    try {
      // בקשה לקבלת פרטי המוסד
      const response = await fetch(`/api/institutions/${user.institution_id}`);
      if (!response.ok) {
        throw new Error('שגיאה בטעינת פרטי המוסד');
      }
      
      const institution = await response.json();
      
      // עדכון הפרטים בדף
      document.getElementById('institutionName').textContent = institution.name || 'מוסד';
      document.getElementById('userName').textContent = user.username || 'משתמש';
      document.getElementById('institutionType').textContent = institution.institution_type || '-';
      document.getElementById('registrationNumber').textContent = institution.registration_number || '-';
      document.getElementById('contactName').textContent = institution.contact_name || '-';
      
      // עוד עדכונים לפי הצורך...
      
    } catch (error) {
      console.error('שגיאה בטעינת נתונים:', error);
      alert('אירעה שגיאה בטעינת נתוני המוסד');
    }
  });