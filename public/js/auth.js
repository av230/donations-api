/**
 * סקריפט אימות משתמש - לשילוב בכל דפי המערכת
 * 
 * שים סקריפט זה בתיקיית /public/js והכלל אותו בכל דף HTML שדורש אימות:
 * <script src="/js/auth.js"></script>
 */

// בדיקה אם המשתמש מחובר בעת טעינת הדף
document.addEventListener('DOMContentLoaded', function() {
    // בדיקת הרשאה לדף הנוכחי
    checkPageAuthorization();

    // הוספת מאזין לכפתור התנתקות, אם קיים בדף
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutUser);
    }
});

/**
 * בדיקת הרשאת משתמש לדף הנוכחי
 */
function checkPageAuthorization() {
    // בדיקה אם יש משתמש מחובר
    const user = getLoggedInUser();
    
    if (!user) {
        // אם אין משתמש מחובר, הפניה לדף התחברות
        redirectToLogin();
        return;
    }
    
    // בדיקת הרשאה לפי URL
    const currentPath = window.location.pathname;
    
    // אם הניתוב מתחיל ב-/admin, נדרשת הרשאת מנהל
    if (currentPath.startsWith('/admin') && user.role !== 'admin') {
        alert('אין לך הרשאה לגשת לדף זה');
        redirectByRole(user.role, user.institution_id);
        return;
    }
    
    // אם הניתוב מתחיל ב-/institution, נדרשת הרשאת מוסד
    if (currentPath.startsWith('/institution') && user.role !== 'institution') {
        alert('אין לך הרשאה לגשת לדף זה');
        redirectByRole(user.role, user.institution_id);
        return;
    }
    
    // עדכון פרטי המשתמש בדף, אם יש אלמנטים מתאימים
    updateUserInfoInPage(user);
}

/**
 * קבלת פרטי המשתמש המחובר מהאחסון המקומי
 */
function getLoggedInUser() {
    // ניסיון לקבל מידע מה-localStorage (אם "זכור אותי" היה מסומן)
    const localUser = localStorage.getItem('user');
    
    // אם אין מידע ב-localStorage, ניסיון לקבל מה-sessionStorage
    const sessionUser = sessionStorage.getItem('user');
    
    // החזרת המידע כאובייקט JSON
    try {
        if (localUser) {
            return JSON.parse(localUser);
        } else if (sessionUser) {
            return JSON.parse(sessionUser);
        }
    } catch (e) {
        console.error('שגיאה בפענוח נתוני המשתמש:', e);
        // אם יש שגיאה בפענוח, מחיקת המידע השגוי מהאחסון
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
    }
    
    // אם אין מידע תקין, החזרת null
    return null;
}

/**
 * התנתקות המשתמש מהמערכת
 */
async function logoutUser() {
    try {
        // פנייה לנקודת הקצה בשרת להתנתקות
        await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
        console.error('שגיאה בהתנתקות מהשרת:', e);
    }
    
    // מחיקת המידע מהאחסון המקומי
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    
    // הפניה לדף התחברות
    redirectToLogin();
}

/**
 * הפניה לדף התחברות
 */
function redirectToLogin() {
    window.location.href = '/login';
}

/**
 * הפניה לפי תפקיד המשתמש
 */
function redirectByRole(role, institutionId) {
    switch (role) {
        case 'admin':
            window.location.href = '/admin';
            break;
        case 'institution':
            window.location.href = '/institution';
            break;
        default:
            redirectToLogin();
    }
}

/**
 * עדכון פרטי המשתמש בדף
 */
function updateUserInfoInPage(user) {
    // עדכון שם המשתמש, אם קיים אלמנט מתאים
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = user.username;
    }
    
    // עדכון שם המוסד, אם קיים אלמנט מתאים ויש למשתמש מוסד
    const institutionNameElement = document.getElementById('institutionName');
    if (institutionNameElement && user.institution_id) {
        // כאן אפשר לבצע בקשה לשרת לקבלת שם המוסד
        // לדוגמה: fetchInstitutionName(user.institution_id);
    }
}