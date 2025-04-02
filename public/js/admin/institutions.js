/**
 * קובץ JavaScript לניהול מוסדות - מערכת מנהל
 */

// משתנים גלובליים
let institutions = [];
let currentInstitutionId = null;
let currentPage = 1;
const itemsPerPage = 12;

// רפרנס למודלים
let institutionModal;
let viewInstitutionModal;
let deleteConfirmModal;

// אתחול הדף
document.addEventListener('DOMContentLoaded', async function() {
    // יצירת רפרנסים למודלים
    institutionModal = new bootstrap.Modal(document.getElementById('institutionModal'));
    viewInstitutionModal = new bootstrap.Modal(document.getElementById('viewInstitutionModal'));
    deleteConfirmModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));

    // טעינת נתונים ראשונית
    await loadInstitutions();
    await loadStatistics();

    // אירועי לחצנים
    document.getElementById('addInstitutionBtn').addEventListener('click', showAddInstitutionModal);
    document.getElementById('saveInstitutionBtn').addEventListener('click', saveInstitution);
    document.getElementById('confirmDeleteBtn').addEventListener('click', deleteInstitution);
    document.getElementById('searchBtn').addEventListener('click', searchInstitutions);
    document.getElementById('editFromViewBtn').addEventListener('click', editFromView);
    document.getElementById('exportBtn').addEventListener('click', exportToExcel);
    document.getElementById('printBtn').addEventListener('click', printInstitutions);

    // אירועי חיפוש וסינון
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchInstitutions();
        }
    });
    
    document.getElementById('filterInstitutionType').addEventListener('change', filterInstitutions);
    document.getElementById('sortBy').addEventListener('change', sortInstitutions);
});

/**
 * טעינת נתוני המוסדות מהשרת
 */
async function loadInstitutions() {
    showLoader(true);
    
    try {
        const response = await fetch('/api/institutions');
        if (!response.ok) {
            throw new Error('שגיאה בטעינת נתונים');
        }
        
        institutions = await response.json();
        renderInstitutions(institutions);
    } catch (error) {
        console.error('שגיאה בטעינת המוסדות:', error);
        showError('שגיאה בטעינת נתוני המוסדות. אנא נסה שוב מאוחר יותר.');
    } finally {
        showLoader(false);
    }
}

/**
 * טעינת סטטיסטיקות
 */
async function loadStatistics() {
    try {
        const response = await fetch('/api/institutions/stats/summary');
        if (!response.ok) {
            throw new Error('שגיאה בטעינת נתוני סטטיסטיקה');
        }
        
        const stats = await response.json();
        
        // עדכון הנתונים בדף
        document.getElementById('totalInstitutions').textContent = stats.total_institutions || 0;
        document.getElementById('activeInstitutions').textContent = stats.total_institutions || 0; // לפי שעה כולם פעילים
        document.getElementById('totalUsers').textContent = stats.total_users || 0;
        document.getElementById('newInstitutions').textContent = stats.new_institutions || 0;
    } catch (error) {
        console.error('שגיאה בטעינת סטטיסטיקות:', error);
    }
}

/**
 * הצגת המוסדות בדף
 */
function renderInstitutions(institutionsToRender) {
    const container = document.getElementById('institutionsContainer');
    const noInstitutionsMessage = document.getElementById('noInstitutionsMessage');
    
    container.innerHTML = '';

    if (!institutionsToRender || institutionsToRender.length === 0) {
        noInstitutionsMessage.style.display = 'block';
        return;
    }
    
    noInstitutionsMessage.style.display = 'none';
    
    // חישוב עמודים וחיתוך הנתונים לעמוד הנוכחי
    const totalPages = Math.ceil(institutionsToRender.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, institutionsToRender.length);
    const currentPageData = institutionsToRender.slice(startIndex, endIndex);
    
    // הצגת המוסדות
    currentPageData.forEach(institution => {
        // קביעת סוג המוסד לצורך עיצוב
        const typeClass = institution.institution_type === 'עמותה' ? 'type-amuta' : 'type-chevra';
        
        // המרת סוג חבילה לעברית
        const packageName = getPackageNameHebrew(institution.package_type);
        
        // יצירת כרטיס למוסד
        const card = document.createElement('div');
        card.className = 'col-md-4 mb-4';
        card.innerHTML = `
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${institution.name}</h5>
                    <span class="institution-type ${typeClass}">${institution.institution_type}</span>
                    <p class="card-text mt-3">
                        <i class="bi bi-person"></i> ${institution.contact_name}<br>
                        <i class="bi bi-telephone"></i> ${institution.contact_phone}<br>
                        <i class="bi bi-geo-alt"></i> ${institution.address}
                    </p>
                    <div class="d-flex justify-content-between mt-3">
                        <small class="text-muted">מספר רישום: ${institution.registration_number}</small>
                        <small class="text-muted">חבילה: ${packageName}</small>
                    </div>
                </div>
                <div class="card-footer bg-transparent">
                    <div class="d-flex justify-content-between">
                        <button class="btn btn-sm btn-outline-primary view-btn" data-id="${institution.id}">
                            <i class="bi bi-eye"></i> צפייה
                        </button>
                        <button class="btn btn-sm btn-primary edit-btn" data-id="${institution.id}">
                            <i class="bi bi-pencil"></i> עריכה
                        </button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${institution.id}" data-name="${institution.name}">
                            <i class="bi bi-trash"></i> מחיקה
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
    
    // הוספת מאזיני אירועים לכפתורים
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            viewInstitution(id);
        });
    });
    
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            editInstitution(id);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const name = this.getAttribute('data-name');
            showDeleteConfirmation(id, name);
        });
    });
    
    // עדכון פאגינציה
    updatePagination(institutionsToRender.length, totalPages);
}