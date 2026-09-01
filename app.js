// =========================================================
// NIKIARA.STUDIO - SCRAPBOOK STORE
// Modular Architecture - Clean, Fast, Maintainable
// =========================================================

const CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycby72Zqja-7P7H1QcYfW9W_LxxtHF0KKy3p71bI4TrvB62CmkN_P9bVx0rEcki1juB2q/exec",
  PRODUCTS_PER_PAGE: 12,
  CACHE_DURATION: 5 * 60 * 1000,
};

const Utils = {
  formatRupiah(num) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num || 0);
  },
  escapeHtml(text) {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return String(text || "").replace(/[&<>"']/g, (c) => map[c]);
  },
  // API Call dengan cache & support POST untuk checkout
  async apiCall(params) {
    // Jika action adalah createOrder, gunakan method POST
    if (params.action === "createOrder") {
      const response = await fetch(CONFIG.API_URL, {
        method: "POST",
        body: JSON.stringify(params),
      });
      if (!response.ok) throw new Error("API POST failed");
      return await response.json();
    }

    // Untuk metode GET (Products & References), gunakan cache
    const cacheKey = `cache_${JSON.stringify(params)}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { data, time } = JSON.parse(cached);
      if (Date.now() - time < CONFIG.CACHE_DURATION) return data;
    }
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${CONFIG.API_URL}?${query}&t=${Date.now()}`);
    if (!response.ok) throw new Error("API GET failed");
    const data = await response.json();
    sessionStorage.setItem(cacheKey, JSON.stringify({ data, time: Date.now() }));
    return data;
  },
  debounce(func, delay) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  },
  showNotification(message, type = "success") {
    const toast = document.getElementById("notificationToast");
    toast.textContent = message;
    toast.className = `notification-toast show ${type}`;
    setTimeout(() => toast.classList.remove("show"), 3000);
  },
};

