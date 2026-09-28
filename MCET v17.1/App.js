// =====================
// Security questions + password lock
// =====================

const PASSWORD_KEY = "expenseTrackerPassword";
const SQ_KEY = "expenseTrackerSQ";

const lockScreen = document.getElementById("lockScreen");
const app = document.getElementById("app");
const lockPasswordInput = document.getElementById("lockPassword");
const lockBtn = document.getElementById("lockBtn");
const lockClearBtn = document.getElementById("lockClearBtn");
const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
const resetArea = document.getElementById("resetArea");
const resetQuestions = document.getElementById("resetQuestions");
const newPasswordInput = document.getElementById("newPassword");
const confirmNewPasswordInput = document.getElementById("confirmNewPassword");
const resetConfirmBtn = document.getElementById("resetConfirmBtn");
const resetCancelBtn = document.getElementById("resetCancelBtn");

const securitySetupArea = document.getElementById("securitySetupArea");
const sq1_q = document.getElementById("sq1_q");
const sq1_a = document.getElementById("sq1_a");
const sq2_q = document.getElementById("sq2_q");
const sq2_a = document.getElementById("sq2_a");
const sq3_q = document.getElementById("sq3_q");
const sq3_a = document.getElementById("sq3_a");

let setupStep = 0;

// Hash helper for answers
async function hashAnswer(text) {
  const enc = new TextEncoder();
  const data = enc.encode(text.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function unlockApp() {
  const saved = localStorage.getItem(PASSWORD_KEY);
  const entered = lockPasswordInput.value.trim();

  if (!saved) {
    if (!entered) {
      alert("Set a password first");
      return;
    }

    if (setupStep === 0) {
      setupStep = 1;
      securitySetupArea.style.display = "block";
      alert("Now set 3 security questions and answers for password recovery.");
      return;
    }

    const q1 = sq1_q.value;
    const a1 = sq1_a.value.trim();
    const q2 = sq2_q.value;
    const a2 = sq2_a.value.trim();
    const q3 = sq3_q.value;
    const a3 = sq3_a.value.trim();

    if (!q1 || !q2 || !q3) {
      alert("Please select 3 different questions.");
      return;
    }
    if (new Set([q1, q2, q3]).size !== 3) {
      alert("Please select 3 different questions.");
      return;
    }
    if (!a1 || !a2 || !a3) {
      alert("Please answer all 3 questions.");
      return;
    }

    localStorage.setItem(PASSWORD_KEY, entered);

    (async () => {
      const h1 = await hashAnswer(a1);
      const h2 = await hashAnswer(a2);
      const h3 = await hashAnswer(a3);

      const sqData = {
        questions: [q1, q2, q3],
        answers: [h1, h2, h3]
      };
      localStorage.setItem(SQ_KEY, JSON.stringify(sqData));

      securitySetupArea.style.display = "none";
      lockScreen.style.display = "none";
      app.style.display = "block";
    })();

    return;
  }

  if (entered === saved) {
    lockScreen.style.display = "none";
    app.style.display = "block";
  } else {
    alert("Incorrect password");
  }
}

lockBtn.onclick = unlockApp;

lockPasswordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    unlockApp();
  }
});

lockClearBtn.addEventListener("click", () => {
  const saved = localStorage.getItem(PASSWORD_KEY);
  const entered = lockPasswordInput.value;

  if (!saved) {
    alert("No password is set yet.");
    return;
  }
  if (!entered) {
    alert("Enter your current password to clear it.");
    return;
  }
  if (entered !== saved) {
    alert("Current password is incorrect.");
    return;
  }

  localStorage.removeItem(PASSWORD_KEY);
  localStorage.removeItem(SQ_KEY);
  alert("Saved password and security questions cleared. You can set a new one next time.");

  lockPasswordInput.value = "";
  sq1_q.value = "";
  sq1_a.value = "";
  sq2_q.value = "";
  sq2_a.value = "";
  sq3_q.value = "";
  sq3_a.value = "";
  securitySetupArea.style.display = "none";
  setupStep = 0;
});

forgotPasswordBtn.addEventListener("click", () => {
  const sqRaw = localStorage.getItem(SQ_KEY);
  if (!sqRaw) {
    alert("No security questions set. You must clear the password and set up again.");
    return;
  }

  const sqData = JSON.parse(sqRaw);
  const questionsMap = {
  q1: "What was the name of your first pet?",
  q2: "What is your mother’s maiden name?",
  q3: "What city were you born in?",
  q4: "What was the name of your elementary school?",
  q5: "What is your favorite book?",
  q6: "What is your favorite movie?",
  q7: "What is your favorite food?",
  q8: "What is the name of your best friend from childhood?",
  q9: "What is your favorite sports team?",
  q10: "What was the make/model of your first car?",
  q11: "What is your favorite hobby?",
  q12: "What is your favorite color?"
};

  resetQuestions.innerHTML = "";
  sqData.questions.forEach((qKey, idx) => {
    const qText = questionsMap[qKey] || qKey;
    resetQuestions.innerHTML += `
      <div style="margin-bottom:10px;">
        <div style="font-size:13px;margin-bottom:4px;">${idx + 1}. ${qText}</div>
        <input type="text" class="reset-answer-input" data-idx="${idx}"
               placeholder="Your answer"
               style="width:100%;padding:8px;">
      </div>
    `;
  });

  newPasswordInput.value = "";
  confirmNewPasswordInput.value = "";
  resetArea.style.display = "block";
  lockPasswordInput.value = "";
});

