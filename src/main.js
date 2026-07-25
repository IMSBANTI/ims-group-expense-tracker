import Chart from 'chart.js/auto';
import { cloudService } from './data/cloudService.js';
import { authService } from './data/authService.js';

// Application Central State
let state = {
  ...cloudService.loadData(),
  currentMonth: new Date().toISOString().slice(0, 7), // e.g. "2026-07"
  currentYear: new Date().getFullYear().toString(),   // e.g. "2026"
  selectedCompanyFilter: "all",
  activeTab: "monthly",
  theme: localStorage.getItem("ims_theme") || "dark",
  searchQuery: "",
  editingExpenseId: null,
  syncStatus: "Synced with Cloud"
};

// Chart instances
let companyChartInstance = null;
let categoryChartInstance = null;
let yearlyTrendChartInstance = null;

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  applyTheme(state.theme);
  renderApp();
  setupGlobalListeners();
});

function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("ims_theme", theme);
}

// Convert amount into BDT based on currency
function convertToBDT(amount, currency) {
  const num = parseFloat(amount) || 0;
  if (currency === "USD") return num * state.exchangeRates.USD_TO_BDT;
  if (currency === "EUR") return num * state.exchangeRates.EUR_TO_BDT;
  return num; // BDT
}

// Format numbers nicely
function formatCurrency(amount, currency = "BDT") {
  const num = parseFloat(amount) || 0;
  if (currency === "USD") return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (currency === "EUR") return `€${num.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `TK ${num.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Save state helper
function commitStateChange() {
  cloudService.saveData({
    companies: state.companies,
    categories: state.categories,
    expenses: state.expenses,
    exchangeRates: state.exchangeRates
  });
  state.syncStatus = "Saved to Cloud";
  renderApp();
}

// Main Render Loop
function renderApp() {
  const app = document.getElementById("app");
  const isAdmin = authService.isAdmin();

  // Filter expenses
  const filteredExpenses = state.expenses.filter(exp => {
    const matchesCompany = state.selectedCompanyFilter === "all" || exp.companyId === state.selectedCompanyFilter;
    const matchesSearch = !state.searchQuery || 
      exp.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      (exp.userOrDetail && exp.userOrDetail.toLowerCase().includes(state.searchQuery.toLowerCase())) ||
      (exp.email && exp.email.toLowerCase().includes(state.searchQuery.toLowerCase()));
    return matchesCompany && matchesSearch;
  });

  // Calculate Totals
  let totalMonthlyBDT = 0;
  let totalYearlyBDT = 0;

  const companyMonthlyTotals = {};
  state.companies.forEach(c => companyMonthlyTotals[c.id] = 0);

  filteredExpenses.forEach(exp => {
    const bdt = convertToBDT(exp.amount, exp.currency);
    if (exp.recurring === "Monthly") {
      totalMonthlyBDT += bdt;
      totalYearlyBDT += (bdt * 12);
      if (companyMonthlyTotals[exp.companyId] !== undefined) {
        companyMonthlyTotals[exp.companyId] += bdt;
      }
    } else if (exp.recurring === "Yearly") {
      totalMonthlyBDT += (bdt / 12);
      totalYearlyBDT += bdt;
      if (companyMonthlyTotals[exp.companyId] !== undefined) {
        companyMonthlyTotals[exp.companyId] += (bdt / 12);
      }
    }
  });

  app.innerHTML = `
    <!-- Navbar -->
    <header class="navbar glass-panel">
      <div class="brand-section">
        <div class="group-logo-badge">
          ${state.companies.map(c => `<img src="${c.logo}" alt="${c.code}" title="${c.name}" onerror="this.style.display='none'">`).join('')}
        </div>
        <div class="brand-title-group">
          <h1>IMS Group Expense Calculator</h1>
          <div class="brand-subtitle">Monthly & Yearly Cloud Reporting System</div>
        </div>
      </div>
      <div class="nav-controls">
        <div class="sync-indicator">
          <span class="sync-dot"></span> ${state.syncStatus}
        </div>
        <span class="role-badge ${isAdmin ? 'admin' : 'user'}">
          ${isAdmin ? '🔑 Admin Mode' : '👁️ User View Mode'}
        </span>
        <button class="btn btn-secondary" id="toggle-theme-btn">
          ${state.theme === 'dark' ? '☀️ Light' : '🌙 Dark'} Mode
        </button>
        <button class="btn btn-secondary" id="cloud-config-btn">
          ☁️ Cloud Backup
        </button>
        ${isAdmin ? 
          `<button class="btn btn-danger" id="auth-logout-btn">Lock / Exit Admin</button>` : 
          `<button class="btn btn-primary" id="auth-login-btn">Admin Unlock</button>`
        }
      </div>
    </header>

    <!-- Toolbar Filters -->
    <section class="toolbar-panel glass-panel">
      <div class="filter-group">
        <div>
          <label style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; display: block; margin-bottom: 0.25rem;">COMPANY ENTITY</label>
          <select id="filter-company-select" class="select-input">
            <option value="all" ${state.selectedCompanyFilter === 'all' ? 'selected' : ''}>All Group Entities (${state.companies.length})</option>
            ${state.companies.map(c => `<option value="${c.id}" ${state.selectedCompanyFilter === c.id ? 'selected' : ''}>${c.code} — ${c.name}</option>`).join('')}
          </select>
        </div>

        <div>
          <label style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; display: block; margin-bottom: 0.25rem;">REPORT MONTH & YEAR</label>
          <div style="display: flex; gap: 0.5rem;">
            <input type="month" id="filter-month-input" class="select-input" value="${state.currentMonth}">
          </div>
        </div>

        <div>
          <label style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; display: block; margin-bottom: 0.25rem;">SEARCH RECORDS</label>
          <input type="text" id="search-input" class="select-input" placeholder="Search user, email, tool..." value="${state.searchQuery}">
        </div>
      </div>

      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button class="btn btn-secondary" id="print-report-btn">🖨️ Print / PDF</button>
        ${isAdmin ? `
          <button class="btn btn-accent" id="open-settings-btn">⚙️ Manage Entities</button>
          <button class="btn btn-primary" id="open-add-expense-btn">+ Add Expense</button>
        ` : ''}
      </div>
    </section>

    <!-- KPI Metric Cards -->
    <section class="metrics-grid">
      <div class="kpi-card glass-panel">
        <div class="kpi-header">
          <span class="kpi-title">Monthly Total Expense</span>
          <div class="kpi-icon" style="color: var(--accent-blue);">📊</div>
        </div>
        <div class="kpi-value">${formatCurrency(totalMonthlyBDT, 'BDT')}</div>
        <div class="kpi-subtitle">~$${(totalMonthlyBDT / state.exchangeRates.USD_TO_BDT).toFixed(2)} USD / Mo</div>
      </div>

      <div class="kpi-card glass-panel">
        <div class="kpi-header">
          <span class="kpi-title">Projected Yearly Total</span>
          <div class="kpi-icon" style="color: var(--accent-emerald);">📈</div>
        </div>
        <div class="kpi-value">${formatCurrency(totalYearlyBDT, 'BDT')}</div>
        <div class="kpi-subtitle">~$${(totalYearlyBDT / state.exchangeRates.USD_TO_BDT).toFixed(2)} USD / Yr</div>
      </div>

      ${state.companies.map(comp => `
        <div class="kpi-card glass-panel ${comp.id}">
          <div class="kpi-header">
            <span class="kpi-title">${comp.code} Monthly</span>
            <img src="${comp.logo}" alt="${comp.code}" class="company-logo-img" onerror="this.style.display='none'">
          </div>
          <div class="kpi-value" style="font-size: 1.4rem;">${formatCurrency(companyMonthlyTotals[comp.id] || 0, 'BDT')}</div>
          <div class="kpi-subtitle">${comp.name}</div>
        </div>
      `).join('')}
    </section>

    <!-- View Nav Tabs -->
    <div class="tabs-header">
      <div class="tab-nav">
        <button class="tab-btn ${state.activeTab === 'monthly' ? 'active' : ''}" id="tab-monthly">📅 Monthly Report</button>
        <button class="tab-btn ${state.activeTab === 'yearly' ? 'active' : ''}" id="tab-yearly">📊 12-Month Yearly Matrix</button>
        <button class="tab-btn ${state.activeTab === 'charts' ? 'active' : ''}" id="tab-charts">📈 Visual Analytics</button>
      </div>

      <div style="font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 1rem;">
        <span>Rates: $1 = ${state.exchangeRates.USD_TO_BDT} BDT | €1 = ${state.exchangeRates.EUR_TO_BDT} BDT</span>
      </div>
    </div>

    <!-- Tab Content -->
    <main id="tab-content-area">
      ${state.activeTab === 'monthly' ? renderMonthlyReport(filteredExpenses, isAdmin) : ''}
      ${state.activeTab === 'yearly' ? renderYearlyReport(filteredExpenses) : ''}
      ${state.activeTab === 'charts' ? renderVisualAnalyticsArea() : ''}
    </main>
  `;

  // Attach dynamic event listeners
  attachAppEventListeners();

  // Render charts if on charts tab
  if (state.activeTab === 'charts') {
    setTimeout(renderCharts, 50);
  }
}

// Render Monthly Itemized Expense Table
function renderMonthlyReport(expenses, isAdmin) {
  // Group by Category
  const categorized = {};
  state.categories.forEach(cat => categorized[cat.id] = []);

  expenses.forEach(exp => {
    if (!categorized[exp.categoryId]) categorized[exp.categoryId] = [];
    categorized[exp.categoryId].push(exp);
  });

  return `
    <div class="glass-panel" style="padding: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h2 style="font-size: 1.1rem; font-weight: 700;">Month-Wise Expense Breakdown (${state.currentMonth})</h2>
        <span style="font-size: 0.85rem; color: var(--text-muted);">${expenses.length} Expense Records</span>
      </div>

      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Company Entity</th>
              <th>Category</th>
              <th>Service / Item</th>
              <th>User / Assigned To</th>
              <th>Billing Contact</th>
              <th>Original Cost</th>
              <th>Monthly (BDT)</th>
              <th>Frequency</th>
              ${isAdmin ? '<th style="text-align: center;">Actions</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${expenses.length === 0 ? `
              <tr>
                <td colspan="${isAdmin ? 9 : 8}" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                  No expense records found for this filter.
                </td>
              </tr>
            ` : ''}
            ${expenses.map(exp => {
              const comp = state.companies.find(c => c.id === exp.companyId) || { code: exp.companyId, logo: '', name: exp.companyId };
              const cat = state.categories.find(c => c.id === exp.categoryId) || { name: exp.categoryId, color: '#94a3b8' };
              const bdtAmount = convertToBDT(exp.amount, exp.currency);

              return `
                <tr>
                  <td>
                    <div class="company-cell">
                      <img src="${comp.logo}" alt="${comp.code}" class="company-logo-img" onerror="this.style.display='none'">
                      <span>${comp.code}</span>
                    </div>
                  </td>
                  <td>
                    <span style="display: inline-flex; align-items: center; gap: 0.4rem;">
                      <span style="width: 8px; height: 8px; border-radius: 50%; background: ${cat.color};"></span>
                      ${cat.name}
                    </span>
                  </td>
                  <td style="font-weight: 700;">${exp.title}</td>
                  <td>${exp.userOrDetail || '—'}</td>
                  <td style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted);">${exp.email || '—'}</td>
                  <td>
                    <span class="currency-badge ${exp.currency}">${exp.currency} ${exp.amount}</span>
                  </td>
                  <td class="amount-display">${formatCurrency(bdtAmount, 'BDT')}</td>
                  <td>
                    <span style="font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 4px; background: rgba(255,255,255,0.05);">
                      ${exp.recurring}
                    </span>
                  </td>
                  ${isAdmin ? `
                    <td style="text-align: center;">
                      <button class="btn btn-secondary edit-exp-btn" data-id="${exp.id}" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;">Edit</button>
                      <button class="btn btn-danger delete-exp-btn" data-id="${exp.id}" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;">Del</button>
                    </td>
                  ` : ''}
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Render Yearly 12-Month Comparative Matrix
function renderYearlyReport(expenses) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return `
    <div class="glass-panel" style="padding: 1.5rem;">
      <div style="margin-bottom: 1.5rem;">
        <h2 style="font-size: 1.1rem; font-weight: 700;">Yearly 12-Month Expense Matrix (${state.currentYear})</h2>
        <p style="font-size: 0.85rem; color: var(--text-muted);">Estimated annual recurring budget allocation per company entity across all 12 calendar months.</p>
      </div>

      <div class="table-container">
        <table class="custom-table matrix-table">
          <thead>
            <tr>
              <th style="text-align: left;">Company / Entity</th>
              ${months.map(m => `<th>${m}</th>`).join('')}
              <th style="text-align: right; background: rgba(59, 130, 246, 0.1);">Annual Total</th>
            </tr>
          </thead>
          <tbody>
            ${state.companies.map(comp => {
              const compExps = expenses.filter(e => e.companyId === comp.id);
              let monthlySumBDT = 0;
              compExps.forEach(e => {
                const bdt = convertToBDT(e.amount, e.currency);
                monthlySumBDT += e.recurring === 'Monthly' ? bdt : (bdt / 12);
              });
              const annualSumBDT = monthlySumBDT * 12;

              return `
                <tr>
                  <td style="text-align: left;">
                    <div class="company-cell">
                      <img src="${comp.logo}" alt="${comp.code}" class="company-logo-img" onerror="this.style.display='none'">
                      <div>
                        <div>${comp.name}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal;">${comp.code}</div>
                      </div>
                    </div>
                  </td>
                  ${months.map(() => `<td style="font-family: var(--font-mono); font-size: 0.8rem;">${(monthlySumBDT / 1000).toFixed(1)}k</td>`).join('')}
                  <td style="text-align: right; font-weight: 800; font-family: var(--font-mono); color: var(--accent-emerald); background: rgba(16, 185, 129, 0.05);">
                    ${formatCurrency(annualSumBDT, 'BDT')}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Render Visual Analytics Area
function renderVisualAnalyticsArea() {
  return `
    <div class="charts-grid">
      <div class="chart-card glass-panel">
        <div class="chart-header">
          <span class="chart-title">Expense Distribution by Entity</span>
        </div>
        <div class="chart-canvas-container">
          <canvas id="company-doughnut-chart"></canvas>
        </div>
      </div>

      <div class="chart-card glass-panel">
        <div class="chart-header">
          <span class="chart-title">Category Breakdown</span>
        </div>
        <div class="chart-canvas-container">
          <canvas id="category-bar-chart"></canvas>
        </div>
      </div>
    </div>

    <div class="chart-card glass-panel">
      <div class="chart-header">
        <span class="chart-title">12-Month Expenditure Trend (Jan - Dec)</span>
      </div>
      <div class="chart-canvas-container" style="min-height: 250px;">
        <canvas id="yearly-line-chart"></canvas>
      </div>
    </div>
  `;
}

// Chart.js Visualizations Setup
function renderCharts() {
  const companyCanvas = document.getElementById("company-doughnut-chart");
  const categoryCanvas = document.getElementById("category-bar-chart");
  const yearlyCanvas = document.getElementById("yearly-line-chart");

  if (!companyCanvas || !categoryCanvas || !yearlyCanvas) return;

  // Cleanup old instances
  if (companyChartInstance) companyChartInstance.destroy();
  if (categoryChartInstance) categoryChartInstance.destroy();
  if (yearlyTrendChartInstance) yearlyTrendChartInstance.destroy();

  // Company Data
  const compLabels = state.companies.map(c => c.code);
  const compData = state.companies.map(c => {
    return state.expenses
      .filter(e => e.companyId === c.id)
      .reduce((acc, e) => acc + convertToBDT(e.amount, e.currency), 0);
  });

  companyChartInstance = new Chart(companyCanvas, {
    type: 'doughnut',
    data: {
      labels: compLabels,
      datasets: [{
        data: compData,
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: state.theme === 'dark' ? '#94a3b8' : '#334155' } }
      }
    }
  });

  // Category Data
  const catLabels = state.categories.map(c => c.name);
  const catData = state.categories.map(c => {
    return state.expenses
      .filter(e => e.categoryId === c.id)
      .reduce((acc, e) => acc + convertToBDT(e.amount, e.currency), 0);
  });

  categoryChartInstance = new Chart(categoryCanvas, {
    type: 'bar',
    data: {
      labels: catLabels,
      datasets: [{
        label: 'Expense (BDT)',
        data: catData,
        backgroundColor: state.categories.map(c => c.color || '#3b82f6'),
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: state.theme === 'dark' ? '#94a3b8' : '#334155' } },
        y: { ticks: { color: state.theme === 'dark' ? '#94a3b8' : '#334155' } }
      }
    }
  });

  // 12-Month Line Trend
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const totalMonthlyAvg = compData.reduce((a, b) => a + b, 0);
  const trendData = months.map(() => totalMonthlyAvg);

  yearlyTrendChartInstance = new Chart(yearlyCanvas, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Monthly Expense Trend (BDT)',
        data: trendData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: state.theme === 'dark' ? '#94a3b8' : '#334155' } },
        y: { ticks: { color: state.theme === 'dark' ? '#94a3b8' : '#334155' } }
      }
    }
  });
}

