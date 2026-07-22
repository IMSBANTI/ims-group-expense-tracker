// ==========================================================================
// APP STATE & BRANDING CONFIG
// ==========================================================================
const ENTITY_CONFIG = {
  'IMS': {
    fullName: "Integrated Marketing Service Ltd.",
    logo: "/assets/ims_logo.png",
    color: "#ef4444", // Red
    class: "badge-entity-ims",
    glowClass: "ims-glow"
  },
  'CLAN': {
    fullName: "Country's Largest Audience Network",
    logo: "/assets/clan_logo.png",
    color: "#f97316", // Orange
    class: "badge-entity-clan",
    glowClass: "clan-glow"
  },
  'SCL': {
    fullName: "Sales Connect Ltd",
    logo: "/assets/scl_logo.png",
    color: "#881337", // Burgundy
    class: "badge-entity-scl",
    glowClass: "scl-glow"
  },
  'TP': {
    fullName: "Trade Pulse",
    logo: "/assets/tp_logo.png",
    color: "#059669", // Teal/Green
    class: "badge-entity-tp",
    glowClass: "tp-glow"
  }
};

let expenses = [];
let settings = { usd_to_bdt: 120, eur_to_bdt: 130 };
let activeEntityFilter = 'all';
let viewMode = 'monthly'; // 'monthly' or 'daily'
let activeMonth = new Date().toISOString().substring(0, 7); // e.g. "2026-07"
const isReadOnly = false; // Set to false to enable full live editing on Render.com

// Config for cross-origin hosting (e.g. Netlify). Set to your Render URL.
const API_URL = ""; 
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? ''
  : API_URL;

// Chart instances
let entityChart = null;
let categoryChart = null;

// ==========================================================================
// INITIALIZATION
// ==========================================================================
let customCategoriesList = ["Monthly AI", "Software", "Internet", "Mail"];
let customEntitiesList = [
  { code: "IMS", fullName: "Integrated Marketing Service Ltd.", color: "#ef4444", logo: "/assets/ims_logo.png" },
  { code: "CLAN", fullName: "Country's Largest Audience Network", color: "#f97316", logo: "/assets/clan_logo.png" },
  { code: "SCL", fullName: "Sales Connect Ltd", color: "#881337", logo: "/assets/scl_logo.png" },
  { code: "TP", fullName: "Trade Pulse", color: "#059669", logo: "/assets/tp_logo.png" }
];

document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  applyTheme(savedTheme);

  initNavigation();
  fetchSettings();
  fetchCategories();
  fetchEntities();
  fetchExpenses().then(() => {
    applyReadOnlyUI();
  });

  // Set default billing month to current month
  const today = new Date();
  const monthStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
  
  const dashMonthInput = document.getElementById('dashboard-month-picker');
  if (dashMonthInput) dashMonthInput.value = monthStr;
  
  const reportMonthInput = document.getElementById('report-month');
  if (reportMonthInput) reportMonthInput.value = monthStr;

  updateActiveBillingMonth(monthStr, false);
});

function updateActiveBillingMonth(yearMonthStr, showToastNotice = true) {
  if (!yearMonthStr) return;
  
  const isMonthChange = (activeMonth !== yearMonthStr);
  activeMonth = yearMonthStr;

  const [year, month] = yearMonthStr.split('-');
  const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
  const formattedMonth = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  
  // Update dashboard banner text
  const activeTextEl = document.getElementById('active-month-text');
  if (activeTextEl) activeTextEl.textContent = formattedMonth;
  
  // Keep dashboard and report generator month pickers in sync
  const dashMonthInput = document.getElementById('dashboard-month-picker');
  if (dashMonthInput && dashMonthInput.value !== yearMonthStr) {
    dashMonthInput.value = yearMonthStr;
  }

  const reportMonthInput = document.getElementById('report-month');
  if (reportMonthInput && reportMonthInput.value !== yearMonthStr) {
    reportMonthInput.value = yearMonthStr;
  }
  
  if (isMonthChange) {
    fetchExpenses();
  }

  if (showToastNotice) {
    showToast(`Active expense period set to ${formattedMonth}`, 'info');
  }
}

function applyReadOnlyUI() {
  if (isReadOnly) {
    // Hide "Add Item" button
    const addBtn = document.getElementById('add-expense-btn');
    if (addBtn) addBtn.style.display = 'none';

    // Hide edit/delete actions column in table headers
    const ths = document.querySelectorAll('#expenses-table th');
    if (ths.length >= 10) {
      ths[9].style.display = 'none'; // 10th th (Actions) is index 9
    }
    
    // Hide settings gear button in header
    const settingsBtns = document.querySelectorAll('.settings-trigger-btn');
    settingsBtns.forEach(btn => {
      if (btn.getAttribute('onclick') === 'openSettingsModal()') {
        btn.style.display = 'none';
      }
    });

    // Add a notice below the toolbar that editing is disabled
    const toolbar = document.querySelector('.toolbar');
    if (toolbar && !document.getElementById('readonly-notice')) {
      const notice = document.createElement('div');
      notice.id = 'readonly-notice';
      notice.className = 'glass-panel';
      notice.style.gridColumn = '1 / -1';
      notice.style.padding = '0.75rem 1rem';
      notice.style.fontSize = '0.85rem';
      notice.style.color = 'var(--text-muted)';
      notice.style.border = '1px dashed var(--border-glass)';
      notice.style.borderRadius = '8px';
      notice.style.textAlign = 'center';
      notice.style.marginTop = '1rem';
      notice.innerHTML = `ℹ️ <strong>Read-Only Web View:</strong> Live adding or editing is disabled online. Run this app locally on your laptop to modify subscriptions, then push changes to GitHub.`;
      toolbar.parentNode.insertBefore(notice, toolbar.nextSibling);
    }
  }
}

// Navigation logic
function initNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  const sections = document.querySelectorAll('.tab-content');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      
      navBtns.forEach(b => b.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));

      btn.classList.add('active');
      const targetSection = document.getElementById(targetId);
      targetSection.classList.add('active');

      // Re-render charts when switching to dashboard to resolve sizing issues
      if (targetId === 'dashboard-section') {
        renderCharts();
      }
    });
  });

  // Entity filter tabs
  const filterTabs = document.querySelectorAll('.filter-tab');
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeEntityFilter = tab.getAttribute('data-filter');
      filterTable();
    });
  });
}

