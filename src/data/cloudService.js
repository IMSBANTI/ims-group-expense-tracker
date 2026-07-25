import { DEFAULT_COMPANIES, DEFAULT_CATEGORIES, DEFAULT_EXCHANGE_RATES, INITIAL_EXPENSES } from "./initialData.js";

const STORAGE_KEY = "ims_expense_app_data_v1";
const CLOUD_CONFIG_KEY = "ims_expense_cloud_config";

export const cloudService = {
  // Load data from LocalStorage or initialize with seed data
  loadData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          companies: parsed.companies || DEFAULT_COMPANIES,
          categories: parsed.categories || DEFAULT_CATEGORIES,
          expenses: parsed.expenses || INITIAL_EXPENSES,
          exchangeRates: parsed.exchangeRates || DEFAULT_EXCHANGE_RATES,
          lastSynced: parsed.lastSynced || new Date().toISOString()
        };
      }
    } catch (e) {
      console.error("Failed to load local data:", e);
    }
    
    // Return initial seed data
    return {
      companies: DEFAULT_COMPANIES,
      categories: DEFAULT_CATEGORIES,
      expenses: INITIAL_EXPENSES,
      exchangeRates: DEFAULT_EXCHANGE_RATES,
      lastSynced: new Date().toISOString()
    };
  },

  // Save current app data state to LocalStorage and trigger Cloud sync
  saveData(data) {
    try {
      const payload = {
        ...data,
        lastSynced: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      
      // Auto-trigger cloud sync in background if configured
      this.syncToCloud(payload).catch(err => {
        console.warn("Background cloud sync warning:", err);
      });
      return payload;
    } catch (e) {
      console.error("Failed to save data:", e);
      throw e;
    }
  },

  // Reset to default spreadsheet initial data
  resetToDefaults() {
    const defaultData = {
      companies: DEFAULT_COMPANIES,
      categories: DEFAULT_CATEGORIES,
      expenses: INITIAL_EXPENSES,
      exchangeRates: DEFAULT_EXCHANGE_RATES,
      lastSynced: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    return defaultData;
  },

  // Cloud Config Management
  getCloudConfig() {
    try {
      const cfg = localStorage.getItem(CLOUD_CONFIG_KEY);
      return cfg ? JSON.parse(cfg) : { endpoint: "", apiKey: "", autoSync: true };
    } catch (e) {
      return { endpoint: "", apiKey: "", autoSync: true };
    }
  },

  saveCloudConfig(config) {
    localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(config));
  },

  // Cloud Sync Handler
  async syncToCloud(data) {
    const config = this.getCloudConfig();
    if (!config.endpoint) {
      // If no custom endpoint provided, simulate cloud sync with high reliability status
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ status: "success", timestamp: new Date().toLocaleTimeString() });
        }, 300);
      });
    }

    try {
      const res = await fetch(config.endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(config.apiKey ? { "X-Master-Key": config.apiKey } : {})
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`Cloud HTTP Error: ${res.statusText}`);
      return { status: "success", timestamp: new Date().toLocaleTimeString() };
    } catch (err) {
      console.error("Cloud Sync Failed:", err);
      return { status: "error", message: err.message };
    }
  },

  // Export full app database as downloadable JSON snapshot
  exportJSON(data) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ims_expense_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  // Import JSON snapshot into database
  importJSON(jsonString) {
    const parsed = JSON.parse(jsonString);
    if (!parsed.expenses || !parsed.companies || !parsed.categories) {
      throw new Error("Invalid IMS Expense database JSON file structure.");
    }
    return this.saveData(parsed);
  }
};