// Global Event Listeners
function setupGlobalListeners() {
  // Theme Toggle
  document.addEventListener("click", (e) => {
    if (e.target.closest("#toggle-theme-btn")) {
      applyTheme(state.theme === "dark" ? "light" : "dark");
      renderApp();
    }
  });

  // Modals Listeners
  setupAuthModalListeners();
  setupExpenseModalListeners();
  setupSettingsModalListeners();
  setupCloudModalListeners();
}

function attachAppEventListeners() {
  // Filters
  const compSelect = document.getElementById("filter-company-select");
  if (compSelect) {
    compSelect.addEventListener("change", (e) => {
      state.selectedCompanyFilter = e.target.value;
      renderApp();
    });
  }

  const monthInput = document.getElementById("filter-month-input");
  if (monthInput) {
    monthInput.addEventListener("change", (e) => {
      state.currentMonth = e.target.value;
      renderApp();
    });
  }

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.searchQuery = e.target.value;
      renderApp();
    });
  }

  // Tabs
  document.getElementById("tab-monthly")?.addEventListener("click", () => { state.activeTab = "monthly"; renderApp(); });
  document.getElementById("tab-yearly")?.addEventListener("click", () => { state.activeTab = "yearly"; renderApp(); });
  document.getElementById("tab-charts")?.addEventListener("click", () => { state.activeTab = "charts"; renderApp(); });

  // Actions
  document.getElementById("print-report-btn")?.addEventListener("click", () => window.print());

  // Edit / Delete Expenses
  document.querySelectorAll(".edit-exp-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const expId = e.target.getAttribute("data-id");
      openExpenseModal(expId);
    });
  });

  document.querySelectorAll(".delete-exp-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const expId = e.target.getAttribute("data-id");
      if (confirm("Are you sure you want to delete this expense record?")) {
        state.expenses = state.expenses.filter(x => x.id !== expId);
        commitStateChange();
      }
    });
  });

  document.getElementById("open-add-expense-btn")?.addEventListener("click", () => openExpenseModal(null));
  document.getElementById("open-settings-btn")?.addEventListener("click", () => openSettingsModal());
  document.getElementById("cloud-config-btn")?.addEventListener("click", () => openCloudModal());
}