// ==========================================================================
// API CLIENT CALLS
// ==========================================================================
async function fetchSettings() {
  if (isReadOnly) return; // Loaded via fetchExpenses
  try {
    const res = await fetch(`${API_BASE}/api/settings`);
    if (!res.ok) throw new Error("Failed to load settings");
    settings = await res.json();
    updateSettingsDisplay();
  } catch (err) {
    showToast("Error fetching exchange rates", "error");
    console.error(err);
  }
}

async function fetchExpenses() {
  try {
    if (isReadOnly) {
      const res = await fetch('db.json');
      if (!res.ok) throw new Error("Failed to load static database file");
      const data = await res.json();
      if (data.monthlyData && data.monthlyData[activeMonth]) {
        expenses = data.monthlyData[activeMonth];
      } else if (data.monthlyData) {
        const months = Object.keys(data.monthlyData).sort();
        if (months.length > 0) {
          expenses = data.monthlyData[months[months.length - 1]];
        } else {
          expenses = data.expenses || [];
        }
      } else {
        expenses = data.expenses || [];
      }
      settings = data.settings || { usd_to_bdt: 120, eur_to_bdt: 130 };
      updateSettingsDisplay();
    } else {
      const res = await fetch(`${API_BASE}/api/expenses?month=${activeMonth}`);
      if (!res.ok) throw new Error("Failed to load expenses");
      expenses = await res.json();
    }
    calculateMetrics();
    populateTable();
    renderCharts();
  } catch (err) {
    showToast("Error fetching expenses data", "error");
    console.error(err);
  }
}

async function saveSettings(e) {
  e.preventDefault();
  const rateUSD = parseFloat(document.getElementById('rate-usd').value);
  const rateEUR = parseFloat(document.getElementById('rate-eur').value);

  if (isNaN(rateUSD) || isNaN(rateEUR)) {
    showToast("Invalid rates provided", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usd_to_bdt: rateUSD, eur_to_bdt: rateEUR })
    });

    if (!res.ok) throw new Error("Failed to save settings");
    const data = await res.json();
    settings = data.settings;
    updateSettingsDisplay();
    closeSettingsModal();
    showToast("Exchange rates updated successfully", "success");
    
    // Recalculate and refresh UI
    calculateMetrics();
    populateTable();
    renderCharts();
  } catch (err) {
    showToast("Error updating settings", "error");
    console.error(err);
  }
}

// ==========================================================================
// CALCULATION & METRICS
// ==========================================================================
function getMonthlyCost(exp) {
  let baseMonthly = parseFloat(exp.price || 0);
  if (exp.billingFrequency === 'yearly') {
    baseMonthly = baseMonthly / 12;
  }
  
  let extraMonthly = parseFloat(exp.extraCreditCost || 0);
  if (exp.extraBillingFrequency === 'yearly') {
    extraMonthly = extraMonthly / 12;
  }
  
  return {
    base: baseMonthly,
    extra: extraMonthly,
    total: baseMonthly + extraMonthly
  };
}

function getBDTValue(exp) {
  const monthly = getMonthlyCost(exp);
  let totalOriginal = monthly.total;
  
  if (viewMode === 'daily') {
    totalOriginal = totalOriginal / 30.0;
  } else if (viewMode === 'yearly') {
    totalOriginal = totalOriginal * 12.0;
  }

  if (exp.currency === 'USD') {
    return totalOriginal * settings.usd_to_bdt;
  } else if (exp.currency === 'EUR') {
    return totalOriginal * settings.eur_to_bdt;
  } else {
    return totalOriginal; // BDT
  }
}

function updateSettingsDisplay() {
  document.getElementById('usd-rate-text').textContent = settings.usd_to_bdt;
  document.getElementById('eur-rate-text').textContent = settings.eur_to_bdt;
  document.getElementById('rate-usd').value = settings.usd_to_bdt;
  document.getElementById('rate-eur').value = settings.eur_to_bdt;
}

function calculateMetrics() {
  let totalBDT = 0;
  let totalUSD = 0;
  let totalEUR = 0;
  let nativeBDT = 0;

  expenses.forEach(exp => {
    const monthly = getMonthlyCost(exp);
    let itemTotal = monthly.total;
    if (viewMode === 'daily') {
      itemTotal = itemTotal / 30.0;
    } else if (viewMode === 'yearly') {
      itemTotal = itemTotal * 12.0;
    }

    if (exp.currency === 'USD') {
      totalUSD += itemTotal;
      totalBDT += itemTotal * settings.usd_to_bdt;
    } else if (exp.currency === 'EUR') {
      totalEUR += itemTotal;
      totalBDT += itemTotal * settings.eur_to_bdt;
    } else {
      nativeBDT += itemTotal;
      totalBDT += itemTotal;
    }
  });

  // Update Metric Cards
  document.getElementById('metric-total-bdt').innerHTML = `${Math.round(totalBDT).toLocaleString()} <span class="currency-unit">TK</span>`;
  document.getElementById('metric-total-usd').textContent = `$${totalUSD.toFixed(2)}`;
  document.getElementById('metric-total-usd-converted').textContent = `${Math.round(totalUSD * settings.usd_to_bdt).toLocaleString()} TK equiv.`;
  document.getElementById('metric-total-eur').textContent = `€${totalEUR.toFixed(2)}`;
  document.getElementById('metric-total-eur-converted').textContent = `${Math.round(totalEUR * settings.eur_to_bdt).toLocaleString()} TK equiv.`;
  document.getElementById('metric-native-bdt').textContent = `${Math.round(nativeBDT).toLocaleString()} TK`;

  // Update Card Labels dynamically based on viewMode
  const suffix = viewMode === 'daily' ? ' (Daily)' : (viewMode === 'yearly' ? ' (Yearly)' : ' (Monthly)');
  document.querySelector('.main-metric .metric-label').textContent = `Total${suffix} Expenses (BDT)`;
  document.querySelectorAll('.metric-card')[1].querySelector('.metric-label').textContent = `USD Expense Portion${suffix}`;
  document.querySelectorAll('.metric-card')[2].querySelector('.metric-label').textContent = `EUR Expense Portion${suffix}`;
  document.querySelectorAll('.metric-card')[3].querySelector('.metric-label').textContent = `Native BDT Expenses${suffix}`;

  // Apply visual glow based on filtered entity
  const mainCard = document.querySelector('.metric-card.main-metric');
  if (mainCard) {
    mainCard.classList.remove('ims-glow', 'clan-glow', 'scl-glow', 'tp-glow');
    if (activeEntityFilter !== 'all') {
      const glow = ENTITY_CONFIG[activeEntityFilter]?.glowClass;
      if (glow) mainCard.classList.add(glow);
    }
  }
}

