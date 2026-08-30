// =========================================================
// NIKIARA ADMIN PANEL
// =========================================================

// CONFIG
const CONFIG = {
  // Ganti dengan API URL Google Apps Script yang sama dengan toko
  API_URL: "https://script.google.com/macros/s/AKfycby72Zqja-7P7H1QcYfW9W_LxxtHF0KKy3p71bI4TrvB62CmkN_P9bVx0rEcki1juB2q/exec",
  // Password dummy sementara sebelum integrasi backend
  DUMMY_PASSWORD: "admin"
};

// UI & AUTH MODULE
const AdminApp = {
  init() {
    this.checkAuth();
    this.setupEventListeners();
  },

  checkAuth() {
    const isLogged = sessionStorage.getItem("nikiara_admin_logged");
    if (isLogged === "true") {
      this.showDashboard();
    } else {
      this.showLogin();
    }
  },

  handleLogin(e) {
    e.preventDefault();
    const passInput = document.getElementById("adminPassword").value;
    const errorText = document.getElementById("loginError");

    // Validasi Sederhana
    if (passInput === CONFIG.DUMMY_PASSWORD) {
      sessionStorage.setItem("nikiara_admin_logged", "true");
      errorText.style.display = "none";
      document.getElementById("loginForm").reset();
      this.showDashboard();
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
    // Hide all panels
    document.querySelectorAll('.panel').forEach(panel => {
      panel.style.display = 'none';
    });
    
    // Show target panel
    document.getElementById(targetId).style.display = 'block';
    
    // Update Header Title
    document.getElementById("currentPanelTitle").textContent = title;
  },

  setupEventListeners() {
    // Login & Logout
    document.getElementById("loginForm").addEventListener("submit", (e) => this.handleLogin(e));
    document.getElementById("logoutBtn").addEventListener("click", () => this.logout());

    // Sidebar Navigation
    const navItems = document.querySelectorAll('#sidebarNav .nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        // Remove active class from all
        navItems.forEach(nav => nav.classList.remove('active'));
        // Add active class to clicked
        const clickedItem = e.currentTarget;
        clickedItem.classList.add('active');
        
        // Switch panel
        const targetId = clickedItem.getAttribute('data-target');
        // Extract title text (removing emojis for the header)
        const title = clickedItem.textContent.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\s/g, '').trim().replace(/([A-Z])/g, ' $1').trim();
        this.switchPanel(targetId, clickedItem.textContent.substring(2).trim());
      });
    });
  }
};

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  AdminApp.init();
});
