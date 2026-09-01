// =========================================================
// NIKIARA ADMIN PANEL
// =========================================================

const CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycby72Zqja-7P7H1QcYfW9W_LxxtHF0KKy3p71bI4TrvB62CmkN_P9bVx0rEcki1juB2q/exec",
  DUMMY_PASSWORD: "admin"
};

const AdminApp = {
  products: [],

  init() {
    this.checkAuth();
    this.setupEventListeners();
  },

  checkAuth() {
    if (sessionStorage.getItem("nikiara_admin_logged") === "true") {
      this.showDashboard();
      this.loadData(); // Tarik data otomatis jika sesi masih ada
    } else {
      this.showLogin();
    }
  },

  handleLogin(e) {
    e.preventDefault();
    const passInput = document.getElementById("adminPassword").value;
    const errorText = document.getElementById("loginError");

    if (passInput === CONFIG.DUMMY_PASSWORD) {
      sessionStorage.setItem("nikiara_admin_logged", "true");
      errorText.style.display = "none";
      document.getElementById("loginForm").reset();
      this.showDashboard();
      this.loadData(); // Tarik data setelah berhasil login
    } else {
      errorText.style.display = "block";
    }
  },

  logout() {
    sessionStorage.removeItem("nikiara_admin_logged");
    this.showLogin();
  },

  showLogin() {
    document.getElementById("loginScreen").style.display = "flex";
    document.getElementById("adminDashboard").style.display = "none";
  },

  showDashboard() {
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("adminDashboard").style.display = "flex";
  },

  switchPanel(targetId, title) {
    document.querySelectorAll('.panel').forEach(panel => panel.style.display = 'none');
    document.getElementById(targetId).style.display = 'block';
    document.getElementById("currentPanelTitle").textContent = title;
  },

  setupEventListeners() {
    document.getElementById("loginForm").addEventListener("submit", (e) => this.handleLogin(e));
    document.getElementById("logoutBtn").addEventListener("click", () => this.logout());

    const navItems = document.querySelectorAll('#sidebarNav .nav-item');
    navItems.forEach(item => {
      if (item.id === 'logoutBtn') return; // Skip logout button
      item.addEventListener('click', (e) => {
        navItems.forEach(nav => nav.classList.remove('active'));
        const clickedItem = e.currentTarget;
        clickedItem.classList.add('active');
        
        const targetId = clickedItem.getAttribute('data-target');
        this.switchPanel(targetId, clickedItem.textContent.substring(2).trim());
      });
    });
  },

  // =========================================================
  // INTEGRASI DATA BACKEND
  // =========================================================

  async loadData() {
    try {
      document.querySelector('#panel-products .placeholder-box').innerHTML = "<p>⏳ Menarik data produk dari Google Sheets...</p>";
      
      const response = await fetch(`${CONFIG.API_URL}?action=products`);
      const data = await response.json();

      if (data.success) {
        this.products = data.products || [];
        this.renderProducts();
        
        // Update statistik di Dashboard
        const activeCount = this.products.filter(p => p.active).length;
        document.querySelectorAll('.stat-value')[1].textContent = activeCount;
      } else {
        throw new Error("Gagal mengambil data produk");
      }
    } catch (error) {
      console.error(error);
      document.querySelector('#panel-products .placeholder-box').innerHTML = "<p class='text-danger'>❌ Gagal memuat data. Periksa koneksi atau URL API.</p>";
    }
  },

  formatRupiah(num) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num || 0);
  },

  renderProducts() {
    const container = document.querySelector('#panel-products .placeholder-box');
    
    if (this.products.length === 0) {
      container.innerHTML = "<p>Belum ada produk di tokomu.</p>";
      return;
    }

    let html = `
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead>
          <tr style="border-bottom: 2px solid #eaeaea; color: #888;">
            <th style="padding: 12px 8px;">ID</th>
            <th style="padding: 12px 8px;">Nama Produk</th>
            <th style="padding: 12px 8px;">Kategori</th>
            <th style="padding: 12px 8px;">Harga</th>
            <th style="padding: 12px 8px;">Stok</th>
            <th style="padding: 12px 8px;">Status</th>
          </tr>
        </thead>
        <tbody>
    `;

    this.products.forEach(p => {
      const statusBadge = p.active 
        ? `<span class="admin-badge" style="background:#e7efd9; color:#4d5b4f;">Aktif</span>` 
        : `<span class="admin-badge" style="background:#f8d7da; color:#721c24;">Nonaktif</span>`;

      html += `
        <tr style="border-bottom: 1px solid #eaeaea;">
          <td style="padding: 12px 8px; font-weight: bold; color: #55423d;">${p.product_id || p.id || '-'}</td>
          <td style="padding: 12px 8px;">${p.product_name || p.name || '-'}</td>
          <td style="padding: 12px 8px;">${p.category || '-'}</td>
          <td style="padding: 12px 8px;">${this.formatRupiah(p.price)}</td>
          <td style="padding: 12px 8px;">${p.stock}</td>
          <td style="padding: 12px 8px;">${statusBadge}</td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
    
    // Rapikan styling container box
    container.style.padding = "0";
    container.style.border = "none";
    container.style.backgroundColor = "transparent";
  }
};

document.addEventListener("DOMContentLoaded", () => {
  AdminApp.init();
});