const ProductsModule = {
  products: [],
  filteredProducts: [],
  currentPage: 1,
  selectedCategory: "all",

  async load() {
    try {
      const data = await Utils.apiCall({ action: "products" });
      if (!data.success) throw new Error(data.message || "Failed to load products");
      
      // FIX: Menyelaraskan nama properti dengan kolom Google Sheets (product_id, product_name, image_url)
      this.products = (data.products || []).map((p) => ({
        id: p.product_id || p.id,
        name: p.product_name || p.name,
        price: Number(p.price) || 0,
        stock: Number(p.stock) || 0,
        category: p.category,
        image: p.image_url || p.image,
        description: p.description,
        active: ["TRUE", "true", 1, "1", true].includes(p.active),
      }));

      this.renderCategories();
      // FIX: Jalankan filter di awal agar produk langsung muncul tanpa harus klik "Semua"
      this.filter(); 
    } catch (error) {
      document.getElementById("productGrid").innerHTML = `<div class="loading-message">⚠️ Produk belum dapat dimuat. Coba refresh halaman.</div>`;
    }
  },
  
  getActiveProducts() { return this.products.filter((p) => p.active); },
  
  filter(searchTerm = "") {
    const active = this.getActiveProducts();
    this.filteredProducts = active.filter((p) => {
      const matchCategory = this.selectedCategory === "all" || p.category === this.selectedCategory;
      const searchLower = searchTerm.toLowerCase();
      const matchSearch = !searchTerm || p.name?.toLowerCase().includes(searchLower) || p.description?.toLowerCase().includes(searchLower);
      return matchCategory && matchSearch;
    });
    this.currentPage = 1;
    this.render();
  },
  
  getPaginatedProducts() {
    const start = (this.currentPage - 1) * CONFIG.PRODUCTS_PER_PAGE;
    return this.filteredProducts.slice(start, start + CONFIG.PRODUCTS_PER_PAGE);
  },
  
  getTotalPages() { return Math.ceil(this.filteredProducts.length / CONFIG.PRODUCTS_PER_PAGE); },
  
  render() {
    const grid = document.getElementById("productGrid");
    const count = document.getElementById("productCount");
    const paginatedProducts = this.getPaginatedProducts();
    
    count.textContent = `${this.filteredProducts.length} produk ditemukan`;
    if (paginatedProducts.length === 0) {
      grid.innerHTML = `<div class="loading-message">Tidak ada produk ditemukan</div>`;
      this.updatePaginationControls();
      return;
    }

    grid.innerHTML = paginatedProducts.map(p => `
      <div class="product-card">
        ${p.image ? `<img src="${Utils.escapeHtml(p.image)}" alt="${Utils.escapeHtml(p.name)}" class="product-image">` : `<div class="product-image-placeholder">✨</div>`}
        <div class="product-info">
          <div class="product-category">${Utils.escapeHtml(p.category || "")}</div>
          <h3 class="product-name">${Utils.escapeHtml(p.name || "")}</h3>
          <p class="product-description">${Utils.escapeHtml(p.description || "")}</p>
          <div class="product-footer">
            <div>
              <div class="product-price">${Utils.formatRupiah(p.price)}</div>
              <div class="product-stock">${p.stock > 0 ? `${p.stock} tersedia` : "Habis"}</div>
            </div>
            <button type="button" class="add-cart-button" onclick="CartModule.add('${Utils.escapeHtml(p.id)}')" ${p.stock <= 0 ? "disabled" : ""}>🛒</button>
          </div>
        </div>
      </div>
    `).join("");
    this.updatePaginationControls();
  },
  
  updatePaginationControls() {
    const totalPages = this.getTotalPages();
    const controls = document.getElementById("paginationControls");
    if (totalPages <= 1) { controls.style.display = "none"; return; }
    controls.style.display = "flex";
    document.getElementById("paginationInfo").textContent = `Halaman ${this.currentPage} dari ${totalPages}`;
    document.getElementById("prevPageBtn").disabled = this.currentPage === 1;
    document.getElementById("nextPageBtn").disabled = this.currentPage === totalPages;
  },
  
  renderCategories() {
    const active = this.getActiveProducts();
    const categories = [...new Set(active.map((p) => p.category).filter(Boolean))];
    const list = document.getElementById("categoryList");
    list.innerHTML = `<button type="button" class="category-button active" data-category="all">Semua</button>` + 
      categories.map(cat => `<button type="button" class="category-button" data-category="${Utils.escapeHtml(cat)}">${Utils.escapeHtml(cat)}</button>`).join("");
    
    list.addEventListener("click", (e) => {
      if (e.target.classList.contains("category-button")) {
        list.querySelectorAll(".category-button").forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");
        this.selectedCategory = e.target.dataset.category;
        this.filter(document.getElementById("searchInput").value);
      }
    });
  },
  
  nextPage() {
    if (this.currentPage < this.getTotalPages()) { this.currentPage++; this.render(); document.getElementById("productGrid").scrollIntoView({ behavior: "smooth" }); }
  },
  
  prevPage() {
    if (this.currentPage > 1) { this.currentPage--; this.render(); document.getElementById("productGrid").scrollIntoView({ behavior: "smooth" }); }
  },
};
const CartModule = {
  items: [],
  STORAGE_KEY: "nikiara_cart",

  init() { this.items = this.loadFromStorage(); this.render(); },
  loadFromStorage() { try { return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || []; } catch { return []; } },
  saveToStorage() { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items)); },
  add(productId) {
    const product = ProductsModule.products.find((p) => p.id === productId);
    if (!product) return;
    const existing = this.items.find((item) => item.id === productId);
    if (existing) existing.qty++;
    else this.items.push({ id: product.id, name: product.name, price: product.price, image: product.image, qty: 1 });
    this.saveToStorage();
    this.render();
    Utils.showNotification(`${product.name} ditambahkan ke keranjang`);
  },
  remove(productId) { this.items = this.items.filter((item) => item.id !== productId); this.saveToStorage(); this.render(); },
  updateQty(productId, qty) {
    const item = this.items.find((i) => i.id === productId);
    if (item) { item.qty = Math.max(1, qty); this.saveToStorage(); this.render(); }
  },
  getTotal() { return this.items.reduce((sum, item) => sum + item.price * item.qty, 0); },
  isEmpty() { return this.items.length === 0; },
  render() {
    const totalQty = this.items.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById("cartCount").textContent = totalQty;
    document.getElementById("cartTotal").textContent = Utils.formatRupiah(this.getTotal());
    const cartItems = document.getElementById("cartItems");
    const checkoutBtn = document.getElementById("checkoutButton");

    if (this.isEmpty()) {
      cartItems.innerHTML = `<div class="empty-cart"><span>🛒</span><p>Keranjangmu masih kosong.</p></div>`;
      checkoutBtn.disabled = true;
      return;
    }

    checkoutBtn.disabled = false;
    cartItems.innerHTML = this.items.map(item => `
      <div class="cart-item">
        ${item.image ? `<img src="${Utils.escapeHtml(item.image)}" class="cart-item-image">` : `<div class="cart-item-image" style="background: #f1e8e4; display: grid; place-items: center;">📦</div>`}
        <div>
          <div class="cart-item-name">${Utils.escapeHtml(item.name)}</div>
          <div class="cart-item-price">${Utils.formatRupiah(item.price)}</div>
          <div class="cart-item-controls">
            <button type="button" class="qty-button" onclick="CartModule.updateQty('${Utils.escapeHtml(item.id)}', ${item.qty - 1})">−</button>
            <span style="width: 20px; text-align: center; font-size: 13px;">${item.qty}</span>
            <button type="button" class="qty-button" onclick="CartModule.updateQty('${Utils.escapeHtml(item.id)}', ${item.qty + 1})">+</button>
            <button type="button" class="remove-item-button" onclick="CartModule.remove('${Utils.escapeHtml(item.id)}')">Hapus</button>
          </div>
        </div>
      </div>
    `).join("");
  },
};