/* Modal Handlers */
function setupAuthModalListeners() {
  const modal = document.getElementById("auth-modal");
  const form = document.getElementById("auth-form");
  const errorMsg = document.getElementById("auth-error-msg");

  document.addEventListener("click", (e) => {
    if (e.target.closest("#auth-login-btn")) {
      modal.classList.add("active");
    }
    if (e.target.closest("#auth-logout-btn")) {
      authService.logout();
      renderApp();
    }
    if (e.target.closest("#close-auth-modal") || e.target.closest("#cancel-auth-btn")) {
      modal.classList.remove("active");
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const pass = document.getElementById("admin-password-input").value;
    const res = authService.loginAdmin(pass);
    if (res.success) {
      modal.classList.remove("active");
      document.getElementById("admin-password-input").value = "";
      errorMsg.style.display = "none";
      renderApp();
    } else {
      errorMsg.textContent = res.message;
      errorMsg.style.display = "block";
    }
  });
}

// Expense Add/Edit Modal
function openExpenseModal(expId = null) {
  state.editingExpenseId = expId;
  const modal = document.getElementById("expense-modal");
  const title = document.getElementById("expense-modal-title");
  const compSelect = document.getElementById("expense-company-select");
  const catSelect = document.getElementById("expense-category-select");

  // Populate Company and Category dropdowns
  compSelect.innerHTML = state.companies.map(c => `<option value="${c.id}">${c.code} — ${c.name}</option>`).join('');
  catSelect.innerHTML = state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  if (expId) {
    const item = state.expenses.find(x => x.id === expId);
    if (item) {
      title.textContent = "Edit Expense Item";
      document.getElementById("expense-id-input").value = item.id;
      compSelect.value = item.companyId;
      catSelect.value = item.categoryId;
      document.getElementById("expense-title-input").value = item.title;
      document.getElementById("expense-user-input").value = item.userOrDetail || '';
      document.getElementById("expense-email-input").value = item.email || '';
      document.getElementById("expense-currency-select").value = item.currency;
      document.getElementById("expense-amount-input").value = item.amount;
      document.getElementById("expense-recurring-select").value = item.recurring;
      document.getElementById("expense-notes-input").value = item.notes || '';
    }
  } else {
    title.textContent = "Add Expense Item";
    document.getElementById("expense-form").reset();
    document.getElementById("expense-id-input").value = "";
  }

  modal.classList.add("active");
}

function setupExpenseModalListeners() {
  const modal = document.getElementById("expense-modal");
  const form = document.getElementById("expense-form");

  document.getElementById("close-expense-modal")?.addEventListener("click", () => modal.classList.remove("active"));
  document.getElementById("cancel-expense-btn")?.addEventListener("click", () => modal.classList.remove("active"));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("expense-id-input").value || `exp-${Date.now()}`;
    const newExp = {
      id,
      companyId: document.getElementById("expense-company-select").value,
      categoryId: document.getElementById("expense-category-select").value,
      title: document.getElementById("expense-title-input").value,
      userOrDetail: document.getElementById("expense-user-input").value,
      email: document.getElementById("expense-email-input").value,
      currency: document.getElementById("expense-currency-select").value,
      amount: parseFloat(document.getElementById("expense-amount-input").value) || 0,
      recurring: document.getElementById("expense-recurring-select").value,
      notes: document.getElementById("expense-notes-input").value
    };

    const existingIdx = state.expenses.findIndex(x => x.id === id);
    if (existingIdx >= 0) {
      state.expenses[existingIdx] = newExp;
    } else {
      state.expenses.unshift(newExp);
    }

    modal.classList.remove("active");
    commitStateChange();
  });
}