resetCancelBtn.addEventListener("click", () => {
  resetArea.style.display = "none";
  newPasswordInput.value = "";
  confirmNewPasswordInput.value = "";
});

resetConfirmBtn.addEventListener("click", async () => {
  const sqRaw = localStorage.getItem(SQ_KEY);
  if (!sqRaw) {
    alert("No security questions found.");
    return;
  }
  const sqData = JSON.parse(sqRaw);

  const inputs = document.querySelectorAll(".reset-answer-input");
  const answers = Array.from(inputs).map(inp => inp.value.trim());

  if (answers.some(a => !a)) {
    alert("Please answer all questions.");
    return;
  }

  const hashed = await Promise.all(answers.map(hashAnswer));
  const ok = hashed.every((h, i) => h === sqData.answers[i]);

  if (!ok) {
    alert("One or more answers are incorrect. Password not reset.");
    return;
  }

  const newPass = newPasswordInput.value.trim();
  const confirmPass = confirmNewPasswordInput.value.trim();

  if (!newPass) {
    alert("Enter a new password.");
    return;
  }
  if (newPass !== confirmPass) {
    alert("Passwords do not match.");
    return;
  }

  localStorage.setItem(PASSWORD_KEY, newPass);
  alert("Password reset successfully. Use your new password to unlock.");

  resetArea.style.display = "none";
  newPasswordInput.value = "";
  confirmNewPasswordInput.value = "";
  lockPasswordInput.value = newPass;
});
//======================================================================================


const db = new Dexie("ExpenseTrackerDB");


db.version(1).stores({
  transactions: "++id, timestamp, type, currency, category, paymentMode",
  learnedRules: "text"
});

//===========================
let data = [];
let learnedRules = [];
const ITEMS_PER_PAGE = 20;
let currentTxPage = 1;


async function loadAppData() {
  data = await db.transactions.toArray();

  const stored = await db.learnedRules.toArray();
  learnedRules = Array.isArray(stored) ? stored : [];

  // Optional: if you also use localStorage as a backup
  const local = JSON.parse(localStorage.getItem("learnedRules") || "[]");
  if (Array.isArray(local) && local.length > learnedRules.length) {
    learnedRules = local;
  }
}

  /*=============TOGGLE HIDE
  let balanceHidden = true;
let lastBalanceText = "";
============================*/
  let rates = {};
let pieChart, barChart, weeklyChart;



// Supported global currencies for conversion
const currencyOptions = [
  "USD", // US Dollar
  "EUR", // Euro
  "GBP", // British Pound
  "INR", // Indian Rupee
  "AUD", // Australian Dollar
  "CAD", // Canadian Dollar
  "JPY", // Japanese Yen
  "CHF", // Swiss Franc
  "CNY", // Chinese Yuan
  "SGD", // Singapore Dollar
  "NZD", // New Zealand Dollar
  "HKD", // Hong Kong Dollar
  "ZAR"  // South African Rand
];

function populateCurrencyDropdown(selectId, selectedValue = "USD") {
  const select = document.getElementById(selectId);
  if (!select) return;

  const currentValue = selectedValue || select.value || "USD";

  select.innerHTML = "";

  currencyOptions.forEach(code => {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = code;
    if (code === currentValue) option.selected = true;
    select.appendChild(option);
  });

  select.setAttribute("data-hasvalue", select.value ? "true" : "");
}
//========================================
  const defaultCategories = {
    income: [
      	"Salary",
	"Self-employed income",
	"Bonus",
	"Tips",
	"Regular monthly income",
 "Tax refund",
	"Gifts received",
	"Alimony received",
	"Child support received",
	"Rental income",
	"Dividend income",
"Interest earned"

    ],
    expense: [
      "Housing",
      "Technology",
      "Food",
      "Groceries",
      "Dining out",
      "Health",
      "Shopping",
      "Bills & utilities",
      "Subscriptions",
      "Travel",
      "EMI & debt payments",
      "Fun & entertainment",
      "Child care & family",
      "Personal care",
      "Transportation",
      "Savings & investments",
      "Insurance & financial",
      "Education & self improvement",
      "Gifts & donations",
      "Taxes & government",
      "Pets",
      "Business expenses",
      "Proffesional fees",
      "Miscellaneous",
      "Clothing"
    ]
  };

  let categories = JSON.parse(localStorage.getItem("categories")) || defaultCategories;
  localStorage.removeItem("categories");

  //temporary button
