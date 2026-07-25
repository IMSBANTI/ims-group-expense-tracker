export const DEFAULT_COMPANIES = [
  {
    id: "ims",
    name: "Integrated Marketing Service Ltd",
    code: "IMS",
    logo: "assets/IMS.png",
    accentColor: "#3b82f6",
    description: "IMS Main Operations & Head Office"
  },
  {
    id: "clan",
    name: "Country's Largest Audience Network",
    code: "CLAN",
    logo: "assets/CLAN.png",
    accentColor: "#10b981",
    description: "CLAN Media & Content Network"
  },
  {
    id: "scl",
    name: "Sales Connect Limited",
    code: "SCL",
    logo: "assets/SCL.png",
    accentColor: "#f59e0b",
    description: "SCL Sales & Commerce Operations"
  },
  {
    id: "tp",
    name: "Trade Pulse",
    code: "TP",
    logo: "assets/Trade-Pulse.png",
    accentColor: "#8b5cf6",
    description: "Trade Pulse Analytics & Trade Solutions"
  }
];

export const DEFAULT_CATEGORIES = [
  {
    id: "ai",
    name: "Monthly AI & Automation",
    icon: "sparkles",
    color: "#6366f1"
  },
  {
    id: "software",
    name: "Software & Design Tools",
    icon: "layers",
    color: "#ec4899"
  },
  {
    id: "internet",
    name: "Internet & IP Communication",
    icon: "wifi",
    color: "#14b8a6"
  },
  {
    id: "mail",
    name: "Mail & Workspace Services",
    icon: "mail",
    color: "#3b82f6"
  },
  {
    id: "domain",
    name: "Domain Registration",
    icon: "globe",
    color: "#f97316"
  },
  {
    id: "hosting",
    name: "Web Hosting",
    icon: "server",
    color: "#8b5cf6"
  },
  {
    id: "other",
    name: "Other Expenses",
    icon: "more-horizontal",
    color: "#64748b"
  }
];

export const DEFAULT_EXCHANGE_RATES = {
  USD_TO_BDT: 122.50,
  EUR_TO_BDT: 135.00
};