function changeViewMode(mode) {
  if (viewMode === mode) return;
  viewMode = mode;

  // Update toggle buttons classes
  const btnMonthly = document.getElementById('toggle-monthly');
  const btnDaily = document.getElementById('toggle-daily');
  const btnYearly = document.getElementById('toggle-yearly');

  btnMonthly.classList.remove('active');
  btnDaily.classList.remove('active');
  if (btnYearly) btnYearly.classList.remove('active');
  
  if (mode === 'monthly') {
    btnMonthly.classList.add('active');
  } else if (mode === 'daily') {
    btnDaily.classList.add('active');
  } else if (mode === 'yearly') {
    if (btnYearly) btnYearly.classList.add('active');
  }

  // Reload views
  calculateMetrics();
  populateTable();
  renderCharts();
  showToast(`Switched dashboard to ${mode} basis`, "info");
}

// ==========================================================================
// THEME SWITCHING (DAY / DARK MODE)
// ==========================================================================
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);

  // Update theme toggle icons
  const iconDark = document.getElementById('theme-icon-dark');
  const iconLight = document.getElementById('theme-icon-light');

  if (iconDark && iconLight) {
    if (theme === 'dark') {
      iconDark.classList.remove('hidden');
      iconLight.classList.add('hidden');
    } else {
      iconDark.classList.add('hidden');
      iconLight.classList.remove('hidden');
    }
  }

  // Redraw charts with correct theme colors
  renderCharts();
}

// ==========================================================================
// RENDER TABLE DATA
// ==========================================================================
function populateTable() {
  const tbody = document.getElementById('expenses-tbody');
  tbody.innerHTML = '';

  expenses.forEach(exp => {
    const tr = document.createElement('tr');
    tr.setAttribute('data-id', exp.id);
    tr.setAttribute('data-entity', exp.entity);
    tr.setAttribute('data-category', exp.category);
    
    const costBDT = getBDTValue(exp);
    let costSuffix = " TK";
    if (viewMode === 'daily') costSuffix = " TK/day";
    else if (viewMode === 'yearly') costSuffix = " TK/yr";
    const formattedCostBDT = Math.round(costBDT).toLocaleString() + costSuffix;
    
    const monthly = getMonthlyCost(exp);
    let scale = 1.0;
    let unitSuffix = "/mo";
    if (viewMode === 'daily') {
      scale = 1.0 / 30.0;
      unitSuffix = "/day";
    } else if (viewMode === 'yearly') {
      scale = 12.0;
      unitSuffix = "/yr";
    }
    
    let originalCostStr = "";
    if (exp.currency === 'USD') {
      if (exp.billingFrequency === 'yearly' && viewMode !== 'yearly') {
        originalCostStr = `$${(monthly.base * scale).toFixed(2)}${unitSuffix}<br><span style="font-size:0.75rem; color:var(--text-muted);">($${exp.price.toFixed(2)}/yr)</span>`;
      } else if (exp.billingFrequency === 'monthly' && viewMode === 'yearly') {
        originalCostStr = `$${(monthly.base * scale).toFixed(2)}${unitSuffix}<br><span style="font-size:0.75rem; color:var(--text-muted);">($${exp.price.toFixed(2)}/mo)</span>`;
      } else {
        originalCostStr = `$${(monthly.base * scale).toFixed(2)}${unitSuffix}`;
      }
    } else if (exp.currency === 'EUR') {
      if (exp.billingFrequency === 'yearly' && viewMode !== 'yearly') {
        originalCostStr = `€${(monthly.base * scale).toFixed(2)}${unitSuffix}<br><span style="font-size:0.75rem; color:var(--text-muted);">(€${exp.price.toFixed(2)}/yr)</span>`;
      } else if (exp.billingFrequency === 'monthly' && viewMode === 'yearly') {
        originalCostStr = `€${(monthly.base * scale).toFixed(2)}${unitSuffix}<br><span style="font-size:0.75rem; color:var(--text-muted);">(€${exp.price.toFixed(2)}/mo)</span>`;
      } else {
        originalCostStr = `€${(monthly.base * scale).toFixed(2)}${unitSuffix}`;
      }
    } else {
      if (exp.billingFrequency === 'yearly' && viewMode !== 'yearly') {
        originalCostStr = `${Math.round(monthly.base * scale).toLocaleString()} TK${unitSuffix}<br><span style="font-size:0.75rem; color:var(--text-muted);">(${exp.price.toLocaleString()} TK/yr)</span>`;
      } else if (exp.billingFrequency === 'monthly' && viewMode === 'yearly') {
        originalCostStr = `${Math.round(monthly.base * scale).toLocaleString()} TK${unitSuffix}<br><span style="font-size:0.75rem; color:var(--text-muted);">(${exp.price.toLocaleString()} TK/mo)</span>`;
      } else {
        originalCostStr = `${Math.round(monthly.base * scale).toLocaleString()} TK${unitSuffix}`;
      }
    }

    let extraCostStr = "-";
    if (exp.extraCreditCost > 0) {
      if (exp.currency === 'USD') {
        if (exp.extraBillingFrequency === 'yearly' && viewMode !== 'yearly') {
          extraCostStr = `+$${(monthly.extra * scale).toFixed(2)}${unitSuffix}<br><span style="font-size:0.75rem; color:var(--text-muted);">($${exp.extraCreditCost.toFixed(2)}/yr)</span>`;
        } else if (exp.extraBillingFrequency === 'monthly' && viewMode === 'yearly') {
          extraCostStr = `+$${(monthly.extra * scale).toFixed(2)}${unitSuffix}<br><span style="font-size:0.75rem; color:var(--text-muted);">($${exp.extraCreditCost.toFixed(2)}/mo)</span>`;
        } else {
          extraCostStr = `+$${(monthly.extra * scale).toFixed(2)}${unitSuffix}`;
        }
      } else if (exp.currency === 'EUR') {
        if (exp.extraBillingFrequency === 'yearly' && viewMode !== 'yearly') {
          extraCostStr = `+€${(monthly.extra * scale).toFixed(2)}${unitSuffix}<br><span style="font-size:0.75rem; color:var(--text-muted);">(€${exp.extraCreditCost.toFixed(2)}/yr)</span>`;
        } else if (exp.extraBillingFrequency === 'monthly' && viewMode === 'yearly') {
          extraCostStr = `+€${(monthly.extra * scale).toFixed(2)}${unitSuffix}<br><span style="font-size:0.75rem; color:var(--text-muted);">(€${exp.extraCreditCost.toFixed(2)}/mo)</span>`;
        } else {
          extraCostStr = `+€${(monthly.extra * scale).toFixed(2)}${unitSuffix}`;
        }
      } else {
        if (exp.extraBillingFrequency === 'yearly' && viewMode !== 'yearly') {
          extraCostStr = `+${Math.round(monthly.extra * scale).toLocaleString()} TK${unitSuffix}<br><span style="font-size:0.75rem; color:var(--text-muted);">(${exp.extraCreditCost.toLocaleString()} TK/yr)</span>`;
        } else if (exp.extraBillingFrequency === 'monthly' && viewMode === 'yearly') {
          extraCostStr = `+${Math.round(monthly.extra * scale).toLocaleString()} TK${unitSuffix}<br><span style="font-size:0.75rem; color:var(--text-muted);">(${exp.extraCreditCost.toLocaleString()} TK/mo)</span>`;
        } else {
          extraCostStr = `+${Math.round(monthly.extra * scale).toLocaleString()} TK${unitSuffix}`;
        }
      }
    }

    const config = ENTITY_CONFIG[exp.entity] || { fullName: exp.entity, logo: '', color: '#94a3b8', class: 'badge-secondary' };
    let entityLogoHTML = '';
    if (config.logo) {
      entityLogoHTML = `
        <div class="entity-cell-content" title="${config.fullName}">
          <div class="entity-logo-container">
            <img src="${config.logo}" class="entity-logo-img" alt="${exp.entity}">
          </div>
        </div>
      `;
    } else {
      entityLogoHTML = `<span class="badge ${config.class}">${exp.entity}</span>`;
    }

    let actionsHTML = '';
    if (!isReadOnly) {
      actionsHTML = `
        <td>
          <div class="action-buttons">
            <button class="btn-icon edit-btn" onclick="editExpense('${exp.id}')" title="Edit Item">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-icon delete-btn" onclick="deleteExpense('${exp.id}')" title="Delete Item">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      `;
    }

    let userSeatBadge = '';
    if (exp.isPerUser && exp.userCount > 0) {
      const symbol = exp.currency === 'USD' ? '$' : (exp.currency === 'EUR' ? '€' : '');
      userSeatBadge = `<br><span style="font-size:0.75rem; color:var(--color-primary); font-weight:600;">(${exp.userCount} Seats @ ${symbol}${exp.costPerUser}/user)</span>`;
    }

    tr.innerHTML = `
      <td>${entityLogoHTML}</td>
      <td><span class="badge badge-category">${exp.category}</span></td>
      <td class="font-weight-bold">${escapeHTML(exp.name)}${userSeatBadge}</td>
      <td class="text-email">${exp.email ? escapeHTML(exp.email) : '-'}</td>
      <td><span class="price-bold">${originalCostStr}</span> <span class="badge-currency">${exp.currency}</span></td>
      <td class="text-muted font-size-xs">${extraCostStr}</td>
      <td class="price-bold text-accent">${formattedCostBDT}</td>
      <td class="text-secondary">${escapeHTML(exp.dueDate || 'Monthly')}</td>
      <td class="text-muted" style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHTML(exp.details || '')}">
        ${escapeHTML(exp.details || '-')}
      </td>
      ${actionsHTML}
    `;
    tbody.appendChild(tr);
  });

  filterTable();
}

