/**
 * Admin Dashboard Logic
 * ---------------------
 * Handles product management, basic auth, and file export.
 */

// Global State
let allProducts = [];
let filteredProducts = [];
let allTickerImages = []; // New State for Ticker
const CREDENTIALS = {
    password: "admin" // Simple client-side protection
};

// Default Ticker Data (Fallback)
const defaultTickerImages = [
    { id: 't1', image: 'images/ads/ad1.jpg', hidden: false },
    { id: 't2', image: 'images/ads/ad2.jpg', hidden: false },
    { id: 't3', image: 'images/ads/ad3.jpg', hidden: false },
    { id: 't4', image: 'images/ads/ad4.jpg', hidden: false },
    { id: 't5', image: 'images/ads/ad5.jpg', hidden: false },
    { id: 't6', image: 'images/ads/ad6.jpg', hidden: false },
    { id: 't7', image: 'images/ads/ad7.jpg', hidden: false },
    { id: 't8', image: 'images/ads/ad8.jpg', hidden: false },
    { id: 't9', image: 'images/ads/ad9.jpg', hidden: false },
    { id: 't10', image: 'images/ads/ad10.jpg', hidden: false },
    { id: 't11', image: 'images/ads/ad11.jpg', hidden: false },
    { id: 't12', image: 'images/ads/ad12.jpg', hidden: false },
    { id: 't13', image: 'images/ads/ad13.jpg', hidden: false },
    { id: 't14', image: 'images/ads/ad14.jpg', hidden: false },
    { id: 't15', image: 'images/ads/ad15.jpg', hidden: false }
];

document.addEventListener('DOMContentLoaded', () => {
    // Check if logged in (Session Storage)
    if (sessionStorage.getItem('isAdmin') === 'true') {
        showDashboard();
    }

    // Initialize Products Data
    const localData = localStorage.getItem('site_products');
    if (localData) {
        try {
            allProducts = JSON.parse(localData);
            console.log("Loaded products from localStorage");
        } catch (e) {
            console.error("Error parsing localStorage data:", e);
            allProducts = typeof productsData !== 'undefined' ? JSON.parse(JSON.stringify(productsData)) : [];
        }
    } else if (typeof productsData !== 'undefined') {
        allProducts = JSON.parse(JSON.stringify(productsData));
        console.log("Loaded data from products-data.js");
    } else {
        // console.warn("No products data found.");
    }
    filteredProducts = [...allProducts];

    // Initialize Ticker Data
    const localTicker = localStorage.getItem('site_ticker_images');
    if (localTicker) {
        try {
            allTickerImages = JSON.parse(localTicker);
            console.log("Loaded ticker data from localStorage");
        } catch (e) {
            allTickerImages = JSON.parse(JSON.stringify(defaultTickerImages));
        }
    } else if (typeof tickerData !== 'undefined') {
        allTickerImages = JSON.parse(JSON.stringify(tickerData));
    } else {
        allTickerImages = JSON.parse(JSON.stringify(defaultTickerImages));
    }
    filteredProducts = [...allProducts];

    // Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const password = document.getElementById('password-input').value;
            if (password === CREDENTIALS.password) {
                sessionStorage.setItem('isAdmin', 'true');
                showDashboard();
            } else {
                alert("كلمة المرور غير صحيحة");
            }
        });
    }

    // Product Form (Add/Edit)
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', handleFormSubmit);
    }

    // Ticker Form
    const tickerForm = document.getElementById('ticker-form');
    if (tickerForm) {
        tickerForm.addEventListener('submit', handleTickerFormSubmit);
    }
});
function handleTickerFormSubmit(e) {
    e.preventDefault();

    const newImage = {
        id: 't-' + Date.now(),
        image: document.getElementById('t-image').value,
        hidden: document.getElementById('t-hidden').checked
    };

    allTickerImages.push(newImage);
    closeTickerModal();
    renderTickerTable();
    alert("تمت إضافة الصورة بنجاح");
}

// --- View Logic ---

function showDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    renderTable();
    renderTickerTable();
    switchView('products'); // Default view
}

