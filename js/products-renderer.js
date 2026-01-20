/**
 * Products Renderer Script
 * يقوم هذا السكربت بقراءة المنتجات من productsData وتوزيعها على الأقسام المناسبة في الصفحة HTML
 */

document.addEventListener('DOMContentLoaded', () => {
    renderAllProducts();
});

function renderAllProducts() {
    // 0. Check for Local Updates (Hybrid Mode)
    let displayData = productsData;
    const localUpdates = localStorage.getItem('site_products');
    if (localUpdates) {
        try {
            const parsed = JSON.parse(localUpdates);
            if (Array.isArray(parsed) && parsed.length > 0) {
                console.log("Rendering from LocalStorage updates...");
                displayData = parsed;
            }
        } catch (e) {
            console.error("Error parsing local updates:", e);
        }
    }

    if (typeof displayData === 'undefined') {
        console.error('Products Data not found! Make sure products-data.js is loaded.');
        return;
    }

    // 1. Group products by category
    const productsByCategory = {};

    displayData.forEach(product => {
        // Skip hidden products
        if (product.hidden) return;

        if (!productsByCategory[product.category]) {
            productsByCategory[product.category] = [];
        }
        productsByCategory[product.category].push(product);
    });

    // 2. Render each category
    for (const [category, products] of Object.entries(productsByCategory)) {
        // Find the target grid element
        // Convention: ID is "{category}-products-grid"
        // Note: Special handling for 'vegan_products' to match HTML ID if needed, easiest is to ensure HTML matches this ID.
        const gridId = `${category}-products-grid`;
        const gridElement = document.getElementById(gridId);

        if (gridElement) {
            // Clear existing content (loading placeholders etc)
            gridElement.innerHTML = '';

            products.forEach(product => {
                const productCard = createProductCard(product);
                gridElement.appendChild(productCard);
            });
        } else {
            console.warn(`Grid element not found for category: ${category} (ID: ${gridId})`);
        }
    }

    // 3. Re-initialize animations if needed
    // Assuming script.js handles intersection observers for .fade-in-on-scroll
    // We might need to manually trigger checking for new elements if the observer is already set up.
    // Ideally, we add the class and let the CSS/Observer handle it. 
    // If script.js runs AFTER this, it will find the elements.
}

function createProductCard(product) {
    // Structure:
    /*
    <div class="product-card fade-in-on-scroll" data-category="meat">
        <div class="product-img product-img-portrait">
            <img src="..." alt="...">
            <div class="product-actions">...</div>
        </div>
        <div class="product-info">
            <span class="category-tag">...</span>
            <h3>...</h3>
            <p class="product-meta">...</p>
            <p class="sub-text">...</p> <!-- Optional -->
            <div class="price">...</div>
        </div>
    </div>
    */

    const card = document.createElement('div');
    card.className = 'product-card fade-in-on-scroll';
    card.setAttribute('data-category', product.category);

    // Image Section
    const imgContainer = document.createElement('div');
    imgContainer.className = 'product-img product-img-portrait';

    const img = document.createElement('img');
    img.src = product.image;
    img.alt = product.name;
    img.loading = "lazy"; // Performance optimization

    const actions = document.createElement('div');
    actions.className = 'product-actions';

    // Add to Cart Button
    const addBtn = document.createElement('button');
    addBtn.className = 'action-btn';
    addBtn.title = 'أضف إلى السلة';
    addBtn.innerHTML = '<i class="fa-solid fa-plus"></i>';
    // Logic from script.js usually attaches global listeners to .action-btn
    // but just in case, we preserve the markup exactly.

    // View Details Button
    const viewBtn = document.createElement('button');
    viewBtn.className = 'action-btn';
    viewBtn.title = 'عرض التفاصيل';
    viewBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';

    actions.appendChild(addBtn);
    actions.appendChild(viewBtn);

    imgContainer.appendChild(img);
    imgContainer.appendChild(actions);

    // Info Section
    const info = document.createElement('div');
    info.className = 'product-info';

    const tag = document.createElement('span');
    tag.className = 'category-tag';
    tag.textContent = product.tag;

    const title = document.createElement('h3');
    title.textContent = product.name;

    const meta = document.createElement('p');
    meta.className = 'product-meta';
    meta.textContent = product.meta;

    info.appendChild(tag);
    info.appendChild(title);
    info.appendChild(meta);

    if (product.subText) {
        const sub = document.createElement('p');
        sub.style.cssText = "font-size: 0.8rem; margin: 0; color: #aaa;";
        sub.textContent = product.subText;
        info.appendChild(sub);
    }

    const price = document.createElement('div');
    price.className = 'price';
    price.textContent = product.price;

    info.appendChild(price);

    // Assemble
    card.appendChild(imgContainer);
    card.appendChild(info);

    return card;
}