function filterTable() {
  const searchQuery = document.getElementById('table-search').value.toLowerCase();
  const categoryFilter = document.getElementById('category-filter').value;
  const rows = document.querySelectorAll('#expenses-tbody tr');
  let matchCount = 0;

  rows.forEach(row => {
    const id = row.getAttribute('data-id');
    const exp = expenses.find(e => e.id === id);
    if (!exp) return;

    const matchesSearch = 
      exp.name.toLowerCase().includes(searchQuery) ||
      (exp.email && exp.email.toLowerCase().includes(searchQuery)) ||
      (exp.details && exp.details.toLowerCase().includes(searchQuery));

    const matchesEntity = (activeEntityFilter === 'all' || exp.entity === activeEntityFilter);
    const matchesCategory = (categoryFilter === 'all' || exp.category === categoryFilter);

    if (matchesSearch && matchesEntity && matchesCategory) {
      row.classList.remove('hidden');
      matchCount++;
    } else {
      row.classList.add('hidden');
    }
  });

  const emptyState = document.getElementById('no-records');
  if (matchCount === 0) {
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');
  }
}

// ==========================================================================
// RENDER CHARTS
// ==========================================================================
function renderCharts() {
  if (!expenses.length) return;

  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const textColor = currentTheme === 'light' ? '#475569' : '#f8fafc';
  const gridColor = currentTheme === 'light' ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.05)';

  // Aggregate Data
  const entityTotals = {};
  const categoryTotals = {};

  expenses.forEach(exp => {
    const costBDT = getBDTValue(exp);

    // Entity wise
    entityTotals[exp.entity] = (entityTotals[exp.entity] || 0) + costBDT;

    // Category wise
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + costBDT;
  });

  // 1. Entity Chart (Doughnut)
  const entityLabels = Object.keys(entityTotals);
  const entityData = Object.values(entityTotals);
  
  // Map entity names to their branding colors
  const entityColors = entityLabels.map(label => ENTITY_CONFIG[label]?.color || '#94a3b8');
  
  if (entityChart) entityChart.destroy();
  
  const ctxEntity = document.getElementById('entityChart').getContext('2d');
  entityChart = new Chart(ctxEntity, {
    type: 'doughnut',
    data: {
      labels: entityLabels,
      datasets: [{
        data: entityData,
        backgroundColor: entityColors,
        borderWidth: 1,
        borderColor: currentTheme === 'light' ? '#ffffff' : '#111a33'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: textColor, font: { family: 'Inter', weight: 600 } }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return ` ${context.label}: ${Math.round(context.raw).toLocaleString()} TK`;
            }
          }
        }
      }
    }
  });

  // 2. Category Chart (Bar Chart with Entity Breakdown Stacking)
  const categoryLabels = Object.keys(categoryTotals);
  
  // Get all unique entities present in current expenses
  const entitiesList = [...new Set(expenses.map(e => e.entity))];
  
  // Build a dataset for each entity representing its spending in each category
  const categoryDatasets = entitiesList.map(ent => {
    const config = ENTITY_CONFIG[ent] || { fullName: ent, color: '#94a3b8' };
    return {
      label: ent,
      data: categoryLabels.map(cat => {
        let sum = 0;
        expenses.forEach(exp => {
          // Keep charts in sync with active search filters
          const searchInput = document.getElementById('table-search');
          const searchQuery = searchInput ? searchInput.value.toLowerCase() : '';
          
          const matchesSearch = 
            exp.name.toLowerCase().includes(searchQuery) ||
            (exp.email && exp.email.toLowerCase().includes(searchQuery)) ||
            (exp.details && exp.details.toLowerCase().includes(searchQuery));

          const matchesEntity = (activeEntityFilter === 'all' || exp.entity === activeEntityFilter);
          
          const catFilter = document.getElementById('category-filter');
          const categoryFilter = catFilter ? catFilter.value : 'all';
          const matchesCategory = (categoryFilter === 'all' || exp.category === categoryFilter);

          if (matchesSearch && matchesEntity && matchesCategory) {
            if (exp.entity === ent && exp.category === cat) {
              sum += getBDTValue(exp);
            }
          }
        });
        return sum;
      }),
      backgroundColor: config.color,
      borderColor: config.color,
      borderWidth: 0,
      borderRadius: 4
    };
  });

  if (categoryChart) categoryChart.destroy();

  const ctxCategory = document.getElementById('categoryChart').getContext('2d');
  categoryChart = new Chart(ctxCategory, {
    type: 'bar',
    data: {
      labels: categoryLabels,
      datasets: categoryDatasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          ticks: { color: textColor, font: { family: 'Inter', weight: 500 } },
          grid: { color: gridColor }
        },
        y: {
          stacked: true,
          ticks: { 
            color: textColor, 
            font: { family: 'Inter' },
            callback: value => Math.round(value).toLocaleString() + ' TK'
          },
          grid: { color: gridColor }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { color: textColor, font: { family: 'Inter', weight: 600 } }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return ` ${context.dataset.label}: ${Math.round(context.raw).toLocaleString()} TK`;
            }
          }
        }
      }
    }
  });
}