// Settings Modal (Entity & Category Manager)
function openSettingsModal() {
  const modal = document.getElementById("settings-modal");
  renderSettingsPanels();
  modal.classList.add("active");
}

function renderSettingsPanels() {
  // Companies list
  const compContainer = document.getElementById("companies-list-container");
  compContainer.innerHTML = `
    <table class="custom-table" style="font-size: 0.8rem;">
      <thead><tr><th>Code</th><th>Name</th><th>Logo</th><th>Action</th></tr></thead>
      <tbody>
        ${state.companies.map(c => `
          <tr>
            <td><strong>${c.code}</strong></td>
            <td>${c.name}</td>
            <td><img src="${c.logo}" style="height: 20px;" onerror="this.style.display='none'"></td>
            <td><button class="btn btn-danger del-comp-btn" data-id="${c.id}" style="padding: 0.2rem 0.5rem; font-size: 0.7rem;">Delete</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  // Categories list
  const catContainer = document.getElementById("categories-list-container");
  catContainer.innerHTML = `
    <table class="custom-table" style="font-size: 0.8rem;">
      <thead><tr><th>Category Name</th><th>Color</th><th>Action</th></tr></thead>
      <tbody>
        ${state.categories.map(c => `
          <tr>
            <td>${c.name}</td>
            <td><span style="display: inline-block; width: 16px; height: 16px; border-radius: 50%; background: ${c.color};"></span></td>
            <td><button class="btn btn-danger del-cat-btn" data-id="${c.id}" style="padding: 0.2rem 0.5rem; font-size: 0.7rem;">Delete</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  // Exchange Rates Inputs
  document.getElementById("usd-rate-input").value = state.exchangeRates.USD_TO_BDT;
  document.getElementById("eur-rate-input").value = state.exchangeRates.EUR_TO_BDT;
}

