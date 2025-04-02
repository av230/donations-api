/**
 * קובץ JavaScript ללוח בקרה של המוסד
 */

// רפרנס למודל
let quickDonationModal;
let donationsChart;

// גורמים גלובליים
let institutionData;
let topDonors = [];
let recentDonations = [];
let monthlyDonationsData = [];
let donors = [];

// אתחול הדף
document.addEventListener('DOMContentLoaded', async function() {
    // קבלת פרטי המשתמש מהאחסון המקומי
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    
    if (!user || !user.institution_id) {
        // אם אין מזהה מוסד, הפנייה לדף התחברות
        window.location.href = '/login';
        return;
    }

    // יצירת רפרנס למודל
    quickDonationModal = new bootstrap.Modal(document.getElementById('quickDonationModal'));
    
    // טעינת נתונים
    try {
        // טעינת נתוני המוסד
        await loadInstitutionData(user.institution_id);
        
        // טעינת נתוני תורמים
        await loadDonors(user.institution_id);
        
        // טעינת נתוני תרומות אחרונות
        await loadRecentDonations(user.institution_id);
        
        // טעינת נתוני תורמים מובילים
        await loadTopDonors(user.institution_id);
        
        // טעינת נתונים לגרף
        await loadChartData(user.institution_id);
        
        // יצירת הגרף
        createDonationsChart();
        
        // עדכון שם המשתמש
        document.getElementById('userName').textContent = user.username || 'משתמש';
    } catch (error) {
        console.error('שגיאה בטעינת נתונים:', error);
        alert('אירעה שגיאה בטעינת נתוני המוסד');
    }
    
    // אירועים ללחצנים
    document.getElementById('quickDonationBtn').addEventListener('click', showQuickDonationModal);
    document.getElementById('saveQuickDonationBtn').addEventListener('click', saveQuickDonation);
    document.getElementById('logoutBtn').addEventListener('click', logout);
});

/**
 * טעינת נתוני המוסד
 */
async function loadInstitutionData(institutionId) {
    try {
        // בפרויקט אמיתי, יש לפנות לשרת לקבלת הנתונים
        // const response = await fetch(`/api/institutions/${institutionId}`);
        // institutionData = await response.json();
        
        // לצורך הדגמה, ניצור נתונים לדוגמה
        institutionData = {
            id: institutionId,
            name: 'עמותת אור לילד',
            contact_name: 'ישראל ישראלי',
            contact_phone: '052-1234567',
            address: 'רחוב הרצל 10, תל אביב',
            website: 'https://example.org',
            institution_type: 'עמותה',
            registration_number: '580123456',
            authorization_level: 'admin',
            max_users: 50,
            package_type: 'premium'
        };
        
        // עדכון פרטי המוסד בדף
        document.getElementById('institutionName').textContent = institutionData.name;
        document.getElementById('institutionType').textContent = institutionData.institution_type;
        document.getElementById('registrationNumber').textContent = institutionData.registration_number;
        document.getElementById('contactName').textContent = institutionData.contact_name;
        document.getElementById('packageType').textContent = getPackageNameHebrew(institutionData.package_type);
        document.getElementById('maxUsers').textContent = institutionData.max_users;
    } catch (error) {
        console.error('שגיאה בטעינת נתוני המוסד:', error);
        throw error;
    }
}

/**
 * טעינת נתוני תורמים
 */
async function loadDonors(institutionId) {
    try {
        // בפרויקט אמיתי, יש לפנות לשרת לקבלת הנתונים
        // const response = await fetch(`/api/institutions/${institutionId}/donors`);
        // donors = await response.json();
        
        // לצורך הדגמה, ניצור נתונים לדוגמה
        donors = [
            { id: 1, name: 'ישראל ישראלי', email: 'israel@example.com', phone: '054-1234567' },
            { id: 2, name: 'חיים כהן', email: 'haim@example.com', phone: '050-7654321' },
            { id: 3, name: 'שרה לוי', email: 'sarah@example.com', phone: '052-9876543' }
        ];
        
        // עדכון רשימת התורמים במודל ההוספה המהירה
        const donorSelect = document.getElementById('quickDonorSelect');
        donorSelect.innerHTML = '<option value="">בחר תורם...</option>';
        
        donors.forEach(donor => {
            const option = document.createElement('option');
            option.value = donor.id;
            option.textContent = donor.name;
            donorSelect.appendChild(option);
        });
        
        // עדכון מספר התורמים הפעילים
        document.getElementById('activeDonors').textContent = donors.length;
    } catch (error) {
        console.error('שגיאה בטעינת נתוני תורמים:', error);
        throw error;
    }
}

/**
 * טעינת נתוני תרומות אחרונות
 */