function switchView(viewName) {
    // 1. Update Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.color = '#aaa';
        btn.style.borderColor = 'transparent';
    });

    const activeBtn = document.getElementById(`tab-${viewName}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.style.color = 'white';
        // Check if we want a colored border or keep it simple
    }

    // 2. toggle Views
    document.querySelectorAll('.admin-view').forEach(view => {
        view.style.display = 'none';
    });

    const activeView = document.getElementById(`view-${viewName}`);
    if (activeView) {
        activeView.style.display = 'block';
    }
}

function logout() {
    sessionStorage.removeItem('isAdmin');
    window.location.reload();
}

// --- Render Table ---

function renderTable() {
    const tbody = document.getElementById('products-table-body');
    const countEl = document.getElementById('total-count');

    tbody.innerHTML = '';
    countEl.textContent = filteredProducts.length;

    filteredProducts.forEach(product => {
        const tr = document.createElement('tr');

        const statusBadge = product.hidden
            ? '<span class="status-badge status-hidden">مخفي</span>'
            : '<span class="status-badge status-active">نشط</span>';

        tr.innerHTML = `
            <td><img src="${product.image}" class="product-thumb" alt="img"></td>
            <td style="font-weight: bold;">${product.name}</td>
            <td>${product.meta || '-'}</td>
            <td>${getCategoryName(product.category)}</td>
            <td>${product.price}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn" style="padding: 5px 10px; background: #3498db; color: white;" onclick="editProduct('${product.id}')">
                    <i class="fa-solid fa-edit"></i>
                </button>
                <button class="btn" style="padding: 5px 10px; background: #e74c3c; color: white;" onclick="deleteProduct('${product.id}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}
function renderTickerTable() {
    const tbody = document.getElementById('ticker-table-body');
    const countEl = document.getElementById('ticker-count');

    if (!tbody) return;

    tbody.innerHTML = '';
    countEl.textContent = allTickerImages.length;

    allTickerImages.forEach(item => {
        const tr = document.createElement('tr');
        const statusBadge = item.hidden
            ? '<span class="status-badge status-hidden">مخفي</span>'
            : '<span class="status-badge status-active">نشط</span>';

        // Hide/Show Button Icon
        const toggleIcon = item.hidden ? 'fa-eye' : 'fa-eye-slash';
        const toggleColor = item.hidden ? '#2ecc71' : '#f1c40f';

        tr.innerHTML = `
            <td><img src="${item.image}" class="product-thumb" alt="img"></td>
            <td dir="ltr" style="text-align:right">${item.image}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn" style="padding: 5px 10px; background: ${toggleColor}; color: white;" onclick="toggleTickerStatus('${item.id}')">
                     <i class="fa-solid ${toggleIcon}"></i>
                </button>
                <button class="btn" style="padding: 5px 10px; background: #e74c3c; color: white;" onclick="deleteTickerImage('${item.id}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function getCategoryName(catKey) {
    const categories = {
        "meat": "اللحوم والدواجن",
        "dairy": "زيت وسمن وجبن",
        "honey": "عسل وطحينة",
        "produce": "خضار وفاكهة",
        "grains": "البقوليات والحبوب",
        "vegan_products": "منتجات صيامى",
        "pickles": "المخللات",
        "drinks": "مشروبات",
        "church": "مستلزمات كنائس",
        "pastries": "معجنات وحلويات",
        "breakfast": "مطبخ فطارى",
        "fasting": "مطبخ صيامى"
    };
    return categories[catKey] || catKey;
}

// --- CRUD Operations ---

function filterProducts() {
    const query = document.getElementById('search-input').value.trim().toLowerCase();

    filteredProducts = allProducts.filter(p => {
        const categoryName = getCategoryName(p.category).toLowerCase();
        const productName = p.name.toLowerCase();
        const meta = (p.meta || "").toLowerCase();
        const prodId = p.id.toLowerCase();

        return productName.includes(query) ||
            meta.includes(query) ||
            categoryName.includes(query) ||
            prodId.includes(query);
    });

    renderTable();
}

function deleteProduct(id) {
    if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
        allProducts = allProducts.filter(p => p.id !== id);
        filterProducts(); // Re-filter to update view
    }
}
function deleteTickerImage(id) {
    if (confirm("هل أنت متأكد من حذف هذه الصورة؟")) {
        allTickerImages = allTickerImages.filter(t => t.id !== id);
        renderTickerTable();
    }
}
function toggleTickerStatus(id) {
    const item = allTickerImages.find(t => t.id === id);
    if (item) {
        item.hidden = !item.hidden;
        renderTickerTable();
    }
}

// Modal Logic
function openModal(isEdit = false) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('product-form');

    if (!isEdit) {
        title.textContent = "إضافة منتج جديد";
        form.reset();
        document.getElementById('edit-id').value = "";
    } else {
        title.textContent = "تعديل المنتج";
    }

    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('product-modal').classList.remove('active');
}

// Ticker Modal Logic
function openTickerModal() {
    document.getElementById('ticker-form').reset();
    document.getElementById('ticker-modal').classList.add('active');
}

function closeTickerModal() {
    document.getElementById('ticker-modal').classList.remove('active');
}

function editProduct(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    document.getElementById('edit-id').value = product.id;
    document.getElementById('p-name').value = product.name;
    document.getElementById('p-price').value = product.price;
    document.getElementById('p-category').value = product.category;
    document.getElementById('p-image').value = product.image;
    document.getElementById('p-meta').value = product.meta || "";
    document.getElementById('p-tag').value = product.tag;
    document.getElementById('p-hidden').checked = !!product.hidden;

    openModal(true);
}

function handleFormSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('edit-id').value;
    const isEdit = !!id;

    const newProduct = {
        id: isEdit ? id : generateId(),
        name: document.getElementById('p-name').value,
        price: document.getElementById('p-price').value,
        category: document.getElementById('p-category').value,
        image: document.getElementById('p-image').value,
        meta: document.getElementById('p-meta').value,
        tag: document.getElementById('p-tag').value,
        hidden: document.getElementById('p-hidden').checked
    };

    if (isEdit) {
        const index = allProducts.findIndex(p => p.id === id);
        if (index !== -1) {
            allProducts[index] = newProduct;
        }
    } else {
        allProducts.push(newProduct);
    }

    closeModal();
    filterProducts();
    alert(isEdit ? "تم التعديل بنجاح" : "تمت الإضافة بنجاح");
}

function generateId() {
    return 'prod-' + Date.now();
}

// --- Data Export & Save Logic ---

// --- Data Export & Save Logic ---

function saveChanges() {
    // 1. Save Locally (Instant Update)
    try {
        localStorage.setItem('site_products', JSON.stringify(allProducts));
        localStorage.setItem('site_ticker_images', JSON.stringify(allTickerImages));
        alert("تم الحفظ في المتصفح بنجاح! \n\nستظهر التغييرات فوراً على هذا الجهاز عند زيارة الموقع.");
    } catch (e) {
        alert("خطأ في الحفظ المحلي: " + e.message);
    }

    // 2. Offer Download for Deployment (Optional)
    if (confirm("هل تريد أيضاً تحميل ملف البيانات (products-data.js) لرفعه على الموقع؟\n\n(يجب فعل ذلك عند نشر التغييرات للعملاء)")) {
        downloadFile();
    }
}

function downloadFile() {
    // Generate JS content
    const content = `/**
 * ملف بيانات الموقع - Site Data File
 * -----------------------------------------
 * هذا الملف يحتوي على المنتجات وصور الشريط.
 * تم تحديثه تلقائياً من لوحة التحكم.
 */

const productsData = ${JSON.stringify(allProducts, null, 4)};

const tickerData = ${JSON.stringify(allTickerImages, null, 4)};

// تصدير القائمة للاستخدام في الملفات الأخرى
if (typeof module !== "undefined") {
    module.exports = { productsData, tickerData };
}
`;

    // Create Blob
    const blob = new Blob([content], { type: "text/javascript;charset=utf-8" });

    // Trigger Download
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "products-data.js";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