// ==========================================================================
// CRUD OPERATIONS (FORMS & ACTIONS)
// ==========================================================================
function toggleSeatCalculator() {
  const isChecked = document.getElementById('field-is-per-user').checked;
  const container = document.getElementById('seat-calc-inputs');
  if (isChecked) {
    container.classList.remove('hidden');
    calculateSeatTotal();
  } else {
    container.classList.add('hidden');
  }
}

function calculateSeatTotal() {
  const isChecked = document.getElementById('field-is-per-user').checked;
  if (!isChecked) return;

  const count = parseFloat(document.getElementById('field-user-count').value || 0);
  const cost = parseFloat(document.getElementById('field-cost-per-user').value || 0);

  if (count > 0 && cost > 0) {
    const total = count * cost;
    document.getElementById('field-price').value = Math.round(total * 100) / 100;
  }
}

function openExpenseModal(editId = null) {
  const modal = document.getElementById('expense-modal');
  const form = document.getElementById('expense-form');
  const title = document.getElementById('modal-title');
  const saveBtn = document.getElementById('modal-save-btn');

  form.reset();
  document.getElementById('field-id').value = '';
  document.getElementById('field-is-per-user').checked = false;
  document.getElementById('field-user-count').value = '';
  document.getElementById('field-cost-per-user').value = '';
  document.getElementById('seat-calc-inputs').classList.add('hidden');

  if (editId) {
    const exp = expenses.find(e => e.id === editId);
    if (!exp) return;
    
    title.textContent = "Edit Subscription Item";
    saveBtn.textContent = "Update Expense";
    
    document.getElementById('field-id').value = exp.id;
    document.getElementById('field-entity').value = exp.entity;
    document.getElementById('field-category').value = exp.category;
    document.getElementById('field-name').value = exp.name;
    document.getElementById('field-email').value = exp.email;
    document.getElementById('field-price').value = exp.price;
    document.getElementById('field-currency').value = exp.currency;
    document.getElementById('field-extra-cost').value = exp.extraCreditCost || 0;
    document.getElementById('field-due-date').value = exp.dueDate || '';
    document.getElementById('field-details').value = exp.details || '';
    document.getElementById('field-billing-frequency').value = exp.billingFrequency || 'monthly';
    document.getElementById('field-extra-billing-frequency').value = exp.extraBillingFrequency || 'monthly';

    if (exp.isPerUser) {
      document.getElementById('field-is-per-user').checked = true;
      document.getElementById('field-user-count').value = exp.userCount || '';
      document.getElementById('field-cost-per-user').value = exp.costPerUser || '';
      document.getElementById('seat-calc-inputs').classList.remove('hidden');
    }
  } else {
    title.textContent = "Add Subscription / Expense Item";
    saveBtn.textContent = "Register Expense";
    document.getElementById('field-billing-frequency').value = 'monthly';
    document.getElementById('field-extra-billing-frequency').value = 'monthly';
  }

  modal.classList.add('active');
}

function closeExpenseModal() {
  document.getElementById('expense-modal').classList.remove('active');
}

async function saveExpense(e) {
  e.preventDefault();
  const id = document.getElementById('field-id').value;
  
  const payload = {
    entity: document.getElementById('field-entity').value,
    category: document.getElementById('field-category').value,
    name: document.getElementById('field-name').value,
    email: document.getElementById('field-email').value,
    price: parseFloat(document.getElementById('field-price').value),
    currency: document.getElementById('field-currency').value,
    extraCreditCost: parseFloat(document.getElementById('field-extra-cost').value || 0),
    dueDate: document.getElementById('field-due-date').value,
    details: document.getElementById('field-details').value,
    billingFrequency: document.getElementById('field-billing-frequency').value,
    extraBillingFrequency: document.getElementById('field-extra-billing-frequency').value,
    isPerUser: document.getElementById('field-is-per-user').checked,
    userCount: parseInt(document.getElementById('field-user-count').value || 0),
    costPerUser: parseFloat(document.getElementById('field-cost-per-user').value || 0)
  };

  const isEdit = !!id;
  const url = isEdit ? `${API_BASE}/api/expenses/${id}?month=${activeMonth}` : `${API_BASE}/api/expenses?month=${activeMonth}`;
  const method = isEdit ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Failed to save expense item");
    
    closeExpenseModal();
    showToast(isEdit ? "Expense updated successfully" : "New expense added successfully", "success");
    fetchExpenses(); // Refresh
  } catch (err) {
    showToast("Error saving expense item", "error");
    console.error(err);
  }
}

function editExpense(id) {
  openExpenseModal(id);
}

