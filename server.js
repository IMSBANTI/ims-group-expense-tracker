const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'public', 'db.json');

app.use(express.json());

// Enable CORS for cross-origin hosting (e.g., Netlify frontend to Render backend)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// Helper to read database
function readDB() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database:", err);
    return { settings: { usd_to_bdt: 124, eur_to_bdt: 141 }, expenses: [] };
  }
}

// Helper to write database
function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error("Error writing database:", err);
    return false;
  }
}

// GET Settings
app.get('/api/settings', (req, res) => {
  const db = readDB();
  res.json(db.settings || { usd_to_bdt: 124, eur_to_bdt: 141 });
});

// PUT Settings
app.post('/api/settings', (req, res) => {
  const db = readDB();
  const { usd_to_bdt, eur_to_bdt } = req.body;
  
  if (typeof usd_to_bdt !== 'number' || typeof eur_to_bdt !== 'number') {
    return res.status(400).json({ error: "Invalid exchange rates. Must be numbers." });
  }

  db.settings = { usd_to_bdt, eur_to_bdt };
  
  if (writeDB(db)) {
    res.json({ message: "Settings updated successfully", settings: db.settings });
  } else {
    res.status(500).json({ error: "Failed to write database" });
  }
});

// Default categories & entities lists
const DEFAULT_CATEGORIES = ["Monthly AI", "Software", "Internet", "Mail", "Domain"];
const DEFAULT_ENTITIES = [
  { code: "IMS", fullName: "Integrated Marketing Service Ltd.", color: "#ef4444", logo: "/assets/ims_logo.png" },
  { code: "CLAN", fullName: "Country's Largest Audience Network", color: "#f97316", logo: "/assets/clan_logo.png" },
  { code: "SCL", fullName: "Sales Connect Ltd", color: "#881337", logo: "/assets/scl_logo.png" },
  { code: "TP", fullName: "Trade Pulse", color: "#059669", logo: "/assets/tp_logo.png" }
];

// GET Categories
app.get('/api/categories', (req, res) => {
  const db = readDB();
  res.json(db.customCategories || DEFAULT_CATEGORIES);
});

// POST New Category
app.post('/api/categories', (req, res) => {
  const db = readDB();
  const { name } = req.body;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: "Category name is required" });
  }

  if (!db.customCategories) {
    db.customCategories = [...DEFAULT_CATEGORIES];
  }

  const categoryName = name.trim();
  if (!db.customCategories.includes(categoryName)) {
    db.customCategories.push(categoryName);
  }

  if (writeDB(db)) {
    res.json({ categories: db.customCategories, added: categoryName });
  } else {
    res.status(500).json({ error: "Failed to save category" });
  }
});

// DELETE Category
app.delete('/api/categories/:name', (req, res) => {
  const db = readDB();
  const categoryName = decodeURIComponent(req.params.name).trim();

  if (!db.customCategories) {
    db.customCategories = [...DEFAULT_CATEGORIES];
  }

  db.customCategories = db.customCategories.filter(c => c.toLowerCase() !== categoryName.toLowerCase());

  if (writeDB(db)) {
    res.json({ categories: db.customCategories, message: `Category '${categoryName}' deleted` });
  } else {
    res.status(500).json({ error: "Failed to delete category" });
  }
});

// GET Entities / Companies
app.get('/api/entities', (req, res) => {
  const db = readDB();
  res.json(db.customEntities || DEFAULT_ENTITIES);
});

// POST New Entity / Company
app.post('/api/entities', (req, res) => {
  const db = readDB();
  const { code, fullName, color, logo } = req.body;

  if (!code || !fullName) {
    return res.status(400).json({ error: "Company code and full name are required" });
  }

  if (!db.customEntities) {
    db.customEntities = [...DEFAULT_ENTITIES];
  }

  const entityCode = code.trim().toUpperCase();
  const existingIndex = db.customEntities.findIndex(e => e.code === entityCode);
  
  const newEntity = {
    code: entityCode,
    fullName: fullName.trim(),
    color: color || '#3b82f6',
    logo: logo || ''
  };

  if (existingIndex >= 0) {
    db.customEntities[existingIndex] = newEntity;
  } else {
    db.customEntities.push(newEntity);
  }

  if (writeDB(db)) {
    res.json({ entities: db.customEntities, added: newEntity });
  } else {
    res.status(500).json({ error: "Failed to save company" });
  }
});

