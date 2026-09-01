// =========================================================
// NIKIARA ADMIN PANEL
// =========================================================

const CONFIG = {
  // Samakan dengan API URL tokomu
  API_URL: "https://script.google.com/macros/s/AKfycby72Zqja-7P7H1QcYfW9W_LxxtHF0KKy3p71bI4TrvB62CmkN_P9bVx0rEcki1juB2q/exec",
  DUMMY_PASSWORD: "admin",
  
  // 👇 ISI DENGAN DATA CLOUDINARY MILIKMU 👇
  CLOUDINARY_URL: "https://api.cloudinary.com/v1_1/vtd7inkb/image/upload",
  CLOUDINARY_PRESET: "odbmmzkd" 
};

const AdminApp = {
  products: [],
  orders: [],
  references: [],

  init() {
    this.checkAuth();
    this.setupEventListeners();
  },

  checkAuth() {
    if (sessionStorage.getItem("nikiara_admin_logged") === "true") {
      this.showDashboard(); this.loadData();
    } else {
      document.getElementById("loginScreen").style.display = "flex";
      document.getElementById("adminDashboard").style.display = "none";
    }
  },

  handleLogin(e) {
    e.preventDefault();
    if (document.getElementById("adminPassword").value === CONFIG.DUMMY_PASSWORD) {
      sessionStorage.setItem("nikiara_admin_logged", "true");
      document.getElementById("loginError").style.display = "none";
      this.checkAuth();
    } else document.getElementById("loginError").style.display = "block";
  },

  logout() { sessionStorage.removeItem("nikiara_admin_logged"); location.reload(); },

  showDashboard() {
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("adminDashboard").style.display = "flex";
  },

  switchPanel(targetId, title) {
    document.querySelectorAll('.panel').forEach(p => p.style.display = 'none');
    document.getElementById(targetId).style.display = 'block';
    document.getElementById("currentPanelTitle").textContent = title;
  },

  setupEventListeners() {
    document.getElementById("loginForm").addEventListener("submit", e => this.handleLogin(e));
    document.getElementById("logoutBtn").addEventListener("click", () => this.logout());
    document.getElementById("productForm").addEventListener("submit", e => this.handleProductSubmit(e));
    document.getElementById("referenceForm").addEventListener("submit", e => this.handleReferenceSubmit(e));
    
    // Cloudinary File Inputs
    document.getElementById("formImageFile").addEventListener("change", e => this.uploadImage(e, "uploadStatus", "imagePreview", "formImageUrl", "saveProductBtn"));
    document.getElementById("refImageFile").addEventListener("change", e => this.uploadImage(e, "refUploadStatus", "refImagePreview", "refImageUrl", "saveRefBtn"));

    const navItems = document.querySelectorAll('#sidebarNav .nav-item:not(#logoutBtn)');
    navItems.forEach(item => {
      item.addEventListener('click', e => {
        navItems.forEach(nav => nav.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.switchPanel(e.currentTarget.getAttribute('data-target'), e.currentTarget.textContent.substring(2).trim());
      });
    });
  },

  formatRupiah(num) { return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(num || 0); },

  async loadData() {
    try {
      const [prodRes, ordRes, refRes] = await Promise.all([
        fetch(`${CONFIG.API_URL}?action=products`).then(r => r.json()),
        fetch(`${CONFIG.API_URL}?action=orders`).then(r => r.json()),
        fetch(`${CONFIG.API_URL}?action=references`).then(r => r.json())
      ]);
      if (prodRes.success) this.products = prodRes.products || [];
      if (ordRes.success) this.orders = ordRes.orders || [];
      if (refRes.success) this.references = refRes.references || [];

      this.renderDashboard(); this.renderProducts(); this.renderOrders(); this.renderReferences();
    } catch (err) { console.error("Gagal load data", err); }
  },

  renderDashboard() {
    const activeProducts = this.products.filter(p => p.active).length;
    const totalRevenue = this.orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const stats = document.querySelectorAll('.stat-value');
    if (stats.length >= 3) {
      stats[0].textContent = this.orders.length; stats[1].textContent = activeProducts; stats[2].textContent = this.formatRupiah(totalRevenue);
    }
  },

  // ==========================================
  // CLOUDINARY UPLOAD HANDLER
  // ==========================================
  async uploadImage(e, statusId, previewId, urlId, btnId) {
    const file = e.target.files[0];
    if (!file) return;

    const status = document.getElementById(statusId);
    const preview = document.getElementById(previewId);
    const urlInput = document.getElementById(urlId);
    const saveBtn = document.getElementById(btnId);

    status.style.display = "block"; status.style.color = "#888"; status.textContent = "⏳ Sedang mengunggah foto...";
    saveBtn.disabled = true;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CONFIG.CLOUDINARY_PRESET);

    try {
      const res = await fetch(CONFIG.CLOUDINARY_URL, { method: "POST", body: formData });
      const data = await res.json();
      if (data.secure_url) {
        urlInput.value = data.secure_url;
        preview.style.backgroundImage = `url(${data.secure_url})`; preview.style.display = "block";
        status.textContent = "✅ Foto berhasil diunggah!"; status.style.color = "green";
      } else throw new Error("Gagal dapat URL");
    } catch (err) {
      status.textContent = "❌ Gagal mengunggah foto. Pastikan Cloudinary tersetting benar."; status.style.color = "red";
    } finally { saveBtn.disabled = false; }
  },

  // ==========================================
  // PRODUCTS LOGIC
  // ==========================================
  renderProducts() {
    const box = document.getElementById('productBox');
    if (!this.products.length) { box.innerHTML = "<p>Belum ada produk.</p>"; return; }
    let html = `<table style="width:100%; text-align:left; border-collapse:collapse; background:white;">
      <tr style="border-bottom:2px solid #eee;"><th>Foto</th><th>ID / Nama</th><th>Harga</th><th>Stok</th><th>Status</th><th>Aksi</th></tr>`;
    this.products.forEach(p => {
      const badge = p.active ? `<span class="badge badge-success">Aktif</span>` : `<span class="badge badge-danger">Nonaktif</span>`;
      const img = p.image_url ? `<img src="${p.image_url}" style="width:40px; height:40px; border-radius:6px; object-fit:cover;">` : "📦";
      html += `<tr style="border-bottom:1px solid #eee;"><td style="padding:10px;">${img}</td><td style="padding:10px;"><strong>${p.product_id}</strong><br>${p.product_name}</td><td style="padding:10px;">${this.formatRupiah(p.price)}</td><td style="padding:10px;">${p.stock}</td><td style="padding:10px;">${badge}</td><td style="padding:10px;"><button onclick="AdminApp.openProductModal('${p.product_id}')" style="background:#5f7161; color:white; padding:5px 10px; border-radius:4px;">Edit</button></td></tr>`;
    });
    box.innerHTML = html + "</table>"; box.style.padding = "0"; box.style.border = "none";
  },

  openProductModal(id = null) {
    document.getElementById("productModal").style.display = "flex"; document.getElementById("productForm").reset();
    document.getElementById("formImageUrl").value = ""; document.getElementById("imagePreview").style.display = "none"; document.getElementById("uploadStatus").style.display = "none";
    
    if (id) {
      document.getElementById("modalTitle").textContent = "Edit Produk";
      const p = this.products.find(x => x.product_id === id);
      if(p) {
        document.getElementById("formProductId").value = p.product_id; document.getElementById("formName").value = p.product_name; document.getElementById("formPrice").value = p.price; document.getElementById("formStock").value = p.stock; document.getElementById("formCategory").value = p.category || 'Paper'; document.getElementById("formDescription").value = p.description || ''; document.getElementById("formActive").value = p.active ? "TRUE" : "FALSE";
        if (p.image_url) { document.getElementById("formImageUrl").value = p.image_url; document.getElementById("imagePreview").style.backgroundImage = `url(${p.image_url})`; document.getElementById("imagePreview").style.display = "block"; }
      }
    } else { document.getElementById("modalTitle").textContent = "Tambah Produk"; document.getElementById("formProductId").value = ""; }
  },

  closeProductModal() { document.getElementById("productModal").style.display = "none"; },

  async handleProductSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById("saveProductBtn"); btn.textContent = "Menyimpan..."; btn.disabled = true;
    const payload = {
      action: "saveProduct", product_id: document.getElementById("formProductId").value, product_name: document.getElementById("formName").value, price: document.getElementById("formPrice").value, stock: document.getElementById("formStock").value, category: document.getElementById("formCategory").value, image_url: document.getElementById("formImageUrl").value, description: document.getElementById("formDescription").value, active: document.getElementById("formActive").value === "TRUE"
    };
    try {
      const res = await fetch(CONFIG.API_URL, { method: "POST", body: JSON.stringify(payload) }); const data = await res.json();
      if(data.success) { alert("Tersimpan!"); this.closeProductModal(); this.loadData(); } else alert("Gagal: " + data.message);
    } catch (err) { alert("Error jaringan."); } finally { btn.textContent = "Simpan"; btn.disabled = false; }
  },

  // ==========================================
  // REFERENCES / PORTFOLIO LOGIC
  // ==========================================
  renderReferences() {
    const box = document.getElementById('referenceBox');
    if (!this.references.length) { box.innerHTML = "<p>Belum ada karya portfolio.</p>"; return; }
    
    let html = `<div class="admin-ref-grid">`;
    this.references.forEach(r => {
     const badge = r.active 
        ? `<span class="badge badge-success" style="position:absolute; top:10px; right:10px; z-index:2; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Aktif</span>` 
        : `<span class="badge badge-danger" style="position:absolute; top:10px; right:10px; z-index:2; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Nonaktif</span>`;
      const img = images[0] ? `<img src="${images[0]}" class="admin-ref-img">` : `<div class="admin-ref-img" style="display:grid; place-items:center; font-size:40px;">🖼️</div>`;
      
      html += `
        <div class="admin-ref-card">
          ${badge}
          ${img}
          <div class="admin-ref-info">
            <div class="admin-ref-title">${r.title}</div>
            <div class="admin-ref-desc">${r.description || '-'}</div>
            <div style="font-size:11px; color:#aaa; margin-bottom:10px;">Urutan: ${r.sort_order}</div>
            <div class="admin-ref-actions">
              <button class="btn-edit" onclick="AdminApp.openReferenceModal('${r.reference_id}')">Edit</button>
              <button class="btn-delete" onclick="AdminApp.deleteReference('${r.reference_id}')">Hapus</button>
            </div>
          </div>
        </div>`;
    });
    html += `</div>`;
    box.innerHTML = html; 
    box.style.padding = "0"; box.style.border = "none"; box.style.background = "transparent";
  },

  async deleteReference(id) {
    if (!confirm("Yakin ingin menghapus karya ini?")) return;
    try {
      const res = await fetch(CONFIG.API_URL, {
        method: "POST",
        body: JSON.stringify({ action: "deleteReference", reference_id: id })
      });
      const data = await res.json();
      if (data.success) {
        alert("Berhasil dihapus!");
        this.loadData(); // Tarik data terbaru
      } else {
        alert("Gagal menghapus: " + data.message);
      }
    } catch (err) {
      alert("Error jaringan saat menghapus.");
    }
  },
  // ==========================================
  // ORDERS LOGIC
  // ==========================================
  renderOrders() {
    const box = document.getElementById('orderBox');
    if (!this.orders.length) { box.innerHTML = "<p>Belum ada pesanan.</p>"; return; }
    let html = `<table style="width:100%; text-align:left; border-collapse:collapse; background:white;">
      <tr style="border-bottom:2px solid #eee;"><th>ID / Tgl</th><th>Pembeli</th><th>Item</th><th>Total</th></tr>`;
    this.orders.forEach(o => {
      const date = o.order_date ? new Date(o.order_date).toLocaleDateString('id-ID') : '-';
      html += `<tr style="border-bottom:1px solid #eee;"><td style="padding:10px;"><strong>${o.order_id}</strong><br><small>${date}</small></td><td style="padding:10px;"><strong>${o.customer_name}</strong><br><small>WA: ${o.whatsapp}</small></td><td style="padding:10px; font-size:12px; max-width:200px;">${String(o.items).replace(/\|/g, '<br>')}</td><td style="padding:10px; font-weight:bold; color:#b76e79;">${this.formatRupiah(o.total)}</td></tr>`;
    });
    box.innerHTML = html + "</table>"; box.style.padding = "0"; box.style.border = "none";
  }
};

document.addEventListener("DOMContentLoaded", () => AdminApp.init());