//categories = defaultCategories;
//updateCategories();
//updateQuickCategories();

  const keywordMap = {
    food: {
      diningOut: ["restaurant", "hotel", "dining", "lunch", "dinner", "foodDelivery"],
      groceriesAndSnacks: ["groceries", "supermarket", "snacks", "tea", "coffee"]
    },
    travel: {
      rideHailing: ["uber", "ola", "cab", "auto", "rideshares", "taxis"],
      publicTransport: ["bus", "train", "metro", "publicTransit"],
      fuelAndTolls: ["fuel", "petrol", "diesel", "toll"]
    },
    bills: {
      utilities: ["electricity", "water", "gas", "internet", "rentMortgage"],
      connectivity: ["mobile", "recharge", "wifi"],
      housing: ["hoaDues", "propertyTaxes"]
    },
    health: {
      doctorsAndHospitals: ["doctor", "hospital", "clinic", "pediatrician"],
      medicinesAndPharmacy: ["prescriptions", "pharmacy", "medication"],
      generalHealth: ["gym", "therapy", "health"]
    },
    shopping: {
      fashionAndLifestyle: ["clothing", "shoes", "accessories", "jewelry"],
      electronicsAndGadgets: ["electronics", "gadgets", "appliances"],
      hobbiesBooks: ["books", "videoGames", "hobbies"]
    }
  };

  function mapKeywordCategory(catKey) {
    switch (catKey) {
      case "food": return "Food";
      case "travel": return "Travel";
      case "shopping": return "Shopping";
      case "bills": return "Bills & utilities";
      case "health": return "Health";
      default: return "Miscellaneous";
    }
  }

  function mapSubcategoryLabel(catKey, subKey) {
    const lookup = {
      food: {
        diningOut: "Dining out",
        groceriesAndSnacks: "Groceries & snacks"
      },
      travel: {
        rideHailing: "Ride hailing",
        publicTransport: "Public transport",
        fuelAndTolls: "Fuel & tolls"
      },
      shopping: {
        fashionAndLifestyle: "Fashion & lifestyle",
        electronicsAndGadgets: "Electronics & gadgets",
        hobbiesBooks: "Hobbies & books"
      },
      bills: {
        utilities: "Utilities",
        connectivity: "Connectivity",
        housing: "Housing"
      },
      health: {
        doctorsAndHospitals: "Doctors & hospitals",
        medicinesAndPharmacy: "Medicines & pharmacy",
        generalHealth: "General health"
      }
    };

    return lookup[catKey]?.[subKey] || "";
  }

  function categorizeTransaction(description = "") {
    const text = description.toLowerCase();

    for (const [categoryKey, subcategories] of Object.entries(keywordMap)) {
      for (const [subcategoryKey, keywords] of Object.entries(subcategories)) {
        if (keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
          const category = mapKeywordCategory(categoryKey);
          const subcategory = mapSubcategoryLabel(categoryKey, subcategoryKey);
          return { category, subcategory };
        }
      }
    }

    return { category: null, subcategory: null };
  }

  function suggestCategoryFromDescription(desc) {
    if (!desc) return { category: null, subcategory: null };
    const text = desc.toLowerCase();

    const learned = learnedRules.find(r => r.text === text);
    if (learned) {
      return {
        category: learned.category || null,
        subcategory: learned.subcategory || null
      };
    }

    return categorizeTransaction(desc);
  }
  //============================================

 function rememberChoice(desc, category, subcategory) {
  if (!desc || !category) return;
  const text = desc.toLowerCase();

  // Ensure learnedRules is an array
  if (!Array.isArray(learnedRules)) {
    learnedRules = [];
  }

  const existingIndex = learnedRules.findIndex(r => r.text === text);
  const entry = { text, category, subcategory: subcategory || null };

  let updated;
  if (existingIndex >= 0) {
    const copy = [...learnedRules];
    copy[existingIndex] = entry;
    updated = copy;
  } else {
    updated = [...learnedRules, entry];
  }

  setLearnedRulesArray(updated);
}

function setLearnedRulesArray(nextArray) {
  if (!Array.isArray(nextArray)) {
    console.error("setLearnedRulesArray called with non-array:", nextArray);
    return;
  }
  learnedRules = nextArray;
  localStorage.setItem("learnedRules", JSON.stringify(learnedRules));
}
//========================================================
  // Main form Category dropdown
  function updateCategories() {
    const type = document.getElementById("type").value || "expense";
    const select = document.getElementById("category");
    const currentCategories = Array.isArray(categories[type]) ? categories[type] : [];

    select.innerHTML = "";

    // Placeholder option
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.disabled = false;      // keep selectable so "no category" is possible
    placeholder.selected = !select.value;
    placeholder.textContent = "Select category";
    select.appendChild(placeholder);

    currentCategories.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      select.appendChild(opt);
    });

    select.setAttribute("data-hasvalue", select.value ? "true" : "");
  }

  // Quick-add Category dropdown
  function updateQuickCategories() {
    const type = document.getElementById("quickType").value || "expense";
    const select = document.getElementById("quickCategory");
    const currentCategories = Array.isArray(categories[type]) ? categories[type] : [];

    select.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.disabled = false;
    placeholder.selected = !select.value;
    placeholder.textContent = "Select category";
    select.appendChild(placeholder);

    currentCategories.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      select.appendChild(opt);
    });

    select.setAttribute("data-hasvalue", select.value ? "true" : "");
  }

  // ADD ONLY: use text field to add a new category to current type
  function addCategoryInline() {
    const type = document.getElementById("type").value || "expense";
    const nameInput = document.getElementById("catEditName");
    const newName = nameInput.value.trim();

    if (!newName) {
      alert("Enter a category name to add");
      return;
    }

    const existing = Array.isArray(categories[type]) ? [...categories[type]] : [];

    if (existing.includes(newName)) {
      alert("Category already exists.");
      return;
    }

    existing.push(newName);
    categories[type] = existing;
    saveCategories();

    // Refresh dropdowns
    updateCategories();
    updateQuickCategories();

    // Select the new category in both dropdowns
    const mainCat = document.getElementById("category");
    mainCat.value = newName;
    mainCat.setAttribute("data-hasvalue", "true");

    const quickCat = document.getElementById("quickCategory");
    if (quickCat) {
      quickCat.value = newName;
      quickCat.setAttribute("data-hasvalue", "true");
    }

    // Clear input
    nameInput.value = "";
  }

  // DELETE ONLY: delete the selected category from current type
  function deleteCategoryInline() {
    const type = document.getElementById("type").value || "expense";
    const select = document.getElementById("category");
    const selected = select.value;

    if (!selected) {
      alert("Select a category to delete");
      return;
    }

    const existing = Array.isArray(categories[type]) ? [...categories[type]] : [];
    const filtered = existing.filter(cat => cat !== selected);

    categories[type] = filtered;
    saveCategories();

    updateCategories();
    updateQuickCategories();

    // Clear selection after delete
    const mainCat = document.getElementById("category");
    mainCat.value = "";
    mainCat.setAttribute("data-hasvalue", "");
  }

  function applySavedTheme() {
    const saved = localStorage.getItem("theme") || "night";
    const root = document.documentElement;
    const btn = document.getElementById("themeToggle");

    if (saved === "day") {
      root.setAttribute("data-theme", "day");
      if (btn) btn.textContent = "☀️ Day";
    } else {
      root.removeAttribute("data-theme");
      if (btn) btn.textContent = "🌙 Night";
    }
  }

  function toggleTheme() {
    const root = document.documentElement;
    const btn = document.getElementById("themeToggle");
    const isDay = root.getAttribute("data-theme") === "day";

    if (isDay) {
      root.removeAttribute("data-theme");
      localStorage.setItem("theme", "night");
      if (btn) btn.textContent = "🌙 Night";
    } else {
      root.setAttribute("data-theme", "day");
      localStorage.setItem("theme", "day");
      if (btn) btn.textContent = "☀️ Day";
    }
  }