function setupSettingsModalListeners() {
  const modal = document.getElementById("settings-modal");
  document.getElementById("close-settings-modal")?.addEventListener("click", () => modal.classList.remove("active"));

  // Tab Switching inside manager modal
  const tabComp = document.getElementById("mgr-tab-companies");
  const tabCat = document.getElementById("mgr-tab-categories");
  const tabRates = document.getElementById("mgr-tab-rates");

  const panelComp = document.getElementById("mgr-panel-companies");
  const panelCat = document.getElementById("mgr-panel-categories");
  const panelRates = document.getElementById("mgr-panel-rates");

  tabComp?.addEventListener("click", () => {
    tabComp.classList.add("active"); tabCat.classList.remove("active"); tabRates.classList.remove("active");
    panelComp.style.display = "block"; panelCat.style.display = "none"; panelRates.style.display = "none";
  });

  tabCat?.addEventListener("click", () => {
    tabCat.classList.add("active"); tabComp.classList.remove("active"); tabRates.classList.remove("active");
    panelCat.style.display = "block"; panelComp.style.display = "none"; panelRates.style.display = "none";
  });

  tabRates?.addEventListener("click", () => {
    tabRates.classList.add("active"); tabComp.classList.remove("active"); tabCat.classList.remove("active");
    panelRates.style.display = "block"; panelComp.style.display = "none"; panelCat.style.display = "none";
  });

  // Add Company Form
  document.getElementById("add-company-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const code = document.getElementById("new-comp-code").value.toUpperCase();
    const name = document.getElementById("new-comp-name").value;
    const logo = document.getElementById("new-comp-logo").value || "/assets/IMS.png";

    const id = code.toLowerCase().replace(/[^a-z0-9]/g, '');
    state.companies.push({ id, code, name, logo, accentColor: "#3b82f6" });
    commitStateChange();
    renderSettingsPanels();
    document.getElementById("add-company-form").reset();
  });

  // Add Category Form
  document.getElementById("add-category-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("new-cat-name").value;
    const color = document.getElementById("new-cat-color").value;

    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    state.categories.push({ id, name, color, icon: "folder" });
    commitStateChange();
    renderSettingsPanels();
    document.getElementById("add-category-form").reset();
  });

  // Delete Company / Category handlers
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("del-comp-btn")) {
      const id = e.target.getAttribute("data-id");
      if (confirm("Delete this company entity?")) {
        state.companies = state.companies.filter(c => c.id !== id);
        commitStateChange();
        renderSettingsPanels();
      }
    }
    if (e.target.classList.contains("del-cat-btn")) {
      const id = e.target.getAttribute("data-id");
      if (confirm("Delete this expense category?")) {
        state.categories = state.categories.filter(c => c.id !== id);
        commitStateChange();
        renderSettingsPanels();
      }
    }
  });

  // Exchange Rates Form
  document.getElementById("update-rates-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    state.exchangeRates.USD_TO_BDT = parseFloat(document.getElementById("usd-rate-input").value) || 122.5;
    state.exchangeRates.EUR_TO_BDT = parseFloat(document.getElementById("eur-rate-input").value) || 135.0;
    commitStateChange();
    alert("Exchange rates updated successfully!");
    modal.classList.remove("active");
  });
}

// Cloud Backup Modal Handlers
function setupCloudModalListeners() {
  const modal = document.getElementById("cloud-modal");
  document.getElementById("close-cloud-modal")?.addEventListener("click", () => modal.classList.remove("active"));

  document.getElementById("export-json-btn")?.addEventListener("click", () => {
    cloudService.exportJSON({
      companies: state.companies,
      categories: state.categories,
      expenses: state.expenses,
      exchangeRates: state.exchangeRates
    });
  });

  const fileInput = document.getElementById("json-file-input");
  document.getElementById("import-json-btn")?.addEventListener("click", () => fileInput.click());

  fileInput?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = cloudService.importJSON(event.target.result);
          state = { ...state, ...importedData };
          alert("Database snapshot restored successfully!");
          modal.classList.remove("active");
          renderApp();
        } catch (err) {
          alert(`Import Error: ${err.message}`);
        }
      };
      reader.readAsText(file);
    }
  });
}

function openCloudModal() {
  const modal = document.getElementById("cloud-modal");
  const cfg = cloudService.getCloudConfig();
  document.getElementById("cloud-endpoint-input").value = cfg.endpoint || '';
  document.getElementById("cloud-key-input").value = cfg.apiKey || '';
  modal.classList.add("active");
}
