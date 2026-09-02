// =========================================================
// NIKIARA ADMIN PANEL - COMPLETE LOGIC
// Version 2.1 - Full Categories Management + All Features
// =========================================================

const CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycby72Zqja-7P7H1QcYfW9W_LxxtHF0KKy3p71bI4TrvB62CmkN_P9bVx0rEcki1juB2q/exec",
  DUMMY_PASSWORD: "admin",
  CLOUDINARY_URL: "https://api.cloudinary.com/v1_1/vtd7inkb/image/upload",
  CLOUDINARY_PRESET: "odbmmzkd"
};

const AdminApp = {
  products: [],
  categories: [],
  orders: [],
  references: [],
  settings: {},
  editingProductId: null,
  editingCategoryId: null,
  editingRefId: null,

  // =========================================================
  // INITIALIZATION
  // =========================================================

  init() {
    this.checkAuth();
    this.setupEventListeners();
  },

  checkAuth() {
    if (sessionStorage.getItem("nikiara_admin_logged") === "true") {
      this.showDashboard();
      this.loadData();
    } else {
      document.getElementById("loginScreen").style.display = "flex";
      document.getElementById("adminDashboard").style.display = "none";
    }
  },

  handleLogin(e) {
    e.preventDefault();
    const pwd = document.getElementById("adminPassword").value;
    if (pwd === CONFIG.DUMMY_PASSWORD) {
      sessionStorage.setItem("nikiara_admin_logged", "true");
      document.getElementById("loginError").style.display = "none";
      this.checkAuth();
    } else {
      document.getElementById("loginError").style.display = "block";
      document.getElementById("adminPassword").value = "";
    }
  },

  logout() {
    sessionStorage.removeItem("nikiara_admin_logged");
    location.reload();
  },

  showDashboard() {
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("adminDashboard").style.display = "flex";
  },

  switchPanel(targetId, title) {
    document.querySelectorAll('.panel').forEach(p => p.style.display = 'none');
    document.getElementById(targetId).style.display = 'block';
    document.getElementById("currentPanelTitle").textContent = title;
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`[data-target="${targetId}"]`).classList.add('active');
  },

  setupEventListeners() {
    // Auth
    document.getElementById("loginForm").addEventListener("submit", e => this.handleLogin(e));
    document.getElementById("logoutBtn").addEventListener("click", () => this.logout());

    // Forms
    document.getElementById("productForm").addEventListener("submit", e => this.handleProductSubmit(e));
    document.getElementById("categoryForm").addEventListener("submit", e => this.handleCategorySubmit(e));
    document.getElementById("referenceForm").addEventListener("submit", e => this.handleReferenceSubmit(e));

    // File uploads
    document.getElementById("formImageFile").addEventListener("change", e => 
      this.uploadImage(e, "uploadStatus", "imagePreview", "formImageUrl", "saveProductBtn")
    );
    document.getElementById("formRefImageFile").addEventListener("change", e => 
      this.uploadImage(e, "refUploadStatus", "refImagePreview", "formRefImageUrl", "saveRefBtn")
    );

    // Sidebar navigation
    const navItems = document.querySelectorAll('#sidebarNav .nav-item:not(#logoutBtn)');
    navItems.forEach(item => {
      item.addEventListener('click', e => {
        const targetId = e.currentTarget.getAttribute('data-target');
        const title = e.currentTarget.textContent.substring(2).trim();
        this.switchPanel(targetId, title);
      });
    });
  },

  // =========================================================
  // HELPER METHODS
  // =========================================================

  formatRupiah(num) {
    return new Intl.NumberFormat("id-ID", { 
      style: "currency", 
      currency: "IDR",
      minimumFractionDigits: 0 
    }).format(num || 0);
  },

  async uploadImage(e, statusId, previewId, urlId, btnId) {
    const file = e.target.files[0];
    if (!file) return;

    const status = document.getElementById(statusId);
    const preview = document.getElementById(previewId);
    const urlInput = document.getElementById(urlId);
    const saveBtn = document.getElementById(btnId);

    status.style.display = "block";
    status.textContent = "⏳ Sedang mengunggah...";
    status.classList.remove("success", "error");
    saveBtn.disabled = true;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CONFIG.CLOUDINARY_PRESET);

    try {
      const res = await fetch(CONFIG.CLOUDINARY_URL, { method: "POST", body: formData });
      const data = await res.json();
      
      if (data.secure_url) {
        urlInput.value = data.secure_url;
        preview.style.backgroundImage = `url(${data.secure_url})`;
        preview.style.display = "block";
        status.textContent = "✅ Berhasil diunggah!";
        status.classList.add("success");
      } else {
        throw new Error("Gagal dapat URL");
      }
    } catch (err) {
      status.textContent = "❌ Gagal mengunggah. Cek Cloudinary settings.";
      status.classList.add("error");
    } finally {
      saveBtn.disabled = false;
    }
  },

  async loadData() {
    try {
      const [prodRes, catRes, ordRes, refRes, setRes] = await Promise.all([
        fetch(`${CONFIG.API_URL}?action=products`).then(r => r.json()),
        fetch(`${CONFIG.API_URL}?action=categories`).then(r => r.json()),
        fetch(`${CONFIG.API_URL}?action=orders`).then(r => r.json()),
        fetch(`${CONFIG.API_URL}?action=references`).then(r => r.json()),
        fetch(`${CONFIG.API_URL}?action=settings`).then(r => r.json())
      ]);

      if (prodRes.success) this.products = prodRes.products || [];
      if (catRes.success) this.categories = catRes.categories || [];
      if (ordRes.success) this.orders = ordRes.orders || [];
      if (refRes.success) this.references = refRes.references || [];
      if (setRes.success) {
        const settingsArr = setRes.settings || [];
        this.settings = {};
        settingsArr.forEach(s => {
          this.settings[s.key] = s.value;
        });
      }

      this.populateCategoryDropdowns();
      this.renderDashboard();
      this.renderProducts();
      this.renderCategories();
      this.renderOrders();
      this.renderReferences();
    } catch (err) {
      console.error("Load data error:", err);
    }
  },

  // =========================================================
  // DASHBOARD
  // =========================================================

  renderDashboard() {
    const activeProducts = this.products.filter(p => p.active === true || p.active === "TRUE").length;
    const totalRevenue = this.orders.reduce((sum, o) => sum + Number(o.total || 0), 0);

    document.getElementById("stat-orders").textContent = this.orders.length;
    document.getElementById("stat-products").textContent = activeProducts;
    document.getElementById("stat-revenue").textContent = this.formatRupiah(totalRevenue);
  },

  // =========================================================
  // PRODUCTS
  // =========================================================

  populateCategoryDropdowns() {
    const selects = [
      document.getElementById("formCategory"),
      document.getElementById("formCatId") // Just for validation
    ];
    
    const select = selects[0];
    if (!select) return;

    const options = Array.from(select.querySelectorAll('option')).slice(0, 1);
    this.categories
      .filter(c => c.active === true || c.active === "TRUE")
      .sort((a, b) => Number(a.sort_order || 999) - Number(b.sort_order || 999))
      .forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.category_id;
        opt.textContent = `${cat.category_icon || '📦'} ${cat.category_name}`;
        select.appendChild(opt);
      });
  },

  renderProducts() {
    const box = document.getElementById('productBox');
    if (!box) return;

    if (!this.products.length) {
      box.innerHTML = '<div class="placeholder-box"><p>Belum ada produk. Tambahkan yang pertama! 📦</p></div>';
      return;
    }

    let html = `<table class="data-table">
      <thead>
        <tr>
          <th>Foto</th>
          <th>Produk</th>
          <th>Kategori</th>
          <th>Harga</th>
          <th>Stok</th>
          <th>Status</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>`;

    this.products.forEach(p => {
      const isActive = p.active === true || p.active === "TRUE";
      const badge = isActive ? '<span class="badge badge-success">Aktif</span>' : '<span class="badge badge-danger">Nonaktif</span>';
      const img = p.image_url ? `<img src="${p.image_url}" class="table-img" alt="${p.product_name}">` : '<span>📦</span>';
      const catName = this.categories.find(c => c.category_id === p.category)?.category_name || p.category || 'Uncategorized';

      html += `
        <tr>
          <td>${img}</td>
          <td><strong>${p.product_name}</strong><br><span style="font-size:12px; color:#999;">${p.product_id}</span></td>
          <td>${catName}</td>
          <td>${this.formatRupiah(p.price)}</td>
          <td>${p.stock}</td>
          <td>${badge}</td>
          <td>
            <div class="table-actions">
              <button class="btn-edit" onclick="AdminApp.openProductModal('${p.product_id}')">Edit</button>
            </div>
          </td>
        </tr>`;
    });

    html += '</tbody></table>';
    box.innerHTML = html;
  },

  openProductModal(id = null) {
    document.getElementById("productForm").reset();
    document.getElementById("formImageUrl").value = "";
    document.getElementById("imagePreview").style.display = "none";
    document.getElementById("uploadStatus").style.display = "none";
    this.editingProductId = id;

    if (id) {
      document.getElementById("productModalTitle").textContent = "Edit Produk";
      const p = this.products.find(x => x.product_id === id);
      if (p) {
        document.getElementById("formProductId").value = p.product_id;
        document.getElementById("formName").value = p.product_name || "";
        document.getElementById("formPrice").value = p.price || 0;
        document.getElementById("formStock").value = p.stock || 0;
        document.getElementById("formCategory").value = p.category || "Paper";
        document.getElementById("formDescription").value = p.description || "";
        document.getElementById("formActive").value = (p.active === true || p.active === "TRUE") ? "TRUE" : "FALSE";
        document.getElementById("formFeatured").value = (p.featured === true || p.featured === "TRUE") ? "TRUE" : "FALSE";
        
        if (p.image_url) {
          document.getElementById("formImageUrl").value = p.image_url;
          document.getElementById("imagePreview").style.backgroundImage = `url(${p.image_url})`;
          document.getElementById("imagePreview").style.display = "block";
        }
      }
    } else {
      document.getElementById("productModalTitle").textContent = "Tambah Produk";
      document.getElementById("formProductId").value = "";
    }

    document.getElementById("productModal").classList.add("show");
  },

  closeProductModal() {
    document.getElementById("productModal").classList.remove("show");
  },

  async handleProductSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById("saveProductBtn");
    btn.textContent = "Menyimpan...";
    btn.disabled = true;

    const payload = {
      action: "saveProduct",
      product_id: document.getElementById("formProductId").value || `PRD${Date.now()}`,
      product_name: document.getElementById("formName").value,
      price: Number(document.getElementById("formPrice").value),
      stock: Number(document.getElementById("formStock").value),
      category: document.getElementById("formCategory").value,
      image_url: document.getElementById("formImageUrl").value,
      description: document.getElementById("formDescription").value,
      active: document.getElementById("formActive").value === "TRUE",
      featured: document.getElementById("formFeatured").value === "TRUE"
    };

    try {
      const res = await fetch(CONFIG.API_URL, { method: "POST", body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        alert("✅ Produk berhasil disimpan!");
        this.closeProductModal();
        this.loadData();
      } else {
        alert("❌ Gagal: " + data.message);
      }
    } catch (err) {
      alert("❌ Error jaringan: " + err.message);
    } finally {
      btn.textContent = "Simpan Produk";
      btn.disabled = false;
    }
  },

  // =========================================================
  // CATEGORIES (NEW)
  // =========================================================

  renderCategories() {
    const box = document.getElementById('categoryBox');
    if (!box) return;

    if (!this.categories.length) {
      box.innerHTML = '<div class="placeholder-box"><p>Belum ada kategori. Buat yang pertama! 🏷️</p></div>';
      return;
    }

    const sorted = [...this.categories].sort((a, b) => 
      Number(a.sort_order || 999) - Number(b.sort_order || 999)
    );

    let html = `<table class="data-table">
      <thead>
        <tr>
          <th>Icon</th>
          <th>Kategori</th>
          <th>ID</th>
          <th>Urutan</th>
          <th>Status</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>`;

    sorted.forEach(cat => {
      const isActive = cat.active === true || cat.active === "TRUE";
      const badge = isActive ? '<span class="badge badge-success">Aktif</span>' : '<span class="badge badge-danger">Nonaktif</span>';
      const icon = cat.category_icon || '📦';

      html += `
        <tr>
          <td style="font-size:20px;">${icon}</td>
          <td><strong>${cat.category_name}</strong></td>
          <td><code style="background:#f5f5f5; padding:4px 8px; border-radius:4px; font-size:12px;">${cat.category_id}</code></td>
          <td>${cat.sort_order || 'N/A'}</td>
          <td>${badge}</td>
          <td>
            <div class="table-actions">
              <button class="btn-edit" onclick="AdminApp.openCategoryModal('${cat.category_id}')">Edit</button>
              <button class="btn-delete" onclick="AdminApp.deleteCategory('${cat.category_id}')">Hapus</button>
            </div>
          </td>
        </tr>`;
    });

    html += '</tbody></table>';
    box.innerHTML = html;
  },

  openCategoryModal(id = null) {
    document.getElementById("categoryForm").reset();
    this.editingCategoryId = id;

    if (id) {
      document.getElementById("categoryModalTitle").textContent = "Edit Kategori";
      const cat = this.categories.find(c => c.category_id === id);
      if (cat) {
        document.getElementById("formCategoryId").value = id;
        document.getElementById("formCatId").value = cat.category_id;
        document.getElementById("formCatName").value = cat.category_name || "";
        document.getElementById("formCatIcon").value = cat.category_icon || "📦";
        document.getElementById("formCatSort").value = cat.sort_order || 999;
        document.getElementById("formCatActive").value = (cat.active === true || cat.active === "TRUE") ? "TRUE" : "FALSE";
        document.getElementById("formCatId").disabled = true;
      }
    } else {
      document.getElementById("categoryModalTitle").textContent = "Tambah Kategori";
      document.getElementById("formCategoryId").value = "";
      document.getElementById("formCatId").disabled = false;
    }

    document.getElementById("categoryModal").classList.add("show");
  },

  closeCategoryModal() {
    document.getElementById("categoryModal").classList.remove("show");
  },

  async handleCategorySubmit(e) {
    e.preventDefault();
    const btn = document.getElementById("saveCategoryBtn");
    btn.textContent = "Menyimpan...";
    btn.disabled = true;

    const payload = {
      action: "saveCategory",
      category_id: document.getElementById("formCatId").value,
      category_name: document.getElementById("formCatName").value,
      category_icon: document.getElementById("formCatIcon").value,
      sort_order: Number(document.getElementById("formCatSort").value),
      active: document.getElementById("formCatActive").value === "TRUE"
    };

    try {
      const res = await fetch(CONFIG.API_URL, { method: "POST", body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        alert("✅ Kategori berhasil disimpan!");
        this.closeCategoryModal();
        this.loadData();
      } else {
        alert("❌ Gagal: " + data.message);
      }
    } catch (err) {
      alert("❌ Error jaringan: " + err.message);
    } finally {
      btn.textContent = "Simpan Kategori";
      btn.disabled = false;
    }
  },

  async deleteCategory(id) {
    if (!confirm(`Yakin hapus kategori ini? Produk dalam kategori ini akan tetap tersimpan.`)) return;

    try {
      const res = await fetch(CONFIG.API_URL, {
        method: "POST",
        body: JSON.stringify({ action: "deleteCategory", category_id: id })
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ Kategori berhasil dihapus!");
        this.loadData();
      } else {
        alert("❌ Gagal: " + data.message);
      }
    } catch (err) {
      alert("❌ Error jaringan");
    }
  },

  // =========================================================
  // ORDERS
  // =========================================================

  renderOrders() {
    const box = document.getElementById('orderBox');
    if (!box) return;

    if (!this.orders.length) {
      box.innerHTML = '<div class="placeholder-box"><p>Belum ada pesanan. 🛒</p></div>';
      return;
    }

    const sorted = [...this.orders].reverse();

    let html = `<table class="data-table">
      <thead>
        <tr>
          <th>Order ID</th>
          <th>Pelanggan</th>
          <th>Tanggal</th>
          <th>Total</th>
          <th>Pembayaran</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>`;

    sorted.forEach(o => {
      const paymentBadge = o.payment_status === "SUDAH BAYAR" 
        ? '<span class="badge badge-success">✓ Bayar</span>' 
        : '<span class="badge badge-warning">⏳ Belum</span>';
      
      const statusBadge = o.order_status === "BARU" 
        ? '<span class="badge badge-warning">Baru</span>'
        : o.order_status === "DIPROSES"
        ? '<span class="badge" style="background:#b3d9ff; color:#004085;">Proses</span>'
        : o.order_status === "DIKIRIM"
        ? '<span class="badge" style="background:#d1ecf1; color:#0c5460;">Kirim</span>'
        : '<span class="badge badge-success">Selesai</span>';

      html += `
        <tr>
          <td><strong>${o.order_id}</strong></td>
          <td>${o.customer_name}<br><span style="font-size:12px; color:#999;">${o.whatsapp}</span></td>
          <td style="font-size:13px;">${new Date(o.order_date).toLocaleDateString('id-ID')}</td>
          <td>${this.formatRupiah(o.total)}</td>
          <td>${paymentBadge}</td>
          <td>${statusBadge}</td>
        </tr>`;
    });

    html += '</tbody></table>';
    box.innerHTML = html;
  },

  // =========================================================
  // REFERENCES (PORTFOLIO)
  // =========================================================

  renderReferences() {
    const box = document.getElementById('referenceBox');
    if (!box) return;

    if (!this.references.length) {
      box.innerHTML = '<div class="placeholder-box"><p>Belum ada karya portfolio. Tambahkan inspirasi! ✨</p></div>';
      return;
    }

    const sorted = [...this.references].sort((a, b) => 
      Number(a.sort_order || 999) - Number(b.sort_order || 999)
    );

    let html = '<div class="admin-ref-grid">';

    sorted.forEach(r => {
      const isActive = r.active === true || r.active === "TRUE";
      const badge = isActive ? '<span class="badge badge-success">Aktif</span>' : '<span class="badge badge-danger">Nonaktif</span>';
      const img = r.image_url ? `<img src="${r.image_url}" class="admin-ref-img" alt="${r.title}">` : '<div style="width:100%; aspect-ratio:1; background:#f0f0f0; display:flex; align-items:center; justify-content:center; font-size:32px;">✨</div>';

      html += `
        <div class="admin-ref-card">
          ${img}
          <div class="admin-ref-info">
            <div class="admin-ref-title">${r.title}</div>
            <div class="admin-ref-desc">${r.description || 'Tidak ada deskripsi'}</div>
            <div style="font-size:12px; color:#999; margin-bottom:10px;">Urutan: ${r.sort_order || 'N/A'}</div>
            ${badge}
          </div>
          <div class="admin-ref-actions">
            <button class="btn-edit" onclick="AdminApp.openReferenceModal('${r.reference_id}')">Edit</button>
            <button class="btn-delete" onclick="AdminApp.deleteReference('${r.reference_id}')">Hapus</button>
          </div>
        </div>`;
    });

    html += '</div>';
    box.innerHTML = html;
  },

  openReferenceModal(id = null) {
    document.getElementById("referenceForm").reset();
    document.getElementById("formRefImageUrl").value = "";
    document.getElementById("refImagePreview").style.display = "none";
    document.getElementById("refUploadStatus").style.display = "none";
    this.editingRefId = id;

    if (id) {
      document.getElementById("referenceModalTitle").textContent = "Edit Karya Portfolio";
      const ref = this.references.find(r => r.reference_id === id);
      if (ref) {
        document.getElementById("formRefId").value = ref.reference_id;
        document.getElementById("formRefTitle").value = ref.title || "";
        document.getElementById("formRefDescription").value = ref.description || "";
        document.getElementById("formRefSort").value = ref.sort_order || 999;
        document.getElementById("formRefActive").value = (ref.active === true || ref.active === "TRUE") ? "TRUE" : "FALSE";

        if (ref.image_url) {
          document.getElementById("formRefImageUrl").value = ref.image_url;
          document.getElementById("refImagePreview").style.backgroundImage = `url(${ref.image_url})`;
          document.getElementById("refImagePreview").style.display = "block";
        }
      }
    } else {
      document.getElementById("referenceModalTitle").textContent = "Tambah Karya Portfolio";
      document.getElementById("formRefId").value = "";
    }

    document.getElementById("referenceModal").classList.add("show");
  },

  closeReferenceModal() {
    document.getElementById("referenceModal").classList.remove("show");
  },

  async handleReferenceSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById("saveRefBtn");
    btn.textContent = "Menyimpan...";
    btn.disabled = true;

    const payload = {
      action: "saveReference",
      reference_id: document.getElementById("formRefId").value || `REF${Date.now()}`,
      title: document.getElementById("formRefTitle").value,
      image_url: document.getElementById("formRefImageUrl").value,
      description: document.getElementById("formRefDescription").value,
      sort_order: Number(document.getElementById("formRefSort").value),
      active: document.getElementById("formRefActive").value === "TRUE"
    };

    try {
      const res = await fetch(CONFIG.API_URL, { method: "POST", body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        alert("✅ Karya berhasil disimpan!");
        this.closeReferenceModal();
        this.loadData();
      } else {
        alert("❌ Gagal: " + data.message);
      }
    } catch (err) {
      alert("❌ Error jaringan: " + err.message);
    } finally {
      btn.textContent = "Simpan Karya";
      btn.disabled = false;
    }
  },

  async deleteReference(id) {
    if (!confirm("Yakin hapus karya ini?")) return;

    try {
      const res = await fetch(CONFIG.API_URL, {
        method: "POST",
        body: JSON.stringify({ action: "deleteReference", reference_id: id })
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ Karya berhasil dihapus!");
        this.loadData();
      } else {
        alert("❌ Gagal: " + data.message);
      }
    } catch (err) {
      alert("❌ Error jaringan");
    }
  }
};

// =========================================================
// RUN ON PAGE LOAD
// =========================================================

document.addEventListener("DOMContentLoaded", () => AdminApp.init());