//=================================================
  //async function loadRates 
    
 async function loadRates() {
  const STORAGE_KEY = "rates";
  const LAST_UPDATE_KEY = "ratesLastUpdated";

  // Emergency fallback only — used if there are no cached rates
  const defaultRates = {
    USD: 1,
    EUR: 0.87,
    GBP: 0.75,
    INR: 95.82,
    AUD: 1.40,
    CAD: 1.40,
    JPY: 157.27,
    CHF: 0.82,
    CNY: 6.70,
    SGD: 1.27,
    NZD: 1.74,
    HKD: 7.85,
    ZAR: 16.26
  };

  try {
    // 1. Try to get fresh rates
    const res = await fetch(
      "https://open.er-api.com/v6/latest/USD"
    );

    if (!res.ok) {
      throw new Error(`Network response error: ${res.status}`);
    }

    const result = await res.json();

    // 2. Validate API response
    if (
      !result ||
      result.result !== "success" ||
      !result.rates
    ) {
      throw new Error("Invalid exchange-rate API response");
    }

    // 3. Keep only currencies your app currently supports
    rates = {
      USD: 1,
      EUR: result.rates.EUR ?? defaultRates.EUR,
      GBP: result.rates.GBP ?? defaultRates.GBP,
      INR: result.rates.INR ?? defaultRates.INR,
      AUD: result.rates.AUD ?? defaultRates.AUD,
      CAD: result.rates.CAD ?? defaultRates.CAD,
      JPY: result.rates.JPY ?? defaultRates.JPY,
      CHF: result.rates.CHF ?? defaultRates.CHF,
      CNY: result.rates.CNY ?? defaultRates.CNY,
      SGD: result.rates.SGD ?? defaultRates.SGD,
      NZD: result.rates.NZD ?? defaultRates.NZD,
      HKD: result.rates.HKD ?? defaultRates.HKD,
      ZAR: result.rates.ZAR ?? defaultRates.ZAR
    };

    // 4. Save successful rates
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rates));

    // Save when these rates were obtained
    localStorage.setItem(
      LAST_UPDATE_KEY,
      new Date().toISOString()
    );

    console.log("Exchange rates updated successfully.");

  } catch (err) {

    console.warn(
      "Online rate update failed:",
      err.message
    );

    // 5. FIRST fallback: previously saved rates
    const savedRates = localStorage.getItem(STORAGE_KEY);

    if (savedRates) {
      try {
        rates = JSON.parse(savedRates);

        console.log(
          "Using previously cached exchange rates."
        );

        return;

      } catch (cacheError) {
        console.warn(
          "Cached rates are invalid:",
          cacheError.message
        );
      }
    }

    // 6. SECOND fallback: emergency defaults
    rates = defaultRates;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(rates)
    );

    console.warn(
      "No cached rates available. Using emergency default rates."
    );
  }
}

