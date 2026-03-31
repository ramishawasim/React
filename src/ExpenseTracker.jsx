import { useState, useEffect, useRef } from "react";
import "./ExpenseTracker.css";

const CATEGORIES = [
  { name: "Food & Dining",  icon: "🍜", color: "#E8F5E9", accent: "#2E7D32" },
  { name: "Transport",      icon: "🚇", color: "#E3F2FD", accent: "#1565C0" },
  { name: "Housing",        icon: "🏠", color: "#F3E5F5", accent: "#6A1B9A" },
  { name: "Health",         icon: "💊", color: "#FFF3E0", accent: "#E65100" },
  { name: "Entertainment",  icon: "🎬", color: "#FCE4EC", accent: "#AD1457" },
  { name: "Shopping",       icon: "🛍️", color: "#E0F7FA", accent: "#00695C" },
  { name: "Other",          icon: "📦", color: "#F5F5F5", accent: "#424242" },
];

const CAT_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.name, c]));

const fmt = (n) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n);

const today = () => new Date().toISOString().slice(0, 10);

function useLocalStorage(key, init) {
  const [val, setVal] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? init; }
    catch { return init; }
  });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(val)); }, [key, val]);
  return [val, setVal];
}

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const start = prev.current;
    const end = value;
    const dur = 400;
    const startTime = performance.now();
    const tick = (now) => {
      const t = Math.min((now - startTime) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(start + (end - start) * ease);
      if (t < 1) requestAnimationFrame(tick);
      else prev.current = end;
    };
    requestAnimationFrame(tick);
  }, [value]);

  return <span>{fmt(display)}</span>;
}

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useLocalStorage("expenses_v2", []);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [date, setDate] = useState(today());
  const [filter, setFilter] = useState("All");
  const [sortBy, setSortBy] = useState("date");
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const thisMonth = expenses.filter((e) => e.date?.slice(0, 7) === today().slice(0, 7));
  const monthTotal = thisMonth.reduce((s, e) => s + e.amount, 0);

  const catTotals = {};
  expenses.forEach((e) => {
    catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
  });
  const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];

  const filtered = expenses
    .filter((e) => filter === "All" || e.category === filter)
    .sort((a, b) => {
      if (sortBy === "date")   return new Date(b.date) - new Date(a.date);
      if (sortBy === "amount") return b.amount - a.amount;
      return a.desc.localeCompare(b.desc);
    });

  const add = () => {
    const amt = parseFloat(amount);
    if (!desc.trim() || isNaN(amt) || amt <= 0) return;
    setExpenses([{ id: Date.now(), desc: desc.trim(), amount: amt, category, date }, ...expenses]);
    setDesc("");
    setAmount("");
    setDate(today());
    setShowForm(false);
  };

  const remove = (id) => {
    setDeletingId(id);
    setTimeout(() => {
      setExpenses(expenses.filter((e) => e.id !== id));
      setDeletingId(null);
    }, 300);
  };

  const clearAll = () => {
    if (confirm("Clear all expenses?")) setExpenses([]);
  };

  return (
    <div className="et-page">

      {/* Header */}
      <div className="et-header">
        <div>
          <div className="et-app-title">Ledger</div>
          <div className="et-app-sub">Personal expense tracker</div>
        </div>
        <button className="et-add-btn" onClick={() => setShowForm(!showForm)}>
          <span className="et-add-btn-icon">{showForm ? "×" : "+"}</span>
          <span className="et-add-btn-text">{showForm ? "Cancel" : "Add Expense"}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="et-summary-grid">
        <div className="et-stat-card et-stat-card--dark">
          <div className="et-stat-label">All Time</div>
          <div className="et-stat-value"><AnimatedNumber value={total} /></div>
        </div>
        <div className="et-stat-card">
          <div className="et-stat-label">This Month</div>
          <div className="et-stat-value"><AnimatedNumber value={monthTotal} /></div>
        </div>
        <div className="et-stat-card">
          <div className="et-stat-label">Transactions</div>
          <div className="et-stat-value">{expenses.length}</div>
        </div>
        <div className="et-stat-card">
          <div className="et-stat-label">Top Category</div>
          <div className="et-stat-value et-stat-value--sm">
            {topCat ? `${CAT_MAP[topCat[0]]?.icon} ${topCat[0]}` : "—"}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {Object.keys(catTotals).length > 0 && (
        <div className="et-bar-section">
          <div className="et-section-label">Breakdown</div>
          <div className="et-bar-list">
            {Object.entries(catTotals)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amt]) => {
                const pct = total ? (amt / total) * 100 : 0;
                const info = CAT_MAP[cat];
                return (
                  <div key={cat} className="et-bar-row">
                    <div className="et-bar-label">
                      <span>{info?.icon} {cat}</span>
                      <span className="et-bar-label-amount">{fmt(amt)}</span>
                    </div>
                    <div className="et-bar-track">
                      <div
                        className="et-bar-fill"
                        style={{ width: `${pct}%`, background: info?.accent }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Add Expense Form */}
      {showForm && (
        <div className="et-form-card">
          <div className="et-section-label">New Expense</div>
          <input
            className="et-input"
            placeholder="Description"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            autoFocus
          />
          <div className="et-form-row">
            <input
              className="et-input"
              type="number"
              placeholder="Amount (CAD)"
              value={amount}
              min="0"
              step="0.01"
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
            <input
              className="et-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="et-cat-grid">
            {CATEGORIES.map((c) => (
              <button
                key={c.name}
                className="et-cat-chip"
                onClick={() => setCategory(c.name)}
                style={{
                  background: category === c.name ? c.accent : c.color,
                  color:      category === c.name ? "#fff"    : c.accent,
                  border:     `1.5px solid ${category === c.name ? c.accent : "transparent"}`,
                }}
              >
                {c.icon} {c.name}
              </button>
            ))}
          </div>
          <button className="et-submit-btn" onClick={add}>
            Add Expense →
          </button>
        </div>
      )}

      {/* Filter + Sort Controls */}
      {expenses.length > 0 && (
        <div className="et-controls">
          <div className="et-filter-row">
            {["All", ...CATEGORIES.map((c) => c.name)].map((f) => (
              <button
                key={f}
                className={`et-filter-chip ${filter === f ? "et-filter-chip--active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "All" ? "All" : `${CAT_MAP[f]?.icon} ${f}`}
              </button>
            ))}
          </div>
          <select
            className="et-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Sort: Date</option>
            <option value="amount">Sort: Amount</option>
            <option value="name">Sort: Name</option>
          </select>
        </div>
      )}

      {/* Expense List */}
      <div className="et-list">
        {filtered.length === 0 ? (
          <div className="et-empty">
            <div className="et-empty-icon">📋</div>
            <div className="et-empty-title">No expenses yet</div>
            <div className="et-empty-sub">Click "Add Expense" to get started</div>
          </div>
        ) : (
          filtered.map((e) => {
            const info = CAT_MAP[e.category];
            const isDeleting = deletingId === e.id;
            const formattedDate = e.date
              ? new Date(e.date + "T00:00:00").toLocaleDateString("en-CA", {
                  month: "short", day: "numeric", year: "numeric",
                })
              : "";

            return (
              <div
                key={e.id}
                className={`et-expense-row ${isDeleting ? "et-expense-row--deleting" : ""}`}
              >
                <div
                  className="et-expense-icon"
                  style={{ background: info?.color, color: info?.accent }}
                >
                  {info?.icon}
                </div>
                <div className="et-expense-info">
                  <div className="et-expense-name">{e.desc}</div>
                  <div className="et-expense-meta">
                    <span
                      className="et-cat-badge"
                      style={{ background: info?.color, color: info?.accent }}
                    >
                      {e.category}
                    </span>
                    <span className="et-expense-date">{formattedDate}</span>
                  </div>
                </div>
                <div className="et-expense-amount">{fmt(e.amount)}</div>
                <button className="et-del-btn" onClick={() => remove(e.id)} title="Delete">
                  ×
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {expenses.length > 0 && (
        <div className="et-footer">
          <span className="et-footer-count">
            {filtered.length} of {expenses.length} entries shown
          </span>
          <button className="et-clear-btn" onClick={clearAll}>Clear all</button>
        </div>
      )}

    </div>
  );
}