async function loadRecentDonations(institutionId) {
    try {
        // בפרויקט אמיתי, יש לפנות לשרת לקבלת הנתונים
        // const response = await fetch(`/api/institutions/${institutionId}/donations/recent`);
        // recentDonations = await response.json();
        
        // לצורך הדגמה, ניצור נתונים לדוגמה
        const today = new Date();
        const oneDayMs = 24 * 60 * 60 * 1000;
        
        recentDonations = [
            {
                id: 1,
                donor_id: 1,
                donor_name: 'ישראל ישראלי',
                amount: 1000,
                date: new Date(today - oneDayMs * 2),
                payment_method: 'credit',
                receipt_number: 'REC-2023-001'
            },
            {
                id: 2,
                donor_id: 2,
                donor_name: 'חיים כהן',
                amount: 500,
                date: new Date(today - oneDayMs * 5),
                payment_method: 'bank',
                receipt_number: 'REC-2023-002'
            },
            {
                id: 3,
                donor_id: 3,
                donor_name: 'שרה לוי',
                amount: 2500,
                date: new Date(today - oneDayMs * 10),
                payment_method: 'check',
                receipt_number: null
            }
        ];
        
        // חישוב תרומות החודש וסכום החודש
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthlyDonations = recentDonations.filter(d => new Date(d.date) >= firstDayOfMonth);
        const monthlyAmount = monthlyDonations.reduce((sum, d) => sum + d.amount, 0);
        const avgAmount = recentDonations.length > 0 ? 
                          recentDonations.reduce((sum, d) => sum + d.amount, 0) / recentDonations.length : 
                          0;
        
        // עדכון הסטטיסטיקות בדף
        document.getElementById('monthlyDonations').textContent = monthlyDonations.length;
        document.getElementById('monthlyAmount').textContent = '₪' + formatNumber(monthlyAmount);
        document.getElementById('avgDonation').textContent = '₪' + formatNumber(avgAmount);
        
        // עדכון טבלת התרומות האחרונות
        updateRecentDonationsTable();
    } catch (error) {
        console.error('שגיאה בטעינת נתוני תרומות אחרונות:', error);
        throw error;
    }
}

/**
 * עדכון טבלת התרומות האחרונות
 */
