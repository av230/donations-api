/**
 * קובץ JavaScript לניהול תרומות - מערכת ניהול מוסד
 */

// משתנים גלובליים
let donations = [];
let donors = [];
let currentDonationId = null;
let currentPage = 1;
const itemsPerPage = 10;

// רפרנס למודלים
let donationModal;
let viewDonationModal;
let deleteConfirmModal;

// אתחול הדף
document.addEventListener('DOMContentLoaded', async function() {
    // קבלת פרטי המשתמש מהאחסון המקומי
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    
    if (!user || !user.institution_id) {
        // אם אין מזהה מוסד, הפנייה לדף התחברות
        window.location.href = '/login';
        return;
    }

    // יצירת רפרנסים למודלים
    donationModal = new bootstrap.Modal(document.getElementById('donationModal'));
    viewDonationModal = new bootstrap.Modal(document.getElementById('viewDonationModal'));
    deleteConfirmModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));

    // טעינת נתונים ראשונית
    try {
        // בקשה לקבלת פרטי המוסד
        const institutionResponse = await fetch(`/api/institutions/${user.institution_id}`);
        if (!institutionResponse.ok) {
            throw new Error('שגיאה בטעינת פרטי המוסד');
        }
        
        const institution = await institutionResponse.json();
        
        // עדכון פרטי המוסד בדף
        document.getElementById('institutionName').textContent = institution.name || 'מוסד';
        document.getElementById('userName').textContent = user.username || 'משתמש';

        // טעינת רשימת התורמים (לצורך המודל)
        await loadDonors(user.institution_id);
        
        // טעינת נתוני התרומות
        await loadDonations(user.institution_id);
    } catch (error) {
        console.error('שגיאה בטעינת נתונים:', error);
        alert('אירעה שגיאה בטעינת נתוני המוסד');
    }

    // אירועי לחצנים
    document.getElementById('addDonationBtn').addEventListener('click', showAddDonationModal);
    document.getElementById('saveDonationBtn').addEventListener('click', saveDonation);
    document.getElementById('confirmDeleteBtn').addEventListener('click', deleteDonation);
    document.getElementById('searchBtn').addEventListener('click', searchDonations);
    document.getElementById('editDonationBtn').addEventListener('click', editFromView);
    document.getElementById('exportBtn').addEventListener('click', exportToExcel);
    document.getElementById('printBtn').addEventListener('click', printDonations);
    document.getElementById('receiptBtn').addEventListener('click', printReceipts);
    document.getElementById('addNewDonorLink').addEventListener('click', redirectToAddDonor);
    document.getElementById('viewSendReceiptBtn').addEventListener('click', sendReceipt);

    // אירועי חיפוש וסינון
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchDonations();
        }
    });
    
    document.getElementById('filterPaymentMethod').addEventListener('change', filterDonations);
    document.getElementById('sortBy').addEventListener('change', sortDonations);
});

/**
 * טעינת רשימת תורמים
 */
async function loadDonors(institutionId) {
    try {
        // בפרויקט אמיתי נשתמש ב-API
        // כרגע ניצור נתונים לדוגמה
        donors = [
            { id: 1, name: 'ישראל ישראלי', email: 'israel@example.com', phone: '054-1234567' },
            { id: 2, name: 'חיים כהן', email: 'haim@example.com', phone: '050-7654321' },
            { id: 3, name: 'שרה לוי', email: 'sarah@example.com', phone: '052-9876543' }
        ];
        
        // מילוי התורמים בתיבת הבחירה
        const donorSelect = document.getElementById('donorSelect');
        donorSelect.innerHTML = '<option value="">בחר תורם...</option>';
        
        donors.forEach(donor => {
            const option = document.createElement('option');
            option.value = donor.id;
            option.textContent = donor.name;
            donorSelect.appendChild(option);
        });
    } catch (error) {
        console.error('שגיאה בטעינת תורמים:', error);
    }
}

/**
 * טעינת נתוני התרומות
 */
async function loadDonations(institutionId) {
    showLoader(true);
    
    try {
        // בפרויקט אמיתי נשתמש ב-API
        // כרגע ניצור נתונים לדוגמה
        const today = new Date();
        const oneDayMs = 24 * 60 * 60 * 1000;
        
        donations = [
            {
                id: 1,
                donor_id: 1,
                donor_name: 'ישראל ישראלי',
                amount: 1000,
                date: new Date(today - oneDayMs * 2),
                payment_method: 'credit',
                receipt_number: 'REC-2023-001',
                status: 'completed',
                notes: 'תרומה חודשית קבועה'
            },
            {
                id: 2,
                donor_id: 2,
                donor_name: 'חיים כהן',
                amount: 500,
                date: new Date(today - oneDayMs * 5),
                payment_method: 'bank',
                receipt_number: 'REC-2023-002',
                status: 'completed',
                notes: 'תרומה חד פעמית'
            },
            {
                id: 3,
                donor_id: 3,
                donor_name: 'שרה לוי',
                amount: 2500,
                date: new Date(today - oneDayMs * 10),
                payment_method: 'check',
                receipt_number: null,
                status: 'pending',
                notes: 'תרומה לפרויקט מיוחד'
            }
        ];
        
        // עדכון סטטיסטיקות
        updateStatistics();
        
        // הצגת התרומות
        renderDonations(donations);
    } catch (error) {
        console.error('שגיאה בטעינת התרומות:', error);
        showError('שגיאה בטעינת נתוני התרומות. אנא נסה שוב מאוחר יותר.');
    } finally {
        showLoader(false);
    }
}

/**
 * עדכון סטטיסטיקות
 */
function updateStatistics() {
    const totalDonations = donations.length;
    const totalAmount = donations.reduce((sum, donation) => sum + donation.amount, 0);
    
    // מציאת תרומות החודש
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyDonations = donations.filter(d => new Date(d.date) >= firstDayOfMonth).length;
    
    // חישוב תרומה ממוצעת
    const avgDonation = totalDonations > 0 ? totalAmount / totalDonations : 0;
    
    // עדכון בדף
    document.getElementById('totalDonations').textContent = totalDonations;
    document.getElementById('totalAmount').textContent = '₪' + formatNumber(totalAmount);
    document.getElementById('monthlyDonations').textContent = monthlyDonations;
    document.getElementById('avgDonation').textContent = '₪' + formatNumber(avgDonation);
}