/* const lastUpdated = localStorage.getItem("ratesLastUpdated");

  if (lastUpdated) {
    console.log(
      "Rates last updated:",
      new Date(lastUpdated).toLocaleString()*/



  function convert(amount, from, to) {
  if (!rates[from] || !rates[to]) return 0;

  // Convert from "from" to USD, then USD to "to"
  const amountInUsd = amount / rates[from];
  const amountInTarget = amountInUsd * rates[to];
  return amountInTarget;
}
//===================================================
  async function addTransaction() {
    const amount = document.getElementById("amount").value;
    const description = document.getElementById("description").value;
    const type = document.getElementById("type").value || "expense";
    let category = document.getElementById("category").value;
    const paymentMode = document.getElementById("paymentMode").value || "upi";
    const currency = document.getElementById("currency").value || "USD";

    if (!amount || amount <= 0) return alert("Enter valid amount");

    const { category: suggestedCategory, subcategory: suggestedSubcategory } =
      suggestCategoryFromDescription(description);

    let subcategory = suggestedSubcategory;

    if (!category) {
      if (suggestedCategory) {
        category = suggestedCategory;
        const catSelect = document.getElementById("category");
        catSelect.value = suggestedCategory;
        catSelect.setAttribute("data-hasvalue", "true");
      } else {
        category = type === "income" ? "Earned income" : "Miscellaneous";
        subcategory = null;
      }
    }

    const timestamp = Date.now();

    const tx = {
      id: timestamp,
      amount: Number(amount),
      type,
      paymentMode,
      category,
      subcategory,
      currency,
      description,
      timestamp
    };

   await db.transactions.add(tx);
data = await db.transactions.toArray();
    rememberChoice(description, category, subcategory);
    render();
    calculateBalance();
   updateSummary(); 

    document.getElementById("amount").value = "";
    document.getElementById("description").value = "";
  }

  async function addQuickTransaction() {
    const amount = document.getElementById("quickAmount").value;
    const description = document.getElementById("quickDescription").value;
    const type = document.getElementById("quickType").value || "expense";
    const paymentMode = document.getElementById("quickPaymentMode").value || "upi";
    let category = document.getElementById("quickCategory").value;
    const currency = document.getElementById("quickCurrency").value || "USD";

    if (!amount || amount <= 0) return alert("Enter valid amount");

    const { category: suggestedCategory, subcategory: suggestedSubcategory } =
      suggestCategoryFromDescription(description);

    let subcategory = suggestedSubcategory;

    if (!category) {
      if (suggestedCategory) {
        category = suggestedCategory;
        const catSelect = document.getElementById("quickCategory");
        catSelect.value = suggestedCategory;
        catSelect.setAttribute("data-hasvalue", "true");
      } else {
        category = type === "income" ? "Earned income" : "Miscellaneous";
        subcategory = null;
      }
    }

    const timestamp = Date.now();

    const tx = {
      id: timestamp,
      amount: Number(amount),
      type,
      paymentMode,
      category,
      subcategory,
      currency,
      description,
      timestamp
    };

    await db.transactions.add(tx);
data = await db.transactions.toArray();
    rememberChoice(description, category, subcategory);
    render();
    calculateBalance();
    updateSummary(); 
    closeQuickModal();

    document.getElementById("quickAmount").value = "";
    document.getElementById("quickDescription").value = "";
  }
//==============
  async function deleteItem(id) {
  await db.transactions.delete(id);
  data = await db.transactions.toArray();
  render();
  calculateBalance();
  updateSummary(); 
}
//===========================
  async function confirmReset() {
    const shouldReset = window.confirm(
      "This will remove all transactions and reset charts and balance.\nAre you sure?"
    );

    if (!shouldReset) return;
//========================
    await db.transactions.clear();
await db.learnedRules.clear();
//============================
data = [];
learnedRules = [];
    if (pieChart) pieChart.destroy();
    if (barChart) barChart.destroy();
    if (weeklyChart) weeklyChart.destroy();

    const list = document.getElementById("list");
    list.innerHTML = "";
    document.getElementById("txCountLabel").innerText = "0 items";

    const base = document.getElementById("currency").value || "USD";
    document.getElementById("balance").innerText = base + " 0.00";
    currentTxPage = 1;        
  render();         
  updateSummary(); }

  function getCategoryBadgeStyle(category) {
    switch (category) {
      case "Food":
        return "background-color: var(--cat-food); color:#7f1d1d;";
      case "Travel":
        return "background-color: var(--cat-travel); color:#1e3a8a;";
      case "Shopping":
        return "background-color: var(--cat-shopping); color:#78350f;";
      case "Bills & utilities":
        return "background-color: var(--cat-bills); color:#312e81;";
      case "Health":
        return "background-color: var(--cat-health); color:#14532d;";
      default:
        return "background-color: var(--cat-other); color:#111827;";
    }
  }

  function formatDateTime(ts) {
    const d = new Date(ts);
    const dateStr = d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
    const timeStr = d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit"
    });
    return { dateStr, timeStr };
  }

  
    //=============load more button===========
    function render() {
  const list = document.getElementById("list");
  list.innerHTML = "";

  // Sort transactions: newest first
  const sorted = [...data].sort((a, b) => (b.timestamp || b.id) - (a.timestamp || a.id));

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE) || 1;
  if (currentTxPage > totalPages) currentTxPage = totalPages;

  const start = (currentTxPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageItems = sorted.slice(start, end);

  pageItems.forEach(i => {
    const badgeStyle = getCategoryBadgeStyle(i.category);
    const descText = i.description ? `<div class="tx-description">${i.description}</div>` : "";
    const { dateStr, timeStr } = formatDateTime(i.timestamp || i.id);

    const paymentLabel = i.paymentMode
      ? `<span style="font-size:11px;color:var(--text-secondary);margin-left:6px;">${i.paymentMode.toUpperCase()}</span>`
      : "";

    list.innerHTML += `
      <div class="expense ${i.type === 'income' ? 'income' : 'expense-item'}" onclick="openDetail(${i.id})">
        <div>
          <div class="tx-category-badge" style="${badgeStyle}">
            <span>${i.category}${i.subcategory ? " · " + i.subcategory : ""}</span>
            ${paymentLabel}
          </div>
          <div class="tx-meta" style="margin-top:6px;">
            ${i.amount} ${i.currency}
          </div>
          ${descText}
          <div class="tx-datetime">
            ${dateStr} · ${timeStr}
          </div>
        </div>
        <div onclick="event.stopPropagation(); deleteItem(${i.id});">
          <button>Delete</button>
        </div>
      </div>`;
  });

  document.getElementById("txCountLabel").innerText =
    sorted.length ? `${sorted.length} item${sorted.length > 1 ? "s" : ""}` : "0 items";

  // Handle "Load more" button
  let loadMoreBtn = document.getElementById("loadMoreTxBtn");

  if (!loadMoreBtn) {
    // Create button if it doesn't exist
    const wrapper = document.createElement("div");
    wrapper.style.textAlign = "center";
    wrapper.style.marginTop = "10px";

    loadMoreBtn = document.createElement("button");
    loadMoreBtn.id = "loadMoreTxBtn";
    loadMoreBtn.type = "button";
    loadMoreBtn.textContent = "Load more";
    loadMoreBtn.onclick = () => {
      currentTxPage++;
      render(); // re-render with next page
    };

    wrapper.appendChild(loadMoreBtn);
    document.getElementById("recentActivity").appendChild(wrapper);
  }

  // Show/hide button depending on whether more items exist
  if (currentTxPage >= totalPages) {
    loadMoreBtn.style.display = "none";
  } else {
    loadMoreBtn.style.display = "inline-block";
  }

  updateCharts();
  updateWeeklyChart();
}
 //================================================= 

  function calculateBalance() {
    let income = 0;
    let expense = 0;

    const base = document.getElementById("currency").value || "USD";

    data.forEach(tx => {
      const val = convert(tx.amount, tx.currency, base);

      if (tx.type === "income") income += val;
      else expense += val;
    });

    const balance = income - expense;

    document.getElementById("balance").innerText =
      base + " " + balance.toFixed(2);}