async function deleteExpense(id) {
  if (!confirm("Are you sure you want to delete this expense item?")) return;

  try {
    const res = await fetch(`${API_BASE}/api/expenses/${id}?month=${activeMonth}`, { method: 'DELETE' });
    if (!res.ok) throw new Error("Failed to delete item");
    showToast("Expense item deleted", "success");
    fetchExpenses();
  } catch (err) {
    showToast("Error deleting item", "error");
    console.error(err);
  }
}

// Settings modal
function openSettingsModal() {
  document.getElementById('settings-modal').classList.add('active');
}
function closeSettingsModal() {
  document.getElementById('settings-modal').classList.remove('active');
}

// ==========================================================================
// REPORT GENERATOR & OUTLOOK INTEGRATION
// ==========================================================================
let currentReportHTML = '';
let currentReportText = '';

function generateReport() {
  const monthInput = document.getElementById('report-month').value; // YYYY-MM
  const managerEmail = document.getElementById('report-manager-email').value;
  const subjectPrefix = document.getElementById('report-subject').value;
  const introParagraph = document.getElementById('custom-intro').value;
  const includeEntitySummary = document.getElementById('include-charts-in-report').checked;

  if (!monthInput) {
    showToast("Please choose a billing month", "error");
    return;
  }

  // Parse Month Name
  const [year, month] = monthInput.split('-');
  const dateObj = new Date(year, parseInt(month) - 1, 1);
  const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Update Preview Envelopes
  const subjectLine = `${subjectPrefix} ${monthName}`;
  document.getElementById('preview-to').textContent = managerEmail || 'management@ims.com.bd';
  document.getElementById('preview-subject').textContent = subjectLine;

  // Aggregate values
  let grandTotalBDT = 0;
  const entityGroups = {};

  expenses.forEach(exp => {
    const costBDT = getBDTValue(exp);
    grandTotalBDT += costBDT;

    if (!entityGroups[exp.entity]) {
      entityGroups[exp.entity] = {
        totalBDT: 0,
        items: []
      };
    }
    entityGroups[exp.entity].totalBDT += costBDT;
    entityGroups[exp.entity].items.push(exp);
  });

  // Start Building HTML
  let html = `<div style="font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #1e293b; max-width: 650px; margin: 0 auto; line-height: 1.5;">`;
  
  // Greeting / Intro
  html += `<p>${introParagraph.replace(/\n/g, '<br>')}</p>`;
  
  // Grand Summary Banner
  html += `
    <div style="background-color: #f1f5f9; border-left: 4px solid #00c6ff; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <span style="font-size: 10pt; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: bold;">Grand Total Monthly Subscriptions</span>
      <h2 style="margin: 5px 0 0 0; font-size: 24px; color: #0f172a;">${Math.round(grandTotalBDT).toLocaleString()} BDT</h2>
      <span style="font-size: 9pt; color: #64748b; font-style: italic;">Conversions: $1 = ${settings.usd_to_bdt} TK | €1 = ${settings.eur_to_bdt} TK</span>
    </div>
  `;

  // Entity-wise Summary Table if checked
  if (includeEntitySummary) {
    html += `<h3 style="font-size: 13pt; color: #0f172a; margin-top: 25px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">Entity Summary</h3>`;
    html += `
      <table border="0" cellpadding="8" cellspacing="0" style="width: 100%; border-collapse: collapse; margin: 15px 0;">
        <thead>
          <tr style="background-color: #f8fafc;">
            <th align="left" style="border-bottom: 2px solid #cbd5e1; font-weight: bold;">Entity</th>
            <th align="right" style="border-bottom: 2px solid #cbd5e1; font-weight: bold;">Total (BDT)</th>
            <th align="right" style="border-bottom: 2px solid #cbd5e1; font-weight: bold;">% of Budget</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    Object.keys(entityGroups).forEach(ent => {
      const entTotal = entityGroups[ent].totalBDT;
      const pct = ((entTotal / grandTotalBDT) * 100).toFixed(1);
      const config = ENTITY_CONFIG[ent] || { fullName: ent, color: '#1e293b' };
      html += `
        <tr>
          <td style="border-bottom: 1px solid #e2e8f0; font-weight: bold;">
            <span style="color: ${config.color}; font-weight: bold;">${config.fullName} (${ent})</span>
          </td>
          <td align="right" style="border-bottom: 1px solid #e2e8f0; font-weight: bold;">${Math.round(entTotal).toLocaleString()} TK</td>
          <td align="right" style="border-bottom: 1px solid #e2e8f0; color: #64748b;">${pct}%</td>
        </tr>
      `;
    });
    html += `</tbody></table>`;
  }

  // Detailed breakdowns per Entity
  html += `<h3 style="font-size: 13pt; color: #0f172a; margin-top: 25px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">Detailed Subscriptions Breakdown</h3>`;

  Object.keys(entityGroups).forEach(ent => {
    const config = ENTITY_CONFIG[ent] || { fullName: ent, color: '#64748b' };
    html += `<h4 style="font-size: 11pt; color: #0f172a; margin: 20px 0 10px 0; background-color: #f8fafc; padding: 6px 10px; border-left: 3px solid ${config.color};">${config.fullName} (${ent}) Subscriptions</h4>`;
    html += `
      <table border="0" cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10pt;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th align="left" style="border-bottom: 1px solid #cbd5e1;">Category</th>
            <th align="left" style="border-bottom: 1px solid #cbd5e1;">Item / User</th>
            <th align="left" style="border-bottom: 1px solid #cbd5e1;">Email</th>
            <th align="right" style="border-bottom: 1px solid #cbd5e1;">Cost (Original)</th>
            <th align="right" style="border-bottom: 1px solid #cbd5e1;">Extra Credits</th>
            <th align="right" style="border-bottom: 1px solid #cbd5e1;">Total (BDT)</th>
          </tr>
        </thead>
        <tbody>
    `;

    entityGroups[ent].items.forEach(exp => {
      const costBDT = getBDTValue(exp);
      const monthly = getMonthlyCost(exp);
      
      let originalCostStr = "";
      if (exp.currency === 'USD') {
        if (exp.billingFrequency === 'yearly') {
          originalCostStr = `$${monthly.base.toFixed(2)}/mo ($${exp.price.toFixed(2)}/yr)`;
        } else {
          originalCostStr = `$${exp.price.toFixed(2)}/mo`;
        }
      } else if (exp.currency === 'EUR') {
        if (exp.billingFrequency === 'yearly') {
          originalCostStr = `€${monthly.base.toFixed(2)}/mo (€${exp.price.toFixed(2)}/yr)`;
        } else {
          originalCostStr = `€${exp.price.toFixed(2)}/mo`;
        }
      } else {
        if (exp.billingFrequency === 'yearly') {
          originalCostStr = `${Math.round(monthly.base).toLocaleString()} TK/mo (${exp.price.toLocaleString()} TK/yr)`;
        } else {
          originalCostStr = `${exp.price.toLocaleString()} TK/mo`;
        }
      }

      let extraCostStr = "-";
      if (exp.extraCreditCost > 0) {
        if (exp.currency === 'USD') {
          if (exp.extraBillingFrequency === 'yearly') {
            extraCostStr = `+$${monthly.extra.toFixed(2)}/mo (+$${exp.extraCreditCost.toFixed(2)}/yr)`;
          } else {
            extraCostStr = `+$${exp.extraCreditCost.toFixed(2)}/mo`;
          }
        } else if (exp.currency === 'EUR') {
          if (exp.extraBillingFrequency === 'yearly') {
            extraCostStr = `+€${monthly.extra.toFixed(2)}/mo (+€${exp.extraCreditCost.toFixed(2)}/yr)`;
          } else {
            extraCostStr = `+€${exp.extraCreditCost.toFixed(2)}/mo`;
          }
        } else {
          if (exp.extraBillingFrequency === 'yearly') {
            extraCostStr = `+${Math.round(monthly.extra).toLocaleString()} TK/mo (+${exp.extraCreditCost.toLocaleString()} TK/yr)`;
          } else {
            extraCostStr = `+${exp.extraCreditCost} TK/mo`;
          }
        }
      }

      let itemNameWithSeats = escapeHTML(exp.name);
      if (exp.isPerUser && exp.userCount > 0) {
        const symbol = exp.currency === 'USD' ? '$' : (exp.currency === 'EUR' ? '€' : '');
        itemNameWithSeats += `<br><span style="font-size: 8.5pt; color: #0284c7;">(${exp.userCount} Seats @ ${symbol}${exp.costPerUser}/user)</span>`;
      }

      html += `
        <tr>
          <td style="border-bottom: 1px solid #f1f5f9; color: #64748b;">${exp.category}</td>
          <td style="border-bottom: 1px solid #f1f5f9; font-weight: 500;">${itemNameWithSeats}</td>
          <td style="border-bottom: 1px solid #f1f5f9; color: #475569; font-size: 9.5pt;">${exp.email ? escapeHTML(exp.email) : '-'}</td>
          <td align="right" style="border-bottom: 1px solid #f1f5f9; font-family: monospace;">${originalCostStr}</td>
          <td align="right" style="border-bottom: 1px solid #f1f5f9; color: #64748b; font-family: monospace;">${extraCostStr}</td>
          <td align="right" style="border-bottom: 1px solid #f1f5f9; font-weight: bold;">${Math.round(costBDT).toLocaleString()} TK</td>
        </tr>
      `;
    });

    html += `
      <tr style="background-color: #fafafa;">
        <td colspan="5" align="right" style="font-weight: bold; border-top: 1px solid #cbd5e1;">${ent} Total:</td>
        <td align="right" style="font-weight: bold; border-top: 1px solid #cbd5e1; color: ${config.color || '#64748b'};">${Math.round(entityGroups[ent].totalBDT).toLocaleString()} TK</td>
      </tr>
    `;
    html += `</tbody></table>`;
  });

  // Footer / Sign-off
  html += `
    <p style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; color: #64748b; font-size: 9.5pt;">
      This report was generated dynamically via the IMS Group Expense Tracker Web App. All network connection bills, domain fees, and AI credits have been calculated using active rates.
    </p>
  `;
  html += `</div>`;

  // Render to Preview Screen
  const previewDiv = document.getElementById('report-html-body');
  previewDiv.innerHTML = html;

  currentReportHTML = html;

  // Generate plain text version for mailto body (as fallback or plain text email drafting)
  let text = `${introParagraph}\n\n`;
  text += `GRAND TOTAL MONTHLY SUBSCRIPTION EXPENSES: ${Math.round(grandTotalBDT).toLocaleString()} BDT\n`;
  text += `Rates applied: $1 = ${settings.usd_to_bdt} TK | €1 = ${settings.eur_to_bdt} TK\n\n`;
  
  Object.keys(entityGroups).forEach(ent => {
    text += `=== ${ent} Subscriptions (Total: ${Math.round(entityGroups[ent].totalBDT).toLocaleString()} TK) ===\n`;
    entityGroups[ent].items.forEach(exp => {
      const costBDT = getBDTValue(exp);
      const email = exp.email ? ` (${exp.email})` : '';
      const freqSuffix = exp.billingFrequency === 'yearly' ? ' (Yearly base)' : '';
      const extraFreqSuffix = (exp.extraCreditCost > 0 && exp.extraBillingFrequency === 'yearly') ? ' (Yearly extra)' : '';
      text += `- ${exp.name}${email}: ${exp.price} ${exp.currency}${freqSuffix} ${exp.extraCreditCost > 0 ? '[Extra: ' + exp.extraCreditCost + extraFreqSuffix + ']' : ''} => Monthly Equivalent: ${Math.round(costBDT).toLocaleString()} TK\n`;
    });
    text += `\n`;
  });
  text += `Generated dynamically via Expense Tracker App.`;
  currentReportText = text;

  showToast("Report draft generated!", "info");
}

// Copy HTML formatted report to Clipboard so user can PASTE directly into MS Outlook
async function copyReportHTML() {
  if (!currentReportHTML) {
    showToast("Please generate a report first", "error");
    return;
  }

  try {
    const blobHtml = new Blob([currentReportHTML], { type: 'text/html' });
    const blobText = new Blob([currentReportText], { type: 'text/plain' });
    
    const clipboardItem = new ClipboardItem({
      'text/html': blobHtml,
      'text/plain': blobText
    });

    await navigator.clipboard.write([clipboardItem]);
    showToast("Rich-Text copied! Paste directly in Outlook.", "success");
  } catch (err) {
    // Fallback to simple text copy if ClipboardItem is not supported
    try {
      await navigator.clipboard.writeText(currentReportText);
      showToast("Plain text copied (Rich-text fallback)", "info");
    } catch (fallbackErr) {
      showToast("Could not copy to clipboard", "error");
      console.error(fallbackErr);
    }
  }
}

// Launch Outlook mail client draft prefilled
function sendOutlookMail() {
  if (!currentReportHTML) {
    showToast("Please generate a report first", "error");
    return;
  }

  const to = document.getElementById('preview-to').textContent;
  const subject = document.getElementById('preview-subject').textContent;
  
  // Note: mailto body does not support HTML directly, so we pass the plain-text body
  const body = currentReportText;

  const mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoUrl;
  showToast("Launching mail draft...", "success");
}

// ==========================================================================
// TOASTS & UTILS
// ==========================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = '';
  if (type === 'success') {
    icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  } else if (type === 'error') {
    icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  } else {
    icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
  }

  toast.innerHTML = `${icon} <span>${escapeHTML(message)}</span>`;
  container.appendChild(toast);

  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'toast-slide-in 0.3s reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// ==========================================================================
// DYNAMIC CATEGORIES & ENTITIES MANAGEMENT
// ==========================================================================
async function fetchCategories() {
  try {
    if (isReadOnly) {
      const res = await fetch('db.json');
      if (res.ok) {
        const data = await res.json();
        if (data.customCategories) customCategoriesList = data.customCategories;
      }
    } else {
      const res = await fetch(`${API_BASE}/api/categories`);
      if (res.ok) {
        customCategoriesList = await res.json();
      }
    }
  } catch (err) {
    console.error("Error fetching categories:", err);
  } finally {
    populateCategoryDropdowns();
  }
}

async function fetchEntities() {
  try {
    if (isReadOnly) {
      const res = await fetch('db.json');
      if (res.ok) {
        const data = await res.json();
        if (data.customEntities) customEntitiesList = data.customEntities;
      }
    } else {
      const res = await fetch(`${API_BASE}/api/entities`);
      if (res.ok) {
        customEntitiesList = await res.json();
      }
    }
    customEntitiesList.forEach(e => {
      ENTITY_CONFIG[e.code] = {
        fullName: e.fullName,
        logo: e.logo || '',
        color: e.color || '#3b82f6',
        class: `badge-entity-${e.code.toLowerCase()}`
      };
    });
  } catch (err) {
    console.error("Error fetching entities:", err);
  } finally {
    populateEntityDropdowns();
  }
}

function handleEntitySelectChange(val) {
  if (val === '__NEW__') {
    document.getElementById('field-entity').value = customEntitiesList[0]?.code || 'IMS';
    openNewCompanyModal();
  }
}

function handleCategorySelectChange(val) {
  if (val === '__NEW__') {
    document.getElementById('field-category').value = customCategoriesList[0] || 'Monthly AI';
    openNewCategoryModal();
  }
}

function populateCategoryDropdowns() {
  const formCatSelect = document.getElementById('field-category');
  const filterCatSelect = document.getElementById('category-filter');

  if (formCatSelect) {
    const currentVal = formCatSelect.value;
    let optsHTML = customCategoriesList.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('');
    optsHTML += `<option value="__NEW__" style="font-weight: bold; color: #2563eb;">+ Add New Category...</option>`;
    formCatSelect.innerHTML = optsHTML;
    if (currentVal && customCategoriesList.includes(currentVal)) formCatSelect.value = currentVal;
  }

  if (filterCatSelect) {
    const currentFilterVal = filterCatSelect.value;
    filterCatSelect.innerHTML = `<option value="all">All Categories</option>` + customCategoriesList.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('');
    if (currentFilterVal) filterCatSelect.value = currentFilterVal;
  }
}

function populateEntityDropdowns() {
  const formEntSelect = document.getElementById('field-entity');
  const tabsContainer = document.getElementById('entity-filter-tabs');

  if (formEntSelect) {
    const currentVal = formEntSelect.value;
    let optsHTML = customEntitiesList.map(e => `<option value="${escapeHTML(e.code)}">${escapeHTML(e.fullName)} (${escapeHTML(e.code)})</option>`).join('');
    optsHTML += `<option value="__NEW__" style="font-weight: bold; color: #2563eb;">+ Add New Company...</option>`;
    formEntSelect.innerHTML = optsHTML;
    if (currentVal && currentVal !== '__NEW__') formEntSelect.value = currentVal;
  }

  if (tabsContainer) {
    let tabsHTML = `<button class="filter-tab ${activeEntityFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>`;
    customEntitiesList.forEach(e => {
      const isActive = activeEntityFilter === e.code ? 'active' : '';
      let logoHTML = '';
      if (e.logo) {
        logoHTML = `<img src="${e.logo}" style="height: 12px; max-width: 36px; object-fit: contain; background: white; padding: 1px 3px; border-radius: 2px;" alt="${e.code}">`;
      }
      tabsHTML += `
        <button class="filter-tab ${isActive}" data-filter="${e.code}">
          <div style="display: flex; align-items: center; gap: 6px;">
            ${logoHTML}
            <span>${e.code}</span>
          </div>
        </button>
      `;
    });
    tabsContainer.innerHTML = tabsHTML;
    initEntityFilterTabs();
  }
}