const ReferencesModule = {
  references: [],
  currentViewId: null,
  currentImageIndex: 0,

  async load() {
    const refSection = document.getElementById("references-section");
    try {
      const data = await Utils.apiCall({ action: "references" });
      if (!data.success) throw new Error(data.message || "Failed to load references");
      
      // FIX: Konversi otomatis link Google Drive menjadi direct image link
      this.references = (data.references || []).map(ref => {
        const urls = (ref.image_urls || ref.image_url || "").split(",").map(url => {
          const u = url.trim();
          const m1 = u.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
          if (m1) return `https://drive.google.com/thumbnail?id=${m1[1]}&sz=w1000`;
          const m2 = u.match(/[?&]id=([a-zA-Z0-9_-]+)/);
          if (m2) return `https://drive.google.com/thumbnail?id=${m2[1]}&sz=w1000`;
          return u; // Return Cloudinary URL apa adanya
        }).filter(Boolean);
        
        return { ...ref, image_urls: urls.join(",") };
      });
      
      refSection.style.display = "block";
      this.renderGrid();
    } catch (error) {
      refSection.style.display = "block";
      document.getElementById("references-empty").style.display = "block";
    }
  },
  
  renderGrid() {
    const grid = document.getElementById("references-grid");
    const empty = document.getElementById("references-empty");
    if (this.references.length === 0) { empty.style.display = "block"; grid.style.display = "none"; return; }
    empty.style.display = "none";
    grid.style.display = "grid";

    grid.innerHTML = this.references.map(ref => {
      const images = (ref.image_urls || "").split(",");
      // Tampilkan placeholder jika gambar benar-benar kosong (seperti pada data "testing")
      const imgHtml = images[0] ? `<img src="${Utils.escapeHtml(images[0])}" class="reference-card-image" alt="${Utils.escapeHtml(ref.title || "")}">` : `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#eee; font-size:50px;">🖼️</div>`;
      
      return `
      <div class="reference-card" onclick="ReferencesModule.openModal('${Utils.escapeHtml(ref.reference_id)}')">
        <div class="reference-card-image-container">
          ${imgHtml}
        </div>
        <div class="reference-card-overlay">
          <h3 class="reference-card-title">${Utils.escapeHtml(ref.title || "")}</h3>
          <p class="reference-card-description">${Utils.escapeHtml(ref.description || "")}</p>
        </div>
      </div>
    `}).join("");
  },
  
  openModal(refId) {
    const ref = this.references.find((r) => String(r.reference_id) === String(refId));
    if (!ref) return;
    this.currentViewId = refId;
    this.currentImageIndex = 0;
    const images = (ref.image_urls || "").split(",").filter(Boolean);
    
    document.getElementById("references-modal-title").textContent = Utils.escapeHtml(ref.title || "");
    document.getElementById("references-modal-description").textContent = Utils.escapeHtml(ref.description || "");
    
    // Sembunyikan foto di popup modal jika datanya memang kosong
    const imgElement = document.getElementById("references-modal-image");
    if (images.length > 0) {
      imgElement.style.display = "block";
      this.updateModalImage(images);
    } else {
      imgElement.style.display = "none";
    }
    
    document.getElementById("references-modal").style.display = "flex";
    
    const controls = document.getElementById("references-carousel-controls");
    if (images.length > 1) { controls.style.display = "flex"; this.renderCarouselDots(images.length); } 
    else { controls.style.display = "none"; }
  },
  
  updateModalImage(images) {
    document.getElementById("references-modal-image").src = Utils.escapeHtml(images[this.currentImageIndex] || "");
    document.getElementById("references-image-counter").textContent = `${this.currentImageIndex + 1}/${images.length}`;
  },
  
  renderCarouselDots(count) {
    document.getElementById("references-carousel-dots").innerHTML = [...Array(count)].map((_, i) => `
      <div class="carousel-dot ${i === this.currentImageIndex ? "active" : ""}" onclick="ReferencesModule.goToImage(${i})"></div>
    `).join("");
  },
  
  nextImage() {
    const ref = this.references.find((r) => String(r.reference_id) === String(this.currentViewId));
    if (ref) {
      const images = ref.image_urls.split(",").filter(Boolean);
      if (images.length === 0) return;
      this.currentImageIndex = (this.currentImageIndex + 1) % images.length;
      this.updateModalImage(images); this.renderCarouselDots(images.length);
    }
  },
  
  prevImage() {
    const ref = this.references.find((r) => String(r.reference_id) === String(this.currentViewId));
    if (ref) {
      const images = ref.image_urls.split(",").filter(Boolean);
      if (images.length === 0) return;
      this.currentImageIndex = (this.currentImageIndex - 1 + images.length) % images.length;
      this.updateModalImage(images); this.renderCarouselDots(images.length);
    }
  },
  
  goToImage(index) {
    this.currentImageIndex = index;
    const ref = this.references.find((r) => String(r.reference_id) === String(this.currentViewId));
    if (ref) {
      const images = ref.image_urls.split(",").filter(Boolean);
      this.updateModalImage(images); this.renderCarouselDots(images.length);
    }
  },
  
  closeModal() { document.getElementById("references-modal").style.display = "none"; },
};
// =========================================================
// CHECKOUT MODULE
// =========================================================

