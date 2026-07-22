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
    return { settings: { usd_to_bdt: 120, eur_to_bdt: 130 }, expenses: [] };
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
  res.json(db.settings || { usd_to_bdt: 120, eur_to_bdt: 130 });
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

// GET Expenses
app.get('/api/expenses', (req, res) => {
  const db = readDB();
  res.json(db.expenses || []);
});

// POST Expense
app.post('/api/expenses', (req, res) => {
  const db = readDB();
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

  db.expenses.push(newExpense);
  
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
  const index = db.expenses.findIndex(e => e.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Expense not found" });
  }

  const { entity, category, name, email, price, currency, dueDate, extraCreditCost, details, billingFrequency, extraBillingFrequency, isPerUser, userCount, costPerUser } = req.body;

  if (!entity || !category || !name || price === undefined || !currency) {
    return res.status(400).json({ error: "Missing required fields (entity, category, name, price, currency)" });
  }

  const priceNum = parseFloat(price);
  if (isNaN(priceNum)) {
    return res.status(400).json({ error: "Price must be a number" });
  }

  db.expenses[index] = {
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

  if (writeDB(db)) {
    res.json(db.expenses[index]);
  } else {
    res.status(500).json({ error: "Failed to write database" });
  }
});

// DELETE Expense
app.delete('/api/expenses/:id', (req, res) => {
  const db = readDB();
  const id = req.params.id;
  const index = db.expenses.findIndex(e => e.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Expense not found" });
  }

  db.expenses.splice(index, 1);

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