export const INITIAL_EXPENSES = [
  // --- IMS (Integrated Marketing Service Ltd) ---
  {
    id: "exp-ims-1",
    companyId: "ims",
    categoryId: "ai",
    title: "ChatGPT Plus",
    userOrDetail: "Abul Wazed",
    email: "wazed@ims.com.bd",
    currency: "USD",
    amount: 23.00,
    recurring: "Monthly",
    notes: "AI subscription for operations"
  },
  {
    id: "exp-ims-2",
    companyId: "ims",
    categoryId: "ai",
    title: "ChatGPT Plus",
    userOrDetail: "Nazmus Sakib",
    email: "nazmus@ims.com.bd",
    currency: "USD",
    amount: 28.50,
    recurring: "Monthly",
    notes: "Includes extra cost allocation"
  },
  {
    id: "exp-ims-3",
    companyId: "ims",
    categoryId: "ai",
    title: "ChatGPT Plus",
    userOrDetail: "Fahad Rakib",
    email: "farhad@ims.com.bd",
    currency: "USD",
    amount: 28.50,
    recurring: "Monthly",
    notes: "AI subscription"
  },
  {
    id: "exp-ims-4",
    companyId: "ims",
    categoryId: "ai",
    title: "ChatGPT Plus",
    userOrDetail: "Studio Account",
    email: "admin@ims.com.bd",
    currency: "USD",
    amount: 23.00,
    recurring: "Monthly",
    notes: "Studio AI account"
  },
  {
    id: "exp-ims-5",
    companyId: "ims",
    categoryId: "ai",
    title: "ChatGPT Plus",
    userOrDetail: "IMS GPT Shared",
    email: "imsgpt@ims.net.bd",
    currency: "USD",
    amount: 28.50,
    recurring: "Monthly",
    notes: "Shared GPT workspace"
  },
  {
    id: "exp-ims-6",
    companyId: "ims",
    categoryId: "ai",
    title: "ChatGPT Plus (Antigravity)",
    userOrDetail: "Antigravity Dev",
    email: "abirabedinbanti@gmail.com",
    currency: "USD",
    amount: 20.50,
    recurring: "Monthly",
    notes: "Dev environment AI"
  },
  {
    id: "exp-ims-7",
    companyId: "ims",
    categoryId: "ai",
    title: "Magnific AI",
    userOrDetail: "Studio",
    email: "admin@ims.com.bd",
    currency: "EUR",
    amount: 25.50,
    recurring: "Monthly",
    notes: "High-resolution AI upscaling"
  },
  {
    id: "exp-ims-8",
    companyId: "ims",
    categoryId: "software",
    title: "Adobe Creative Cloud",
    userOrDetail: "Tasfir",
    email: "studio@ims.net.bd",
    currency: "BDT",
    amount: 1300.00,
    recurring: "Monthly",
    notes: "Design studio seat"
  },
  {
    id: "exp-ims-9",
    companyId: "ims",
    categoryId: "software",
    title: "Adobe Creative Cloud",
    userOrDetail: "Sohag",
    email: "studio2@ims.net.bd",
    currency: "BDT",
    amount: 1300.00,
    recurring: "Monthly",
    notes: "Design studio seat"
  },
  {
    id: "exp-ims-10",
    companyId: "ims",
    categoryId: "software",
    title: "Adobe Creative Cloud",
    userOrDetail: "Mahmud",
    email: "studio3@ims.net.bd",
    currency: "BDT",
    amount: 1300.00,
    recurring: "Monthly",
    notes: "Design studio seat"
  },
  {
    id: "exp-ims-11",
    companyId: "ims",
    categoryId: "software",
    title: "Adobe Creative Cloud",
    userOrDetail: "Sohel",
    email: "studio7@ims.net.bd",
    currency: "BDT",
    amount: 1300.00,
    recurring: "Monthly",
    notes: "Design studio seat"
  },
  {
    id: "exp-ims-12",
    companyId: "ims",
    categoryId: "software",
    title: "Adobe Creative Cloud",
    userOrDetail: "Tanvir",
    email: "studo9@ims.net.bd",
    currency: "BDT",
    amount: 1300.00,
    recurring: "Monthly",
    notes: "Design studio seat"
  },
  {
    id: "exp-ims-13",
    companyId: "ims",
    categoryId: "internet",
    title: "Dtech Broadband",
    userOrDetail: "IMS Head Office",
    email: "billing@dtech.com",
    currency: "BDT",
    amount: 3000.00,
    recurring: "Monthly",
    notes: "Primary fiber link HO"
  },
  {
    id: "exp-ims-14",
    companyId: "ims",
    categoryId: "internet",
    title: "Elite Broadband",
    userOrDetail: "IMS Field Office",
    email: "billing@elite.com",
    currency: "BDT",
    amount: 1000.00,
    recurring: "Monthly",
    notes: "Field office connection"
  },
  {
    id: "exp-ims-15",
    companyId: "ims",
    categoryId: "internet",
    title: "IP Communication",
    userOrDetail: "IMS Field Office",
    email: "telecom@ipcomm.com",
    currency: "BDT",
    amount: 3675.00,
    recurring: "Monthly",
    notes: "IP PBX line FO"
  },
  {
    id: "exp-ims-16",
    companyId: "ims",
    categoryId: "internet",
    title: "IP Communication",
    userOrDetail: "IMS Head Office",
    email: "telecom@ipcomm.com",
    currency: "BDT",
    amount: 3675.00,
    recurring: "Monthly",
    notes: "IP PBX line HO"
  },
  {
    id: "exp-ims-17",
    companyId: "ims",
    categoryId: "internet",
    title: "IP Communication",
    userOrDetail: "IMS New Office",
    email: "telecom@ipcomm.com",
    currency: "BDT",
    amount: 3675.00,
    recurring: "Monthly",
    notes: "IP PBX line New Office"
  },
  {
    id: "exp-ims-18",
    companyId: "ims",
    categoryId: "mail",
    title: "Google Workspace",
    userOrDetail: "ims.com.bd Domain",
    email: "admin@ims.com.bd",
    currency: "USD",
    amount: 596.00,
    recurring: "Monthly",
    notes: "Google Workspace subscription for staff"
  },
  {
    id: "exp-ims-19",
    companyId: "ims",
    categoryId: "mail",
    title: "Dhaka WebHost Mail",
    userOrDetail: "ims.net.bd Domain",
    email: "support@dhakawebhost.com",
    currency: "BDT",
    amount: 15400.00,
    recurring: "Yearly",
    notes: "Mail server hosting"
  },
  {
    id: "exp-ims-20",
    companyId: "ims",
    categoryId: "domain",
    title: "BTCL IMS Domain Renewal",
    userOrDetail: "ims.com.bd",
    email: "domain@btcl.com.bd",
    currency: "BDT",
    amount: 1024.00,
    recurring: "Yearly",
    notes: "BTCL .bd domain renewal"
  },
  {
    id: "exp-ims-21",
    companyId: "ims",
    categoryId: "domain",
    title: "BTCL IMS Net Domain Renewal",
    userOrDetail: "ims.net.bd",
    email: "domain@btcl.com.bd",
    currency: "BDT",
    amount: 1024.00,
    recurring: "Yearly",
    notes: "BTCL .net.bd domain renewal"
  },
  {
    id: "exp-ims-22",
    companyId: "ims",
    categoryId: "hosting",
    title: "Dhaka WebHost Corporate Hosting",
    userOrDetail: "clan.com.bd / IMS web",
    email: "billing@dhakawebhost.com",
    currency: "BDT",
    amount: 9000.00,
    recurring: "Yearly",
    notes: "Server hosting space"
  },

  // --- CLAN (Country's Largest Audience Network) ---
  {
    id: "exp-clan-1",
    companyId: "clan",
    categoryId: "ai",
    title: "ChatGPT Plus",
    userOrDetail: "CLAN Admin",
    email: "admin@clan.com.bd",
    currency: "USD",
    amount: 28.50,
    recurring: "Monthly",
    notes: "CLAN network AI seat"
  },
  {
    id: "exp-clan-2",
    companyId: "clan",
    categoryId: "ai",
    title: "ChatGPT Token Topup",
    userOrDetail: "Masum Sheikh",
    email: "soaimseikh@gmail.com",
    currency: "BDT",
    amount: 500.00,
    recurring: "Monthly",
    notes: "API credit topup"
  },
  {
    id: "exp-clan-3",
    companyId: "clan",
    categoryId: "ai",
    title: "Google Flow AI",
    userOrDetail: "Tapash Chandra",
    email: "imsclanstudio@gmail.com",
    currency: "USD",
    amount: 20.50,
    recurring: "Monthly",
    notes: "Video automation flow seat"
  },
  {
    id: "exp-clan-4",
    companyId: "clan",
    categoryId: "software",
    title: "Adobe Creative Cloud",
    userOrDetail: "Masum",
    email: "retiree_taxis_9y@icloud.com",
    currency: "BDT",
    amount: 1300.00,
    recurring: "Monthly",
    notes: "Design studio seat"
  },
  {
    id: "exp-clan-5",
    companyId: "clan",
    categoryId: "software",
    title: "Adobe Creative Cloud",
    userOrDetail: "Shahidul Islam",
    email: "Clan@1year.online",
    currency: "BDT",
    amount: 1300.00,
    recurring: "Monthly",
    notes: "Design studio seat"
  },
  {
    id: "exp-clan-6",
    companyId: "clan",
    categoryId: "software",
    title: "Adobe Creative Cloud",
    userOrDetail: "Tapash Chandra",
    email: "Clan@1year.online",
    currency: "BDT",
    amount: 1300.00,
    recurring: "Monthly",
    notes: "Video production seat"
  },
  {
    id: "exp-clan-7",
    companyId: "clan",
    categoryId: "software",
    title: "Envato Elements",
    userOrDetail: "Shahidul Islam",
    email: "shahidul@clan.com.bd",
    currency: "BDT",
    amount: 450.00,
    recurring: "Monthly",
    notes: "Assets subscription"
  },
  {
    id: "exp-clan-8",
    companyId: "clan",
    categoryId: "internet",
    title: "RANKS IT Broadband",
    userOrDetail: "clanims Studio Connection",
    email: "billing@ranksit.com",
    currency: "BDT",
    amount: 5000.00,
    recurring: "Monthly",
    notes: "Dedicated fiber link"
  },
  {
    id: "exp-clan-9",
    companyId: "clan",
    categoryId: "mail",
    title: "Google Workspace (28 Users)",
    userOrDetail: "CLAN Team Pool (12+8+7+1)",
    email: "admin@clan.com.bd",
    currency: "USD",
    amount: 300.00,
    recurring: "Monthly",
    notes: "Business Starter licenses"
  },
  {
    id: "exp-clan-10",
    companyId: "clan",
    categoryId: "domain",
    title: "BTCL CLAN Domain Renewal",
    userOrDetail: "clan.com.bd",
    email: "domain@btcl.com.bd",
    currency: "BDT",
    amount: 1024.00,
    recurring: "Yearly",
    notes: "BTCL domain renewal"
  },

  // --- SCL (Sales Connect Limited) ---
  {
    id: "exp-scl-1",
    companyId: "scl",
    categoryId: "mail",
    title: "Google Workspace Business Starter (14 Seats)",
    userOrDetail: "SCL Banani HO",
    email: "scl.net.bd / admin@scl.net.bd",
    currency: "USD",
    amount: 135.24,
    recurring: "Monthly",
  },
  {
    id: "exp-scl-2",
    companyId: "scl",
    categoryId: "ai",
    title: "ChatGPT Business Seat",
    userOrDetail: "SCL Sales Operations",
    email: "info@scl.net.bd",
    currency: "USD",
    amount: 25.00,
    recurring: "Monthly",
    notes: "Sales automation assistant"
  },

  // --- TP (Trade Pulse) ---
  {
    id: "exp-tp-1",
    companyId: "tp",
    categoryId: "ai",
    title: "ChatGPT Enterprise / Analytics",
    userOrDetail: "Trade Pulse Desk",
    email: "admin@tradepulse.com",
    currency: "USD",
    amount: 35.00,
    recurring: "Monthly",
    notes: "Market intelligence AI"
  },
  {
    id: "exp-tp-2",
    companyId: "tp",
    categoryId: "mail",
    title: "Google Workspace Dedicated",
    userOrDetail: "tradepulse.com",
    email: "billing@tradepulse.com",
    currency: "BDT",
    amount: 21000.00,
    recurring: "Yearly",
    notes: "Mail workspace domain"
  }
];