const CheckoutModule = {
  async submitOrder(event) {
    event.preventDefault();
    if (CartModule.isEmpty()) return Utils.showNotification("Keranjang masih kosong", "error");
    const form = event.target;
    
    // FIX: Sesuaikan nama field dengan yang diminta Code.gs
    const formData = {
      action: "createOrder",
      customer_name: form.customerName.value.trim(), 
      whatsapp: form.customerWhatsapp.value.trim(),
      address: form.customerAddress.value.trim(),
      payment_method: form.paymentMethod.value,
      notes: form.customerNotes.value.trim(),
      total: CartModule.getTotal(),
      // FIX: Mapping ulang isi keranjang agar cocok dengan Code.gs
      items: CartModule.items.map(item => ({
        product_id: item.id, // Diubah dari id menjadi product_id
        quantity: item.qty   // Diubah dari qty menjadi quantity
      }))
    };

    if (!/^(\+62|62|0)[0-9]{9,12}$/.test(formData.whatsapp.replace(/[^0-9+]/g, ""))) return Utils.showNotification("Nomor WhatsApp tidak valid", "error");

    // UX: Tampilkan pesan loading
    const submitBtn = form.querySelector('.submit-order-button');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Memproses...";
    submitBtn.disabled = true;

    try {
      const response = await Utils.apiCall(formData); // API Call sekarang mengirim payload POST
      
      if (response.success) {
        Utils.showNotification("Pesanan berhasil dibuat! Hubungi kami via WhatsApp");
        CartModule.items = []; CartModule.saveToStorage(); CartModule.render();
        UIModule.closeCheckout(); UIModule.closeCart(); form.reset();
      } else { 
        Utils.showNotification(response.message || "Gagal membuat pesanan", "error"); 
      }
    } catch (error) { 
      Utils.showNotification("Terjadi kesalahan. Coba lagi nanti", "error"); 
    } finally {
      // Kembalikan tombol ke kondisi semula
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  },
};

const UIModule = {
  openCart() { document.getElementById("cartOverlay").classList.add("active"); document.getElementById("cartDrawer").classList.add("active"); },
  closeCart() { document.getElementById("cartOverlay").classList.remove("active"); document.getElementById("cartDrawer").classList.remove("active"); },
  openCheckout() {
    if (CartModule.isEmpty()) return Utils.showNotification("Keranjang masih kosong", "error");
    document.getElementById("checkoutModal").style.display = "flex";
    document.getElementById("checkoutTotal").textContent = Utils.formatRupiah(CartModule.getTotal());
    this.closeCart();
  },
  closeCheckout() { document.getElementById("checkoutModal").style.display = "none"; },
};

function setupEventListeners() {
  document.getElementById("openCartButton").addEventListener("click", () => UIModule.openCart());
  document.getElementById("closeCartButton").addEventListener("click", () => UIModule.closeCart());
  document.getElementById("cartOverlay").addEventListener("click", () => UIModule.closeCart());

  document.getElementById("checkoutButton").addEventListener("click", () => UIModule.openCheckout());
  document.getElementById("closeCheckoutButton").addEventListener("click", () => UIModule.closeCheckout());
  document.getElementById("checkoutForm").addEventListener("submit", (e) => CheckoutModule.submitOrder(e));

  // FIXED: Button now smoothly scrolls to the references gallery instead of opening a broken modal
  document.getElementById("openReferenceButton").addEventListener("click", () => {
    const refSection = document.getElementById("references-section");
    if (refSection) {
      refSection.style.display = "block";
      refSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  document.getElementById("modalCloseBtn").addEventListener("click", () => ReferencesModule.closeModal());
  document.getElementById("referencePrevBtn").addEventListener("click", () => ReferencesModule.prevImage());
  document.getElementById("referenceNextBtn").addEventListener("click", () => ReferencesModule.nextImage());
  document.getElementById("references-modal-overlay").addEventListener("click", () => ReferencesModule.closeModal());

  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", Utils.debounce((e) => ProductsModule.filter(e.target.value), 300));
  document.getElementById("prevPageBtn").addEventListener("click", () => ProductsModule.prevPage());
  document.getElementById("nextPageBtn").addEventListener("click", () => ProductsModule.nextPage());

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { UIModule.closeCart(); UIModule.closeCheckout(); ReferencesModule.closeModal(); }
  });
}

async function initialize() {
  CartModule.init();
  await ProductsModule.load();
  await ReferencesModule.load();
  setupEventListeners();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize);
else initialize();
