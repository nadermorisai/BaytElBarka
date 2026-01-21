document.addEventListener('DOMContentLoaded', () => {

    // --- Helper Functions ---
    const select = (selector) => document.querySelector(selector);
    const selectAll = (selector) => document.querySelectorAll(selector);

    // --- 0. Product Manager (Client-Side CMS) ---
    // Removed: Reverted to static HTML structure per user request.


    // --- 0. Dynamic Ticker Logic (Admin Connected) ---
    loadTickerImages();

    function loadTickerImages() {
        const tickerTrack = select('.ticker-track');
        if (!tickerTrack) return;

        // Try to get data from LocalStorage
        const localTicker = localStorage.getItem('site_ticker_images');
        let images = [];

        if (localTicker) {
            try {
                images = JSON.parse(localTicker);
            } catch (e) {
                console.error("Error parsing ticker data", e);
                return; // Fallback to hardcoded HTML
            }
        } else if (typeof tickerData !== 'undefined') {
            images = tickerData;
        } else {
            return; // No dynamic data, stick to HTML
        }

        // Filter valid & visible images
        const validImages = images.filter(img => !img.hidden);

        if (validImages.length === 0) return; // Don't break layout if empty

        // Build HTML
        // Note: The CSS ticker usually requires a duplicated set for seamless scrolling
        const imagesHTML = validImages.map(img =>
            `<div class="ticker-item"><img src="${img.image}" alt="عرض"></div>`
        ).join('');

        // Inject twice for the loop
        tickerTrack.innerHTML = imagesHTML + imagesHTML;
    }


    // --- 1. UI Enhancements (Parallax, Scroll) ---
    // Parallax Effect
    const heroBg = select('.hero-bg');
    if (heroBg) {
        window.addEventListener('scroll', () => {
            const scrollPosition = window.scrollY;
            if (scrollPosition < window.innerHeight) {
                heroBg.style.transform = `translateY(${scrollPosition * 0.5}px)`;
            }
        });
    }

    // Scroll Animations (Intersection Observer)
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    const fadeElements = selectAll('.fade-in-on-scroll');
    if (fadeElements.length > 0) {
        fadeElements.forEach(el => observer.observe(el));
    }

    // --- 2. Navigation & Mobile Menu ---
    const mobileBtn = select('.mobile-menu-btn');
    const navLinks = select('.nav-links');

    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Smooth Scroll for Anchor Links
    selectAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId === '') return;

            const target = select(targetId);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });

                // Close mobile menu if open
                if (navLinks && navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    navLinks.style.display = '';
                }
            }
        });
    });

    // --- 3. Product Filtering ---
    const filterBtns = selectAll('.filter-btn');

    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                filterBtns.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');

                const filterValue = btn.getAttribute('data-filter');
                const productCards = document.querySelectorAll('.product-card');

                // 1. Filter Cards
                productCards.forEach(card => {
                    const category = card.getAttribute('data-category');
                    if (filterValue === 'all' || category === filterValue) {
                        card.style.display = 'block';
                        setTimeout(() => card.style.opacity = '1', 50);
                    } else {
                        card.style.opacity = '0';
                        setTimeout(() => card.style.display = 'none', 300);
                    }
                });

                // 2. Hide Empty Sections (Clean UI)
                const sections = document.querySelectorAll('.category-section');
                sections.forEach(section => {
                    // Check if this section contains any visible cards
                    // Note: We check data-category match because display:none has a delay
                    const hasVisibleCards = Array.from(section.querySelectorAll('.product-card')).some(card => {
                        const cat = card.getAttribute('data-category');
                        return filterValue === 'all' || cat === filterValue;
                    });

                    if (hasVisibleCards) {
                        section.style.display = 'block';
                    } else {
                        section.style.display = 'none';
                    }
                });
            });
        });
    }

    // --- 4. Shopping Cart Logic ---
    let cart = [];
    try {
        const storedCart = localStorage.getItem('cart');
        cart = storedCart ? JSON.parse(storedCart) : [];
        if (!Array.isArray(cart)) cart = [];
    } catch (error) {
        console.error("Error loading cart:", error);
        cart = [];
        localStorage.removeItem('cart'); // Clear corrupted data
    }

    // Initialize UI
    updateCartUI();
    renderCartPage();

    // Event Delegation (Handles clicks globally)
    document.addEventListener('click', (e) => {

        const target = e.target;

        // 1. Add to Cart Button Logic
        const btn = target.closest('.action-btn');
        if (btn && (btn.getAttribute('title') === "أضف إلى السلة" || btn.querySelector('.fa-plus'))) {
            const card = btn.closest('.product-card');
            if (card) {
                try {
                    const priceEl = card.querySelector('.price');
                    const nameEl = card.querySelector('h3');
                    const imgEl = card.querySelector('img');

                    if (priceEl && nameEl) {
                        const priceText = priceEl.innerText;
                        // Extract the first number found (handles ranges like "60 - 75")
                        const priceMatch = priceText.match(/(\d+(\.\d+)?)/);
                        const price = priceMatch ? parseFloat(priceMatch[0]) : 0;

                        // Use name as ID for simplicity
                        const id = nameEl.innerText.trim();
                        const name = nameEl.innerText.trim();
                        const image = imgEl ? imgEl.src : '';

                        const product = {
                            id: id,
                            name: name,
                            price: price,
                            image: image,
                            quantity: 1
                        };
                        addToCart(product);
                    }
                } catch (err) {
                    console.error("Error extracting product details:", err);
                }
            }
        }

        // 2. Open Cart Page (Redirect)
        if (target.closest('.cart-btn')) {
            // Redirect to cart.html
            window.location.href = 'cart.html';
        }
    });

    // Add Item Function
    function addToCart(product) {
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push(product);
        }
        saveCart();
        updateCartUI();
        showToast(`تم إضافة ${product.name} إلى السلة`);
    }

    // Save Cart Function
    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCartPage(); // Refresh table if we are on cart page
    }

    // Update UI (Badge + Cart Page)
    function updateCartUI() {
        // Update Badge everywhere
        const badges = selectAll('.cart-badge');
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        badges.forEach(b => b.innerText = count);
    }

    // Render Cart Page (Only runs if elements exist)
    function renderCartPage() {
        const tableBody = document.getElementById('cart-table-body');
        const emptyMsg = document.getElementById('cart-empty-message');
        const contentArea = document.getElementById('cart-content-area');

        if (!tableBody) return; // NOT on cart page

        if (cart.length === 0) {
            if (contentArea) contentArea.style.display = 'none';
            if (emptyMsg) emptyMsg.style.display = 'block';
        } else {
            if (contentArea) contentArea.style.display = 'block';
            if (emptyMsg) emptyMsg.style.display = 'none';

            tableBody.innerHTML = cart.map(item => `
                <tr>
                    <td>
                        <div class="cart-product-info">
                            <img src="${item.image}" alt="${item.name}" class="cart-product-img">
                            <span>${item.name}</span>
                        </div>
                    </td>
                    <td>${item.price} ج.م</td>
                    <td>
                        <div class="cart-qty-controls" style="justify-content: flex-start;">
                            <button class="qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
                            <span>${item.quantity}</span>
                            <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
                        </div>
                    </td>
                    <td>${item.price * item.quantity} ج.م</td>
                    <td>
                        <button class="remove-btn" onclick="removeItem('${item.id}')"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');

            calculateCartTotals();
        }
    }

    // Calculate Totals Helper
    function calculateCartTotals() {
        const subtotalEl = document.getElementById('cart-subtotal');
        const deliveryFeeDisplayEl = document.getElementById('delivery-fee-display');
        const grandTotalEl = document.getElementById('grand-total');
        const regionSelect = document.getElementById('delivery-region');

        // Check order type
        const orderType = document.querySelector('input[name="order-type"]:checked')?.value || 'delivery';

        if (!subtotalEl || !grandTotalEl) return;

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        let deliveryFee = 0;

        if (orderType === 'delivery' && regionSelect && regionSelect.value) {
            deliveryFee = parseFloat(regionSelect.value);
        }

        const grandTotal = subtotal + deliveryFee;

        subtotalEl.innerText = subtotal;
        if (deliveryFeeDisplayEl) deliveryFeeDisplayEl.innerText = deliveryFee;
        grandTotalEl.innerText = grandTotal;
    }

    // Region Select Listener
    const regionSelect = document.getElementById('delivery-region');
    if (regionSelect) {
        regionSelect.addEventListener('change', calculateCartTotals);
    }

    // Toggle Order Type Logic (Global for inline calls)
    window.toggleOrderType = () => {
        const orderType = document.querySelector('input[name="order-type"]:checked').value;
        const deliveryOptions = document.getElementById('delivery-options');
        const pickupOptions = document.getElementById('pickup-options');
        const pageUserAddress = document.getElementById('page-user-address');
        const deliveryRegion = document.getElementById('delivery-region');
        const pickupTime = document.getElementById('pickup-time');

        if (orderType === 'delivery') {
            if (deliveryOptions) deliveryOptions.style.display = 'block';
            if (pickupOptions) pickupOptions.style.display = 'none';

            // Set required attributes
            if (pageUserAddress) pageUserAddress.setAttribute('required', 'true');
            if (deliveryRegion) deliveryRegion.setAttribute('required', 'true');
            if (pickupTime) pickupTime.removeAttribute('required');
        } else {
            if (deliveryOptions) deliveryOptions.style.display = 'none';
            if (pickupOptions) pickupOptions.style.display = 'block';

            // Set required attributes
            if (pageUserAddress) pageUserAddress.removeAttribute('required');
            if (deliveryRegion) deliveryRegion.removeAttribute('required');
            if (pickupTime) pickupTime.setAttribute('required', 'true');
        }
        calculateCartTotals();
    };

    // --- Global Helpers (Exposed to Window) ---
    window.updateQty = (id, change) => {
        const item = cart.find(i => i.id === id);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                cart = cart.filter(i => i.id !== id);
            }
            saveCart();
            updateCartUI();
        }
    };

    window.removeItem = (id) => {
        cart = cart.filter(i => i.id !== id);
        saveCart();
        updateCartUI();
    };


    // --- Checkout Form Logic (Cart Page) ---
    const checkoutFormPage = document.getElementById('checkout-form-page');
    if (checkoutFormPage) {
        checkoutFormPage.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('page-user-name').value;
            const phone = document.getElementById('page-user-phone').value;
            const orderType = document.querySelector('input[name="order-type"]:checked').value;
            const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value || 'cash';

            let message = `*طلب جديد من بيت البركة*\n\n`;
            message += `*الاسم:* ${name}\n`;
            message += `*الهاتف:* ${phone}\n`;

            const paymentText = paymentMethod === 'cash' ? 'نقدي (عند الاستلام) 💵' : 'انستا باي (InstaPay) 📱';
            message += `*طريقة الدفع:* ${paymentText}\n`;

            let deliveryFee = 0;

            if (orderType === 'delivery') {
                const address = document.getElementById('page-user-address').value;
                const regionSelect = document.getElementById('delivery-region');
                const regionName = regionSelect.options[regionSelect.selectedIndex].text;
                deliveryFee = regionSelect.value ? parseFloat(regionSelect.value) : 0;

                message += `*نوع الطلب:* توصيل للمنزل 🚚\n`;
                message += `*العنوان:* ${address}\n`;
                message += `*المنطقة:* ${regionName}\n\n`;
            } else {
                const pickupTime = document.getElementById('pickup-time').value;
                // Format date nicely if possible
                const dateObj = new Date(pickupTime);
                const dateString = dateObj.toLocaleString('ar-EG');

                message += `*نوع الطلب:* استلام من الفرع 🏪\n`;
                message += `*ميعاد الاستلام:* ${dateString}\n\n`;
            }

            message += `*المنتجات:*\n`;

            cart.forEach(item => {
                message += `- ${item.name} (${item.quantity} قطعة) = ${item.price * item.quantity} ج.م\n`;
            });

            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const total = subtotal + deliveryFee;

            message += `\n*الإجمالى الفرعي:* ${subtotal} ج.م\n`;
            if (orderType === 'delivery') {
                message += `*مصاريف التوصيل:* ${deliveryFee} ج.م\n`;
            }
            message += `*الإجمالى الكلي:* ${total} ج.م`;

            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/201229649045?text=${encodedMessage}`;

            window.open(whatsappUrl, '_blank');
        });
    }

    // --- Contact Form Submission (WhatsApp) ---
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('contact-name').value;
            const phone = document.getElementById('contact-phone').value;
            const subjectSelect = document.getElementById('contact-subject');
            const subject = subjectSelect ? subjectSelect.value : 'استفسار عام';
            const messageText = document.getElementById('contact-message').value;

            let message = `*رسالة تواصل جديدة من بيت البركة*\n\n`;
            message += `*الاسم:* ${name}\n`;
            message += `*رقم الواتساب:* ${phone}\n`;
            message += `*الموضوع:* ${subject}\n`;
            message += `*الرسالة:*\n${messageText}`;

            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/201229649045?text=${encodedMessage}`;

            window.open(whatsappUrl, '_blank');
        });
    }

    // --- Toast Notification ---
    function showToast(msg) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerText = msg;
        document.body.appendChild(toast);

        // Ensure styles
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            background: 'var(--primary-color)',
            color: 'white',
            padding: '12px 25px',
            borderRadius: '50px',
            boxShadow: 'var(--shadow-main)',
            zIndex: '3000',
            animation: 'modal-slide-in 0.3s ease',
            opacity: '1',
            transform: 'translateY(0)',
            transition: 'all 0.3s ease'
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
});