function updateRecentDonationsTable() {
    const tableBody = document.getElementById('recentDonationsTable');
    tableBody.innerHTML = '';
    
    if (recentDonations.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">אין תרומות להצגה</td></tr>';
        return;
    }
    
    // מיון לפי תאריך (מהחדש לישן)
    const sortedDonations = [...recentDonations].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // הצגת עד 5 תרומות אחרונות
    const recentFive = sortedDonations.slice(0, 5);
    
    recentFive.forEach(donation => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${formatDate(donation.date)}</td>
            <td>${donation.donor_name}</td>
            <td class="fw-bold">₪${formatNumber(donation.amount)}</td>
            <td>${getPaymentMethodHebrew(donation.payment_method)}</td>
            <td>${donation.receipt_number || '<span class="text-muted">לא הונפק</span>'}</td>
            <td>
                <a href="/institution/donations?id=${donation.id}" class="btn btn-sm btn-outline-primary">
                    <i class="bi bi-eye"></i>
                </a>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

/**
 * טעינת נתוני תורמים מובילים
 */
async function loadTopDonors(institutionId) {
    try {
        // בפרויקט אמיתי, יש לפנות לשרת לקבלת הנתונים
        // const response = await fetch(`/api/institutions/${institutionId}/donors/top`);
        // topDonors = await response.json();
        
        // לצורך הדגמה, ניצור נתונים לדוגמה
        topDonors = [
            { id: 1, name: 'ישראל ישראלי', total_amount: 5000 },
            { id: 3, name: 'שרה לוי', total_amount: 4500 },
            { id: 2, name: 'חיים כהן', total_amount: 2000 }
        ];
        
        // עדכון רשימת התורמים המובילים
        updateTopDonorsList();
    } catch (error) {
        console.error('שגיאה בטעינת נתוני תורמים מובילים:', error);
        throw error;
    }
}

/**
 * עדכון רשימת התורמים המובילים
 */
function updateTopDonorsList() {
    const list = document.getElementById('topDonorsList');
    list.innerHTML = '';
    
    if (topDonors.length === 0) {
        list.innerHTML = '<li class="list-group-item">אין נתונים להצגה</li>';
        return;
    }
    
    // מיון לפי סכום התרומות (מהגבוה לנמוך)
    const sortedDonors = [...topDonors].sort((a, b) => b.total_amount - a.total_amount);
    
    sortedDonors.forEach((donor, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
        
        // קביעת צבע לפי מיקום
        let badgeClass = 'bg-secondary';
        if (index === 0) badgeClass = 'bg-warning';
        else if (index === 1) badgeClass = 'bg-secondary';
        else if (index === 2) badgeClass = 'bg-info';
        
        listItem.innerHTML = `
            <div>
                <span class="badge ${badgeClass} me-2">${index + 1}</span>
                ${donor.name}
            </div>
            <span class="badge bg-primary rounded-pill">₪${formatNumber(donor.total_amount)}</span>
        `;
        
        list.appendChild(listItem);
    });
}

/**
 * טעינת נתונים לגרף
 */
async function loadChartData(institutionId) {
    try {
        // בפרויקט אמיתי, יש לפנות לשרת לקבלת הנתונים
        // const response = await fetch(`/api/institutions/${institutionId}/donations/monthly`);
        // monthlyDonationsData = await response.json();
        
        // לצורך הדגמה, ניצור נתונים לדוגמה
        const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
        const currentMonth = new Date().getMonth();
        
        monthlyDonationsData = months.map((month, index) => {
            // נייצר נתונים אקראיים, עם ערכים גבוהים יותר בחודשים האחרונים
            const factor = index <= currentMonth ? 1 : 0.5; // להבדיל בין העבר לעתיד
            const count = Math.round(Math.random() * 20 * factor) + 5;
            const average = Math.round((Math.random() * 500) + 500);
            
            return {
                month,
                count,
                amount: count * average
            };
        });
    } catch (error) {
        console.error('שגיאה בטעינת נתוני גרף:', error);
        throw error;
    }
}

/**
 * יצירת גרף תרומות
 */
function createDonationsChart() {
    const ctx = document.getElementById('donationsChart').getContext('2d');
    
    // הגדרת צבעים
    const primaryColor = '#007bff';
    const secondaryColor = '#ff6b6b';
    
    // יצירת מערכים לגרף
    const labels = monthlyDonationsData.map(item => item.month);
    const amounts = monthlyDonationsData.map(item => item.amount);
    const counts = monthlyDonationsData.map(item => item.count);
    
    // יצירת הגרף
    donationsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'סכום תרומות (₪)',
                    data: amounts,
                    backgroundColor: primaryColor,
                    borderColor: primaryColor,
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'מספר תרומות',
                    data: counts,
                    type: 'line',
                    borderColor: secondaryColor,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointBackgroundColor: secondaryColor,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'סכום תרומות (₪)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    },
                    title: {
                        display: true,
                        text: 'מספר תרומות'
                    }
                }
            }
        }
    });
}

/**
 * הצגת מודל הוספת תרומה מהירה
 */
function showQuickDonationModal() {
    document.getElementById('quickDonationForm').reset();
    quickDonationModal.show();
}

/**
 * שמירת תרומה מהירה
 */
function saveQuickDonation() {
    // בדיקת תקינות הטופס
    const form = document.getElementById('quickDonationForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const donorId = document.getElementById('quickDonorSelect').value;
    const amount = document.getElementById('quickAmount').value;
    const paymentMethod = document.getElementById('quickPaymentMethod').value;
    const sendReceipt = document.getElementById('quickSendReceipt').checked;
    
    // בפרויקט אמיתי, יש לשלוח את הנתונים לשרת
    alert(`תרומה חדשה נוספה בהצלחה: ₪${amount} מתורם מס' ${donorId}`);
    
    // סגירת המודל
    quickDonationModal.hide();
    
    // הפנייה לדף התרומות
    window.location.href = '/institution/donations';
}

/**
 * התנתקות מהמערכת
 */
function logout() {
    // מחיקת נתוני המשתמש מהאחסון המקומי
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    
    // הפנייה לדף ההתחברות
    window.location.href = '/login';
}

/* פונקציות עזר */

/**
 * פורמט מספר עם פסיקים
 */
function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * פורמט תאריך
 */
function formatDate(dateString) {
    if (!dateString) return 'לא ידוע';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'לא ידוע';
    
    return date.toLocaleDateString('he-IL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

/**
 * המרת סוג חבילה לעברית
 */
function getPackageNameHebrew(packageType) {
    const packages = {
        'premium': 'פרימיום',
        'basic': 'בסיסי',
        'free': 'חינם'
    };
    return packages[packageType] || packageType;
}

/**
 * המרת אמצעי תשלום לעברית
 */
function getPaymentMethodHebrew(paymentMethod) {
    const methods = {
        'credit': 'כרטיס אשראי',
        'cash': 'מזומן',
        'check': 'צ\'ק',
        'bank': 'העברה בנקאית',
        'other': 'אחר'
    };
    return methods[paymentMethod] || paymentMethod;
}