function openNewCompanyModal() {
  document.getElementById('new-company-form').reset();
  document.getElementById('new-company-modal').classList.add('active');
}
function closeNewCompanyModal() {
  document.getElementById('new-company-modal').classList.remove('active');
}

async function saveNewCompany(e) {
  e.preventDefault();
  const code = document.getElementById('new-company-code').value.trim().toUpperCase();
  const fullName = document.getElementById('new-company-name').value.trim();
  const color = document.getElementById('new-company-color').value;

  if (!code || !fullName) return;

  try {
    const res = await fetch(`${API_BASE}/api/entities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, fullName, color })
    });

    if (!res.ok) throw new Error("Failed to save company");
    const data = await res.json();
    customEntitiesList = data.entities;
    
    ENTITY_CONFIG[code] = { fullName, color, class: `badge-entity-${code.toLowerCase()}` };

    populateEntityDropdowns();
    document.getElementById('field-entity').value = code;
    closeNewCompanyModal();
    showToast(`New company "${fullName}" added`, 'success');
  } catch (err) {
    showToast("Error adding company", "error");
    console.error(err);
  }
}

function openNewCategoryModal() {
  document.getElementById('new-category-form').reset();
  document.getElementById('new-category-modal').classList.add('active');
}
function closeNewCategoryModal() {
  document.getElementById('new-category-modal').classList.remove('active');
}

async function saveNewCategory(e) {
  e.preventDefault();
  const name = document.getElementById('new-category-name').value.trim();
  if (!name) return;

  try {
    const res = await fetch(`${API_BASE}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });

    if (!res.ok) throw new Error("Failed to save category");
    const data = await res.json();
    customCategoriesList = data.categories;

    populateCategoryDropdowns();
    document.getElementById('field-category').value = name;
    closeNewCategoryModal();
    showToast(`New category "${name}" added`, 'success');
  } catch (err) {
    showToast("Error adding category", "error");
    console.error(err);
  }
}