// ==============SUMMARY LOGIC==================
function getStartOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getEndOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function updateSummary() {
  const base = document.getElementById("currency").value || "USD";

  // Update label
  document.getElementById("summaryBaseCurrencyLabel").textContent = `Base: ${base}`;

  const now = new Date();
  const start = getStartOfMonth(now);
  const end = getEndOfMonth(now);

  let totalIncome = 0;
  let totalExpenses = 0;
  const categoryTotals = {};

  data.forEach(tx => {
    const txDate = new Date(tx.timestamp || tx.id);
    if (txDate < start || txDate > end) return;

    const amountBase = convert(tx.amount, tx.currency, base);

    if (tx.type === "income") {
      totalIncome += amountBase;
    } else {
      totalExpenses += amountBase;

      const cat = tx.category || "Uncategorized";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amountBase;
    }
  });

  const netSavings = totalIncome - totalExpenses;

  // Format numbers
  const fmt = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  document.getElementById("summaryMonthlyIncome").textContent =
    `${base} ${fmt.format(totalIncome)}`;

  document.getElementById("summaryMonthlyExpenses").textContent =
    `${base} ${fmt.format(totalExpenses)}`;

 // document.getElementById("summaryNetSavings").textContent =
    //`${base} ${fmt.format(netSavings)}`;
    const netSavingsEl = document.getElementById("summaryNetSavings");
netSavingsEl.textContent = `${base} ${fmt.format(netSavings)}`;

if (netSavings < 0) {
  netSavingsEl.style.color = "#dc2626"; // red
} else {
  netSavingsEl.style.color = ""; // default color
}

  // Top spending categories
  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // top 5

  const listEl = document.getElementById("summaryTopCategories");
  listEl.innerHTML = "";

  if (sortedCategories.length === 0) {
    listEl.innerHTML = `<li style="color:var(--text-secondary);">No expenses this month</li>`;
    return;
  }

  sortedCategories.forEach(([cat, amount]) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${cat}</span>
      <span>${base} ${fmt.format(amount)}</span>
    `;
    listEl.appendChild(li);
  });
}
//=================================================

/*const balanceEl = document.getElementById("balance");
const balanceText = base + " " + balance.toFixed(2);

lastBalanceText = balanceText;

if (balanceEl) {
  balanceEl.textContent = balanceHidden ? "••••••" : balanceText;
}*/
//=====================================================
  function updateCharts() {
  const base = document.getElementById("currency").value || "USD";

  let income = 0;
  let expense = 0;

  // Total income/expense in selected currency
  data.forEach(i => {
    const val = convert(i.amount, i.currency, base);
    if (i.type === "income") income += val;
    else expense += val;
  });

  const pieCtx = document.getElementById("pieChart");

  if (pieChart) pieChart.destroy();

  pieChart = new Chart(pieCtx, {
    type: "pie",
    data: {
      labels: ["Income", "Expense"],
      datasets: [{
        data: [income, expense],
        backgroundColor: ["#22c55e", "#ef4444"],
        borderColor: "#020617",
        borderWidth: 2
      }]
    },
    options: {
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#9ca3af",
            padding: 12,
            boxWidth: 12
          }
        }
      },
      animation: {
        duration: 500,
        easing: "easeOutQuad"
      }
    }
  });

  // Monthly chart in selected currency
  const months = {};

  data.forEach(i => {
    const m = new Date(i.timestamp || i.id).toLocaleString('default', { month: 'short' });

    if (!months[m]) months[m] = { income: 0, expense: 0 };

    const val = convert(i.amount, i.currency, base);

    if (i.type === "income") months[m].income += val;
    else months[m].expense += val;
  });

  const labels = Object.keys(months);
  const inc = labels.map(m => months[m].income);
  const exp = labels.map(m => months[m].expense);

  const barCtx = document.getElementById("barChart");

  if (barChart) barChart.destroy();

  barChart = new Chart(barCtx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: `Income (${base})`,
          data: inc,
          backgroundColor: "rgba(34,197,94,0.85)",
          borderRadius: 4,
          maxBarThickness: 26
        },
        {
          label: `Expense (${base})`,
          data: exp,
          backgroundColor: "rgba(239,68,68,0.85)",
          borderRadius: 4,
          maxBarThickness: 26
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          ticks: { color: "#9ca3af" },
          grid: { display: false }
        },
        y: {
          ticks: { color: "#9ca3af" },
          grid: { color: "rgba(31,41,55,0.6)" }
        }
      },
      plugins: {
        legend: {
          labels: { color: "#9ca3af" }
        }
      },
      animation: {
        duration: 600,
        easing: "easeOutCubic"
      }
    }
  });
}
//===========================================================
    //week chart 
  
//=======================================
 function updateWeeklyChart() {
  const base = document.getElementById("currency").value || "USD";

  const today = new Date();
  const dayLabels = [];
  const incomeValues = [];
  const expenseValues = [];

  // Last 7 days labels
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dayLabels.push(d.toLocaleString('default', { weekday: 'short' }));
    incomeValues.push(0);
    expenseValues.push(0);
  }

  // Aggregate income & expense per day in selected currency
  data.forEach(tx => {
    const txDate = new Date(tx.timestamp || tx.id);

    const diffDays = Math.floor((today - txDate) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays <= 6) {
      const index = 6 - diffDays;
      const val = convert(tx.amount, tx.currency, base);

      if (tx.type === "income") {
        incomeValues[index] += val;
      } else if (tx.type === "expense") {
        expenseValues[index] += val;
      }
    }
  });

  const weeklyCtx = document.getElementById("weeklyChart");

  if (weeklyChart) weeklyChart.destroy();

  weeklyChart = new Chart(weeklyCtx, {
    type: "bar",
    data: {
      labels: dayLabels,
      datasets: [
        {
          label: `Income (${base})`,
          data: incomeValues,
          backgroundColor: "rgba(34,197,94,0.85)",
          borderRadius: 6,
          maxBarThickness: 18
        },
        {
          label: `Expense (${base})`,
          data: expenseValues,
          backgroundColor: "rgba(248,113,113,0.8)",
          borderRadius: 6,
          maxBarThickness: 18
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          ticks: { color: "#9ca3af" },
          grid: { display: false }
        },
        y: {
          ticks: { color: "#9ca3af" },
          grid: { color: "rgba(31,41,55,0.5)" },
          beginAtZero: true,
          suggestedMax: undefined
        }
      },
      plugins: {
        legend: {
          labels: { color: "#9ca3af" }
        },
        tooltip: {
          backgroundColor: "#020617",
          borderColor: "#1f2937",
          borderWidth: 1,
          titleColor: "#e5e7eb",
          bodyColor: "#9ca3af"
        }
      },
      animation: {
        duration: 550,
        easing: "easeOutQuad"
      }
    }
  });
}
//================================================================
  const fabBtn = document.getElementById("fabBtn");
  const modalOverlay = document.getElementById("quickModal");
  const modalCloseBtn = document.getElementById("modalCloseBtn");
  const quickCancelBtn = document.getElementById("quickCancel");

  function openQuickModal() {
    modalOverlay.style.display = "flex";
    document.getElementById("quickAmount").focus();
  }

  function closeQuickModal() {
    modalOverlay.style.display = "none";
  }

  fabBtn.addEventListener("click", openQuickModal);
  modalCloseBtn.addEventListener("click", closeQuickModal);
  quickCancelBtn.addEventListener("click", closeQuickModal);

  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      closeQuickModal();
    }
  });

  

  const detailModal = document.getElementById("detailModal");
  const detailCloseBtn = document.getElementById("detailCloseBtn");
  const detailContent = document.getElementById("detailContent");

  function openDetail(id) {
    const tx = data.find(t => t.id === id);
    if (!tx) return;

    const { dateStr, timeStr } = formatDateTime(tx.timestamp || tx.id);

    detailContent.innerHTML = `
      <div class="detail-row">
        <span class="detail-label">Type</span>
        <span class="detail-value">${tx.type}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Payment mode</span>
        <span class="detail-value">${tx.paymentMode ? tx.paymentMode.toUpperCase() : "-"}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Amount</span>
        <span class="detail-value">${tx.amount} ${tx.currency}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Category</span>
        <span class="detail-value">${tx.category}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Subcategory</span>
        <span class="detail-value">${tx.subcategory || "-"}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Description</span>
        <span class="detail-value">${tx.description || "-"}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date</span>
        <span class="detail-value">${dateStr}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Time</span>
        <span class="detail-value">${timeStr}</span>
      </div>
    `;

    detailModal.style.display = "flex";
  }

  function closeDetail() {
    detailModal.style.display = "none";
  }

  detailCloseBtn.addEventListener("click", closeDetail);
  detailModal.addEventListener("click", (e) => {
    if (e.target === detailModal) {
      closeDetail();
    }
  });

 //==============EXPORT PDF AND CSV ============
  function exportToGoogleSheets() {
    if (!data.length) {
    alert("No transactions to export");
      return;
    }

    const rows = data.map((tx) => {
      const { dateStr, timeStr } = formatDateTime(tx.timestamp || tx.id);
      return [
        dateStr,
        timeStr,
        tx.type,
        (tx.paymentMode || "").toUpperCase(),
        tx.category,
        tx.subcategory || "",
        tx.description || "",
        tx.amount,
        tx.currency
      ];
    });

    const header = [
      "Date",
      "Time",
      "Type",
      "Mode",
      "Category",
      "Subcategory",
      "Description",
      "Amount",
      "Currency"
    ];

    const allRows = [header, ...rows];

    const csvContent = allRows
      .map(row =>
        row
          .map(field => {
            const value = String(field ?? "");
            const escaped = value.replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "expense-tracker.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert("CSV exported. You can open it in Excel or upload to Google Sheets.");}
  

  function exportToPDF() {
    if (!data.length) {
      alert("No transactions to export");
      return;
    }

    const columns = [
      "Date",
      "Time",
      "Type",
      "Mode",
      "Category",
      "Subcategory",
      "Description",
      "Amount",
      "Currency"
    ];

    const rows = data.map((tx) => {
      const { dateStr, timeStr } = formatDateTime(tx.timestamp || tx.id);
      return [
        dateStr,
        timeStr,
        tx.type,
        (tx.paymentMode || "").toUpperCase(),
        tx.category,
        tx.subcategory || "",
        tx.description || "",
        tx.amount,
        tx.currency
      ];
    });

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

    doc.setFontSize(14);
    doc.text("Expense tracker report", 40, 30);

    doc.autoTable({
      startY: 50,
      head: [columns],
      body: rows,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [56, 189, 248] },
      theme: "striped"
    });

    doc.save("expense-tracker.pdf");
  }



//====================================================================================
  window.onload = async function () {
    await loadRates();
    await loadAppData();

    applySavedTheme();
    document.getElementById("themeToggle")
      .addEventListener("click", toggleTheme);

    document.getElementById("exportExcelBtn")
      .addEventListener("click", exportToGoogleSheets);

    document.getElementById("exportPdfBtn")
      .addEventListener("click", exportToPDF);
      // NEW currency setup
  const savedCurrency = localStorage.getItem("selectedCurrency") || "USD";
populateCurrencyDropdown("currency", savedCurrency);
populateCurrencyDropdown("quickCurrency", savedCurrency);

    updateCategories();
    updateQuickCategories();
    render();
    calculateBalance();
    updateSummary();
//====================================
  
  const currencySelect = document.getElementById("currency");
  currencySelect.setAttribute("data-hasvalue", currencySelect.value ? "true" : "");

  currencySelect.addEventListener("change", () => {
    const sel = document.getElementById("currency");
    sel.setAttribute("data-hasvalue", sel.value ? "true" : "");
localStorage.setItem("selectedCurrency", sel.value);
    const quickCurrency = document.getElementById("quickCurrency");
    if (quickCurrency) quickCurrency.value = sel.value;

    calculateBalance();
    updateSummary(); 
     updateCharts();
  updateWeeklyChart();
  });
//=====================================
    document.getElementById("type")
      .addEventListener("change", () => {
        updateCategories();
        document.getElementById("catEditName").value = "";
        const catSelect = document.getElementById("category");
        catSelect.setAttribute("data-hasvalue", catSelect.value ? "true" : "");
      });

    document.getElementById("quickType")
      .addEventListener("change", () => {
        updateQuickCategories();
        const catSelect = document.getElementById("quickCategory");
        catSelect.setAttribute("data-hasvalue", catSelect.value ? "true" : "");
      });

    // Use add + delete only
    document.getElementById("catEditSaveBtn")
      .addEventListener("click", addCategoryInline);

    document.getElementById("catEditDeleteBtn")
      .addEventListener("click", deleteCategoryInline);}

       //sw.js link
  
 if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");

      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });

      await registration.update();
    } catch (err) {
      console.error("Service worker registration failed:", err);
    }
  });
}
  

 //===========================================================
//==========toggle button==============//
/*const toggleBalanceBtn = document.getElementById("toggleBalanceBtn");
let balanceHidden = false;
let lastBalanceText = "";

function updateBalanceDisplay() {
  const balanceEl = document.getElementById("balance");
  if (!balanceEl) return;

  if (!balanceHidden) {
    balanceEl.textContent = lastBalanceText;
  } else {
    balanceEl.textContent = "••••••";
  }
}

if (toggleBalanceBtn) {
  toggleBalanceBtn.addEventListener("click", () => {
    const balanceEl = document.getElementById("balance");
    if (!balanceEl) return;

    if (!balanceHidden) {
      lastBalanceText = balanceEl.textContent;
      balanceHidden = true;
      balanceEl.textContent = "••••••";
      toggleBalanceBtn.textContent = "🙈";
    } else {
      balanceHidden = false;
      balanceEl.textContent = lastBalanceText;
      toggleBalanceBtn.textContent = "👁️";
    }
  });
}}}*/
