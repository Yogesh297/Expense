import React, { useState, useEffect, useMemo, useContext } from "react";
import { Bar, Pie } from "react-chartjs-2";
import useAxios from '../hooks/useAxios';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const categories = [
  "Food",
  "Transportation",
  "Entertainment",
  "Education",
  "Bills",
  "Other",
];

const todayStr = () => {
  const d = new Date();
  // Format as yyyy-mm-dd for input[type=date]
  return d.toISOString().split("T")[0];
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export default function DashboardPage() {
  // States
  const axios = useAxios();
  const { user, token, logout } = useContext(AuthContext);
  const [expenses, setExpenses] = useState(() => {
    // Load from localStorage if needed
    const stored = localStorage.getItem("expenses");
    return stored ? JSON.parse(stored) : [];
  });
  const [budget, setBudget] = useState(() => {
    const stored = localStorage.getItem("budget");
    return stored ? Number(stored) : 0;
  });
  const [budgetInput, setBudgetInput] = useState(budget || "");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem("darkMode");
    return stored ? JSON.parse(stored) : false;
  });

  // Add expense inputs
  const [titleInput, setTitleInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("Other");
  const [dateInput, setDateInput] = useState(todayStr());

  // Summary calculations:
  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );
  const remainingBudget = budget - totalExpenses > 0 ? budget - totalExpenses : 0;

  // Average daily spend (last 30 days)
  const avgDailySpend = useMemo(() => {
    if (expenses.length === 0) return 0;
    // Filter last 30 days expenses sum / 30
    const now = Date.now();
    const last30Days = expenses.filter(
      (e) => now - new Date(e.date).getTime() <= 30 * ONE_DAY_MS
    );
    const sum30 = last30Days.reduce((sum, e) => sum + e.amount, 0);
    return +(sum30 / 30).toFixed(2);
  }, [expenses]);

  // Monthly expenses for bar chart (for current month)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Category distribution for pie chart
  const categoryDistribution = useMemo(() => {
    const dist = {};
    categories.forEach((cat) => (dist[cat] = 0));
    expenses.forEach((e) => {
      if (dist[e.category] !== undefined) dist[e.category] += e.amount;
      else dist["Other"] += e.amount;
    });
    return dist;
  }, [expenses]);

  // Filtered expenses for search input
  const filteredExpenses = useMemo(() => {
    const lowerFilter = filterText.toLowerCase();
    if (!filterText) return expenses;
    return expenses.filter(
      (e) =>
        e.title.toLowerCase().includes(lowerFilter) ||
        e.category.toLowerCase().includes(lowerFilter) ||
        e.date.includes(lowerFilter) ||
        e.amount.toString().includes(lowerFilter)
    );
  }, [filterText, expenses]);

  // Save to localStorage on expenses or budget or darkMode change
  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [expenses]);
  useEffect(() => {
    localStorage.setItem("budget", budget.toString());
  }, [budget]);
  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  // Handlers
  async function handleAddExpense(e) {
    e.preventDefault();

    const amountNum = parseFloat(amountInput);
    if (
      !titleInput.trim() ||
      isNaN(amountNum) ||
      amountNum <= 0 ||
      !dateInput
    ) {
      alert("Please enter valid Title, Amount > 0, and Date");
      return;
    }

    try {
      const res = await axios.post(
        'http://localhost:5000/api/expenses',
        {
          title: titleInput.trim(),
          amount: amountNum,
          category: categoryInput,
          date: dateInput,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Add to local state after backend confirms save
      setExpenses((prev) => [...prev, res.data]);

      // Reset form
      setTitleInput("");
      setAmountInput("");
      setCategoryInput("Other");
      setDateInput(todayStr());
    } catch (err) {
      console.error("Failed to add expense:", err);
      alert("Failed to save expense. Please try again.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this expense?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/expenses/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setExpenses((prev) => prev.filter((e) => e._id !== id)); // use _id from backend
    } catch (err) {
      console.error("Failed to delete:", err);
      alert("Failed to delete expense.");
    }
  }

  // Editing inline logic
  const [editExpenseID, setEditExpenseID] = useState(null);
  const [editFields, setEditFields] = useState({
    title: "",
    amount: "",
    category: "Other",
    date: todayStr(),
  });

  function startEdit(expense) {
    setEditExpenseID(expense._id);
    setEditFields({
      title: expense.title,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date,
    });
  }

  function cancelEdit() {
    setEditExpenseID(null);
    setEditFields({
      title: "",
      amount: "",
      category: "Other",
      date: todayStr(),
    });
  }

  async function saveEdit(id) {
    const amountNum = parseFloat(editFields.amount);
    if (
      !editFields.title.trim() ||
      isNaN(amountNum) ||
      amountNum <= 0 ||
      !editFields.date
    ) {
      alert("Please enter valid Title, Amount > 0, and Date");
      return;
    }

    try {
      const res = await axios.put(
        `http://localhost:5000/api/expenses/${id}`,
        {
          title: editFields.title.trim(),
          amount: amountNum,
          category: editFields.category,
          date: editFields.date,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // ✅ Update just the edited expense in state
      setExpenses((prev) =>
        prev.map((e) => (e._id === id ? res.data : e))
      );
      cancelEdit();
    } catch (err) {
      console.error("Failed to update:", err);
      alert("Failed to save changes.");
    }
  }

  function handleExportPDF() {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Expense Report", 14, 22);

    doc.setFontSize(12);
    doc.text(`Budget: $${budget}`, 14, 32);
    doc.text(`Total Expenses: $${totalExpenses.toFixed(2)}`, 14, 40);
    doc.text(`Remaining Budget: $${remainingBudget.toFixed(2)}`, 14, 48);

    const tableColumn = ["Title", "Category", "Amount", "Date"];
    const tableRows = expenses.map((expense) => [
      expense.title,
      expense.category,
      `$${expense.amount.toFixed(2)}`,
      new Date(expense.date).toLocaleDateString(),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 55,
    });

    doc.save("expense-report.pdf");
  }

  function handleExportCSV() {
    let csv = "Title,Category,Amount,Date\n";
    expenses.forEach((e) => {
      csv += `"${e.title}","${e.category}",${e.amount},"${e.date}"\n`;
    });
    // Download CSV file
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expenses.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  const monthlyExpensesForChart = useMemo(() => {
    const grouped = {}; // { "Jul 2025": 1000, "Jun 2025": 700, ... }

    expenses.forEach((e) => {
      const date = new Date(e.date);
      const label = date.toLocaleString("default", { month: "short", year: "numeric" });

      if (!grouped[label]) grouped[label] = 0;
      grouped[label] += e.amount;
    });

    // Sort by month/year
    const sortedLabels = Object.keys(grouped).sort((a, b) => {
      const [aMonth, aYear] = a.split(" ");
      const [bMonth, bYear] = b.split(" ");
      const aDate = new Date(`${aMonth} 1, ${aYear}`);
      const bDate = new Date(`${bMonth} 1, ${bYear}`);
      return aDate - bDate;
    });

    return {
      labels: sortedLabels,
      data: sortedLabels.map((label) => grouped[label]),
    };
  }, [expenses]);

  // Chart.js data
  const barData = {
    labels: monthlyExpensesForChart.labels,
    datasets: [
      {
        label: "Monthly Expenses",
        data: monthlyExpensesForChart.data,
        backgroundColor: darkMode ? "rgba(100, 149, 237, 0.7)" : "rgba(54, 162, 235, 0.7)",
        borderRadius: 4,
      },
    ],
  };


  const pieData = {
    labels: categories,
    datasets: [
      {
        label: "Category Distribution",
        data: categories.map((cat) => categoryDistribution[cat]),
        backgroundColor: [
          "#FF6B6B", // Food - red
          "#4D96FF", // Transportation - blue
          "#FF9F1C", // Entertainment - orange
          "#2EC4B6", // Education - teal
          "#9D4EDD", // Bills - purple
          "#8E8D8A", // Other - gray
        ],
        borderWidth: 1,
      },
    ],
  };
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        console.log("Token:", token);
        const res = await axios.get('http://localhost:5000/api/expenses', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setExpenses(res.data);
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          logout(); // auto logout on invalid token
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, navigate, logout]);


  const toggleDarkMode = () => setDarkMode((d) => !d);

  // Budget progress % capped at 100
  const budgetPercent =
    budget > 0 ? Math.min((totalExpenses / budget) * 100, 100) : 0;

  return (
    <>
      <style>{`
        /* Reset and base styles */
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          background-color: ${darkMode ? "#121212" : "#f5f5f5"};
          color: ${darkMode ? "#e0e0e0" : "#121212"};
          transition: background-color 0.3s, color 0.3s;
        }
          .container {
  width: 100%;
  max-width: 1200px; /* Optional: prevent it from being too wide on desktops */
  margin: 0 auto;
  padding: 1rem;
}
  body, html {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

.container, main {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}
  .expense-list {
  width: 100%;
  overflow-x: auto;
}

.expense-list table {
  min-width: 600px; /* or any width that fits your columns */
  width: 100%;
  border-collapse: collapse;
}
  .charts-container {
  display: flex;
  // flex-direction: column;
  gap: 1.5rem;
  margin-top: 2rem;
  width: 100%;
  overflow-x: hidden;
}

.chart-wrapper {
  overflow-x: auto;           /* enables horizontal scroll */
  padding-bottom: 1rem;
}

.chart-wrapper canvas {
  min-width: 300px;           /* ensures chart does not shrink too much */
  max-width: 100%;
}
        a {
          cursor: pointer;
          transition: color 0.2s;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
        button {
          cursor: pointer;
        }
        /* Navbar */
       nav {
  top: 0;
  background-color: ${darkMode ? "#1f1f1f" : "#fff"};
  box-shadow: 0 2px 4px rgb(0 0 0 / 0.1);
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  z-index: 100;
  border-bottom: 1px solid ${darkMode ? "#333" : "#ddd"};
  gap: 0.75rem;
}

nav .brand {
  font-weight: 700;
  font-size: 1.3rem;
  color: ${darkMode ? "#0ef" : "#06f"};
  user-select: none;
  flex: 1 1 100%;
}

nav .nav-buttons {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5rem;
  flex: 1 1 100%;
}

@media (min-width: 768px) {
  nav {
    flex-wrap: nowrap;
  }

  nav .brand {
    flex: 0 0 auto;
  }

  nav .nav-buttons {
    justify-content: flex-end;
    flex: 1 1 auto;
  }
}

nav button,
nav select,
nav label {
  background-color: ${darkMode ? "#333" : "#e7e7f0"};
  border: none;
  border-radius: 4px;
  color: ${darkMode ? "#e0e0e0" : "#161616"};
  padding: 0.4rem 0.8rem;
  font-weight: 600;
  font-size: 0.9rem;
  transition: background-color 0.3s;
  white-space: nowrap;
}

nav button:hover,
nav select:hover,
nav label:hover {
  background-color: ${darkMode ? "#555" : "#c4c4d2"};
}

nav label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  user-select: none;
  font-size: 0.9rem;
}

nav label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

nav .logout {
  color: red;
  font-weight: 600;
  background: none;
  padding: 0;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  margin-left: 0.5rem;
}

nav .logout:hover {
  text-decoration: underline;
}

        /* Layout container */
        .container {
          max-width: 960px;
          margin: 1rem auto 3rem auto;
          padding: 0 1rem;
          user-select: none;
        }

        /* Budget Section */
        .budget-section {
          background-color: ${darkMode ? "#222" : "#fff"};
          border-radius: 8px;
          padding: 1rem 1.5rem;
          margin-bottom: 1.5rem;
          box-shadow: ${darkMode ? "0 2px 8px rgb(0 0 0 / 0.8)" : "0 2px 8px rgb(0 0 0 / 0.1)"};
          user-select: text;
        }
        .budget-section h2 {
          margin: 0 0 0.5rem 0;
        }
        .budget-input-group {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .budget-input-group input {
          flex-grow: 1;
          padding: 0.4rem 0.8rem;
          font-size: 1rem;
          border-radius: 4px;
          border: 1.5px solid ${darkMode ? "#555" : "#ccc"};
          background-color: ${darkMode ? "#333" : "#fafafa"};
          color: ${darkMode ? "#eee" : "#121212"};
          transition: border-color 0.2s, background-color 0.3s, color 0.3s;
          user-select: text;
        }
        .budget-input-group input:focus {
          outline: none;
          border-color: ${darkMode ? "#0ef" : "#06f"};
        }
        .budget-input-group button {
          padding: 0.4rem 1rem;
          font-weight: 600;
          border: none;
          border-radius: 6px;
          background-color: ${darkMode ? "#0ef" : "#06f"};
          color: white;
          transition: background-color 0.2s;
        }
        .budget-input-group button:hover {
          background-color: ${darkMode ? "#09c" : "#054ed4"};
        }
        .budget-progress {
          margin-top: 0.7rem;
          background-color: ${darkMode ? "#333" : "#ddd"};
          height: 18px;
          border-radius: 9px;
          overflow: hidden;
        }
        .budget-progress-bar {
          height: 100%;
          background-color: ${budgetPercent < 70 ? (darkMode ? "#0ef" : "#06f") : budgetPercent < 100 ? (darkMode ? "#fbbc0d" : "#f5a623") : (darkMode ? "#ff4b4b" : "#d33")};
          width: ${budgetPercent}%;
          transition: width 0.4s ease;
        }
        .budget-remaining {
          margin-top: 0.5rem;
          font-weight: 600;
          color: ${budgetPercent >= 100 ? (darkMode ? "#ff4b4b" : "#d33") : remainingBudget > 0 ? (darkMode ? "#0ef" : "#06f") : (darkMode ? "#eee" : "#000")};
          user-select: text;
        }

        /* Add Expense Form */
        form {
          background-color: ${darkMode ? "#222" : "#fff"};
          border-radius: 8px;
          padding: 1rem 1.5rem;
          margin-bottom: 1.5rem;
          box-shadow: ${darkMode ? "0 2px 8px rgb(0 0 0 / 0.8)" : "0 2px 8px rgb(0 0 0 / 0.1)"};
        }
        form h2 {
          margin-top: 0;
          user-select: none;
        }
        form .inputs-row {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }
        form input,
        form select {
          flex: 1;
          padding: 0.5rem 0.75rem;
          font-size: 1rem;
          border-radius: 6px;
          border: 1.5px solid ${darkMode ? "#555" : "#ccc"};
          background-color: ${darkMode ? "#333" : "#fafafa"};
          color: ${darkMode ? "#eee" : "#121212"};
          transition: border-color 0.2s;
          user-select: text;
        }
        form input[type="date"] {
          max-width: 160px;
        }
        form input:focus,
        form select:focus {
          outline: none;
          border-color: ${darkMode ? "#0ef" : "#06f"};
        }
        form button {
          background-color: ${darkMode ? "#0ef" : "#06f"};
          border: none;
          padding: 0.55rem 1.2rem;
          border-radius: 6px;
          color: white;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          user-select: none;
        }
        form button:hover {
          background-color: ${darkMode ? "#09c" : "#054ed4"};
        }

        /* Expense list */
        .expense-list {
          background-color: ${darkMode ? "#222" : "#fff"};
          border-radius: 8px;
          box-shadow: ${darkMode ? "0 2px 8px rgb(0 0 0 / 0.8)" : "0 2px 8px rgb(0 0 0 / 0.1)"};
          overflow-x: auto;
          margin-bottom: 1.5rem;
        }
        .search-bar {
          margin-bottom: 0.8rem;
        }
        .search-bar input {
          width: 100%;
          max-width: 300px;
          padding: 0.4rem 0.8rem;
          font-size: 1rem;
          border-radius: 6px;
          border: 1.5px solid ${darkMode ? "#555" : "#ccc"};
          background-color: ${darkMode ? "#333" : "#fafafa"};
          color: ${darkMode ? "#eee" : "#121212"};
          transition: border-color 0.2s;
          user-select: text;
        }
        .search-bar input:focus {
          outline: none;
          border-color: ${darkMode ? "#0ef" : "#06f"};
        }
        table {
          width: 100%;
          border-collapse: collapse;
          user-select: none;
          min-width: 600px;
        }
        thead {
          background-color: ${darkMode ? "#111" : "#f0f0f0"};
          user-select: none;
        }
        th, td {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid ${darkMode ? "#333" : "#ddd"};
          text-align: left;
          vertical-align: middle;
        }
        th {
          font-weight: 700;
          color: ${darkMode ? "#aaa" : "#444"};
          white-space: nowrap;
        }
        tbody tr:hover {
          background-color: ${darkMode ? "#333" : "#f9f9fe"};
        }
        .actions {
          display: flex;
          gap: 0.6rem;
          user-select: none;
        }
        .actions a {
          color: ${darkMode ? "#09f" : "#06f"};
          font-weight: 600;
          font-size: 0.9rem;
          user-select: none;
        }
        .actions a.delete {
          color: ${darkMode ? "#f55" : "#d33"};
        }
        .actions a:hover {
          text-decoration: underline;
        }
        /* Inline edits inputs */
        .edit-input {
          width: 100%;
          box-sizing: border-box;
          padding: 0.3rem 0.5rem;
          font-size: 0.9rem;
          border-radius: 4px;
          border: 1.5px solid ${darkMode ? "#555" : "#ccc"};
          background-color: ${darkMode ? "#333" : "#fafafa"};
          color: ${darkMode ? "#eee" : "#121212"};
        }

        /* Charts container */
        .charts-container {
          display: flex;
          flex-wrap: wrap;
          background-color: ${darkMode ? "#222" : "#fff"};
          border-radius: 8px;
          box-shadow: ${darkMode ? "0 2px 8px rgb(0 0 0 / 0.8)" : "0 2px 8px rgb(0 0 0 / 0.1)"};
          padding: 1rem 1.5rem;
          gap: 2rem;
          justify-content: center;
          margin-bottom: 1.5rem;
          user-select: none;
        }
        .chart-wrapper {
          flex: 1 1 300px;
          max-width: 420px;
        }
        .chart-wrapper h3 {
          text-align: center;
          margin-bottom: 0.4rem;
          user-select: text;
          color: ${darkMode ? "#ccc" : "#222"};
        }

        /* Summary cards */
        .summary-cards {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
          user-select: none;
        }
        .summary-card {
          background-color: ${darkMode ? "#333" : "#fff"};
          color: ${darkMode ? "#eee" : "#121212"};
          flex: 1 1 150px;
          border-radius: 8px;
          padding: 1rem 1.3rem;
          box-shadow: ${darkMode ? "0 2px 6px rgb(0 0 0 / 0.6)" : "0 1px 4px rgb(0 0 0 / 0.1)"};
          display: flex;
          flex-direction: column;
          align-items: center;
          user-select: text;
        }
        .summary-card h4 {
          margin: 0 0 0.5rem 0;
          font-weight: 700;
        }
        .summary-card p {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 800;
          color: ${darkMode ? "#0ef" : "#06f"};
        }

        /* Responsive adjustments */
        @media (max-width: 720px) {
          .charts-container {
            flex-direction: column;
            gap: 2rem;
            padding: 1rem;
          }
          .summary-cards {
            flex-direction: column;
          }
          .summary-card {
            flex: 1;
          }
          form .inputs-row {
            flex-direction: column;
          }
          form input[type="date"] {
            max-width: 100%;
          }
        }
      `}</style>

      <nav className="flex flex-col sm:flex-row justify-between items-center gap-4 px-4 py-3 bg-white dark:bg-gray-800 shadow-md">
        <div className="brand text-xl font-bold text-indigo-600 dark:text-indigo-300">
          Workik AI
        </div>
        <div className="nav-buttons flex flex-wrap items-center gap-3 justify-center sm:justify-end">
          <button onClick={handleExportPDF} title="Export expense report PDF" aria-label="Export PDF">
            Export PDF
          </button>
          <button onClick={handleExportCSV} title="Export expenses as CSV" aria-label="Export CSV">
            Export CSV
          </button>
          <button
            onClick={() => setShowAnalysis((v) => !v)}
            aria-pressed={showAnalysis}
            title="Toggle Analysis Charts"
            aria-label="Toggle analysis"
          >
            {showAnalysis ? "Hide Analysis" : "Show Analysis"}
          </button>
          <label htmlFor="darkModeToggle" title="Toggle Dark / Light Mode">
            <input
              type="checkbox"
              id="darkModeToggle"
              checked={darkMode}
              onChange={toggleDarkMode}
            />
            Dark Mode
          </label>
          <h1 className="text-3xl font-bold text-red-800">Welcome, {user?.name}</h1>
          <button
            onClick={logout}
            className="text-red-600 hover:text-red-800 font-semibold"
          >
            Logout
          </button>

        </div>
      </nav>

      <main className="container mx-auto px-4 sm:px-6 py-6 space-y-8" role="main">
        {/* Budget Section */}
        <section className="budget-section" aria-labelledby="budget-heading">
          <h2 id="budget-heading">Set Your Budget</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const parsed = parseFloat(budgetInput);
              if (isNaN(parsed) || parsed < 0) {
                alert("Please enter a valid non-negative budget");
                return;
              }
              setBudget(parsed);
            }}
            aria-label="Set budget form"
          >
            <div className="budget-input-group flex flex-col sm:flex-row gap-3">
              <input
                className="w-full sm:w-1/2 px-3 py-2 rounded border dark:bg-gray-800"
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter your budget amount"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                aria-required="true"
                aria-describedby="budget-helptext"
              />
              <button className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition">Save Budget</button>
            </div>
            <div id="budget-helptext" style={{ fontSize: "0.9rem", marginTop: "0.3rem", userSelect: "text" }}>
              Current budget: <strong>${budget.toFixed(2)}</strong>
            </div>
          </form>
          <div className="budget-progress" aria-label="Budget progress indicator" role="progressbar" aria-valuemin={0} aria-valuemax={budget} aria-valuenow={totalExpenses}>
            <div className="budget-progress-bar" />
          </div>
          <div className="budget-remaining" aria-live="polite" aria-atomic="true">
            {budget > 0
              ? `Remaining Budget: $${remainingBudget.toFixed(2)}`
              : "Set a budget to start tracking remaining amount."}
          </div>
        </section>

        {/* Add Expense */}
        <form onSubmit={handleAddExpense} aria-labelledby="add-expense-heading">
          <h2 id="add-expense-heading">Add Expense</h2>
          <div className="inputs-row">
            <input
              type="text"
              placeholder="Title"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              aria-label="Expense title"
              required
              spellCheck="false"
            />
            <input
              type="number"
              placeholder="Amount"
              min="0"
              step="0.01"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              aria-label="Expense amount"
              required
            />
            <select
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
              aria-label="Expense category"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={dateInput}
              max={todayStr()}
              onChange={(e) => setDateInput(e.target.value)}
              aria-label="Expense date"
              required
            />
          </div>
          <button type="submit">Add</button>
        </form>

        {/* Search/Filter Bar */}
        <div className="search-bar">
          <input
            type="search"
            placeholder="Search expenses..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            aria-label="Search expenses"
            spellCheck="false"
            autoComplete="off"
          />
        </div>

        {/* Expense List */}
        <section className="expense-list" aria-labelledby="expense-list-heading" tabIndex={-1}>
          <h2 id="expense-list-heading">Expense List</h2>
          {filteredExpenses.length === 0 ? (
            <p>No expenses found.</p>
          ) : (
            <table role="table">
              <thead>
                <tr>
                  <th scope="col">Title</th>
                  <th scope="col">Category</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Date</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((exp) => (
                  <tr key={exp._id}>
                    <td>
                      {editExpenseID === exp._id ? (
                        <input
                          className="edit-input"
                          type="text"
                          value={editFields.title}
                          onChange={(e) =>
                            setEditFields((f) => ({ ...f, title: e.target.value }))
                          }
                          aria-label="Edit title"
                        />
                      ) : (
                        exp.title
                      )}
                    </td>
                    <td>
                      {editExpenseID === exp._id ? (
                        <select
                          className="edit-input"
                          value={editFields.category}
                          onChange={(e) =>
                            setEditFields((f) => ({ ...f, category: e.target.value }))
                          }
                          aria-label="Edit category"
                        >
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      ) : (
                        exp.category
                      )}
                    </td>
                    <td>
                      {editExpenseID === exp._id ? (
                        <input
                          className="edit-input"
                          type="number"
                          min="0"
                          step="0.01"
                          value={editFields.amount}
                          onChange={(e) =>
                            setEditFields((f) => ({ ...f, amount: e.target.value }))
                          }
                          aria-label="Edit amount"
                        />
                      ) : (
                        `$${exp.amount.toFixed(2)}`
                      )}
                    </td>
                    <td>
                      {editExpenseID === exp._id ? (
                        <input
                          className="edit-input"
                          type="date"
                          max={todayStr()}
                          value={editFields.date}
                          onChange={(e) =>
                            setEditFields((f) => ({ ...f, date: e.target.value }))
                          }
                          aria-label="Edit date"
                        />
                      ) : (
                        new Date(exp.date).toLocaleDateString()
                      )}
                    </td>
                    <td className="actions" aria-label="Expense actions">
                      {editExpenseID === exp._id ? (
                        <>
                          <a
                            href="#!"
                            onClick={() => saveEdit(exp._id)}
                            aria-label="Save edits"
                          >
                            Save
                          </a>
                          <a
                            href="#!"
                            onClick={cancelEdit}
                            aria-label="Cancel edits"
                            style={{ color: darkMode ? "#bbb" : "#666" }}
                          >
                            Cancel
                          </a>
                        </>
                      ) : (
                        <>
                          <a
                            href="#!"
                            onClick={() => startEdit(exp)}
                            aria-label={`Edit expense ${exp.title}`}
                          >
                            Edit
                          </a>
                          <a
                            href="#!"
                            className="delete"
                            onClick={() => handleDelete(exp._id)}
                            aria-label={`Delete expense ${exp.title}`}
                          >
                            Delete
                          </a>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Summary Cards */}
        <section aria-label="Summary of expenses" className="summary-cards">
          <div className="summary-card" role="article" tabIndex={0} aria-label="Total expenses">
            <h4>Total Expenses</h4>
            <p>${totalExpenses.toFixed(2)}</p>
          </div>
          <div className="summary-card" role="article" tabIndex={0} aria-label="Remaining budget">
            <h4>Remaining Budget</h4>
            <p>${remainingBudget.toFixed(2)}</p>
          </div>
          <div className="summary-card" role="article" tabIndex={0} aria-label="Average daily spend last 30 days">
            <h4>Avg Daily Spend (30d)</h4>
            <p>${avgDailySpend.toFixed(2)}</p>
          </div>
        </section>

        {/* Charts Section */}
        {showAnalysis && (
          <section
            aria-label="Expense analysis charts"
            className="charts-container"
          >
            <div className="chart-wrapper" tabIndex={0}>
              <h3>Monthly Expenses</h3>
              <Bar
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      labels: { color: darkMode ? "white" : "black" },
                    },
                    tooltip: {
                      enabled: true,
                    },
                  },
                  scales: {
                    x: {
                      ticks: { color: darkMode ? "#eee" : "#111" },
                      grid: { color: darkMode ? "#444" : "#ccc" },
                    },
                    y: {
                      ticks: { color: darkMode ? "#eee" : "#111" },
                      grid: { color: darkMode ? "#444" : "#ccc" },
                      beginAtZero: true,
                    },
                  },
                  animation: {
                    duration: 500,
                    easing: "easeOutQuart",
                  },
                }}
                data={barData}
                aria-label="Bar chart of monthly expenses"
              />
            </div>
            <div className="chart-wrapper" tabIndex={0}>
              <h3>Category Distribution</h3>
              <Pie
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: { color: darkMode ? "white" : "black" },
                    },
                    tooltip: {
                      enabled: true,
                      callbacks: {
                        label: (context) => {
                          const label = context.label || "";
                          const val = context.parsed || 0;
                          return `${label}: $${val.toFixed(2)}`;
                        },
                      },
                    },
                  },
                  animation: {
                    duration: 700,
                    easing: "easeOutQuart",
                  },
                }}
                data={pieData}
                aria-label="Pie chart of expense category distribution"
              />
            </div>
          </section>
        )}
      </main>
    </>
  );
}