// Helper to get or clone expenses for a specific month
function getExpensesForMonth(db, monthKey) {
  if (!db.monthlyData) {
    db.monthlyData = {};
  }

  // If data exists for monthKey AND has items, return it
  if (db.monthlyData[monthKey] && Array.isArray(db.monthlyData[monthKey]) && db.monthlyData[monthKey].length > 0) {
    return db.monthlyData[monthKey];
  }

  // If no data exists for monthKey or array is empty, clone from closest non-empty month or db.expenses
  const nonExistingMonths = Object.keys(db.monthlyData).filter(m => Array.isArray(db.monthlyData[m]) && db.monthlyData[m].length > 0).sort();
  let baseList = db.expenses || [];
  if (nonExistingMonths.length > 0) {
    const lastMonth = nonExistingMonths[nonExistingMonths.length - 1];
    baseList = db.monthlyData[lastMonth];
  }

  // Deep clone items so editing monthKey does not mutate other months
  const clonedList = JSON.parse(JSON.stringify(baseList));
  db.monthlyData[monthKey] = clonedList;
  writeDB(db);
  return clonedList;
}

// GET Expenses
app.get('/api/expenses', (req, res) => {
  const db = readDB();
  const monthKey = req.query.month || (new Date().toISOString().substring(0, 7));
  const expensesList = getExpensesForMonth(db, monthKey);
  res.json(expensesList);
});

// POST Expense
app.post('/api/expenses', (req, res) => {
  const db = readDB();
  const monthKey = req.query.month || req.body.month || (new Date().toISOString().substring(0, 7));
  const expensesList = getExpensesForMonth(db, monthKey);

  const { entity, category, name, email, price, currency, dueDate, extraCreditCost, details, billingFrequency, extraBillingFrequency, isPerUser, userCount, costPerUser } = req.body;

  if (!entity || !category || !name || price === undefined || !currency) {
    return res.status(400).json({ error: "Missing required fields (entity, category, name, price, currency)" });
  }

  const priceNum = parseFloat(price);
  if (isNaN(priceNum)) {
    return res.status(400).json({ error: "Price must be a valid number" });
  }

  const newExpense = {
    id: String(Date.now()), // Unique timestamp-based ID
    entity,
    category,
    name,
    email: email || "",
    price: priceNum,
    currency,
    dueDate: dueDate || "Monthly",
    extraCreditCost: parseFloat(extraCreditCost || 0),
    details: details || "",
    billingFrequency: billingFrequency || "monthly",
    extraBillingFrequency: extraBillingFrequency || "monthly",
    isPerUser: !!isPerUser,
    userCount: parseInt(userCount || 0),
    costPerUser: parseFloat(costPerUser || 0)
  };

  expensesList.push(newExpense);
  db.monthlyData[monthKey] = expensesList;
  
  if (writeDB(db)) {
    res.status(201).json(newExpense);
  } else {
    res.status(500).json({ error: "Failed to write database" });
  }
});

// PUT Expense
app.put('/api/expenses/:id', (req, res) => {
  const db = readDB();
  const id = req.params.id;
  const monthKey = req.query.month || req.body.month || (new Date().toISOString().substring(0, 7));
  const expensesList = getExpensesForMonth(db, monthKey);
  const index = expensesList.findIndex(e => String(e.id) === String(id));

  if (index === -1) {
    return res.status(404).json({ error: "Expense not found for this month" });
  }

  const { entity, category, name, email, price, currency, dueDate, extraCreditCost, details, billingFrequency, extraBillingFrequency, isPerUser, userCount, costPerUser } = req.body;

  if (!entity || !category || !name || price === undefined || !currency) {
    return res.status(400).json({ error: "Missing required fields (entity, category, name, price, currency)" });
  }

  const priceNum = parseFloat(price);
  if (isNaN(priceNum)) {
    return res.status(400).json({ error: "Price must be a number" });
  }

  expensesList[index] = {
    id,
    entity,
    category,
    name,
    email: email || "",
    price: priceNum,
    currency,
    dueDate: dueDate || "Monthly",
    extraCreditCost: parseFloat(extraCreditCost || 0),
    details: details || "",
    billingFrequency: billingFrequency || "monthly",
    extraBillingFrequency: extraBillingFrequency || "monthly",
    isPerUser: !!isPerUser,
    userCount: parseInt(userCount || 0),
    costPerUser: parseFloat(costPerUser || 0)
  };

  db.monthlyData[monthKey] = expensesList;

  if (writeDB(db)) {
    res.json(expensesList[index]);
  } else {
    res.status(500).json({ error: "Failed to write database" });
  }
});

// DELETE Expense
app.delete('/api/expenses/:id', (req, res) => {
  const db = readDB();
  const id = req.params.id;
  const monthKey = req.query.month || (new Date().toISOString().substring(0, 7));
  const expensesList = getExpensesForMonth(db, monthKey);
  const index = expensesList.findIndex(e => String(e.id) === String(id));

  if (index === -1) {
    return res.status(404).json({ error: "Expense not found for this month" });
  }

  expensesList.splice(index, 1);
  db.monthlyData[monthKey] = expensesList;

  if (writeDB(db)) {
    res.json({ message: "Expense deleted successfully" });
  } else {
    res.status(500).json({ error: "Failed to write database" });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`To access from other machines on network, use http://[YOUR-IP-ADDRESS]:${PORT}`);
});
