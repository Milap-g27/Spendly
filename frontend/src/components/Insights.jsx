import { formatCurrency, buildDonutGradient, exportToCSV } from "../lib/utils";
import { Icon } from "./Icons";

export function InsightsScreen({ totalSpent, byCategory, transactions }) {
  const gradient = buildDonutGradient(byCategory);

  return (
    <div className="screen">
      <div className="insights-header-row">
        <div>
          <h2 className="page-title">Spending Insights</h2>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Track and analyze your spending habits</p>
        </div>
        <button className="export-btn" onClick={() => exportToCSV(transactions)}>
          <Icon name="download" size={15}/>
          Export Report
        </button>
      </div>

      <div className="insights-columns">
        <section className="card donut-card">
          <div className="donut" style={{ background: gradient }}>
            <div className="donut-center">
              <p>Total Spent</p>
              <h2>{formatCurrency(totalSpent)}</h2>
            </div>
          </div>
          <div className="donut-legend">
            {byCategory.map((item) => (
              <div key={item.name} className="donut-legend-item">
                <span className="donut-legend-dot" style={{ backgroundColor: item.color }}/>
                {item.name}
              </div>
            ))}
          </div>
        </section>

        <section className="card category-card">
          <div className="category-card-header">
            <h3 className="section-title">By Category</h3>
          </div>
          <div className="category-list">
            {byCategory.map((item) => (
              <div key={item.name} className="category-row">
                <div className="category-header">
                  <span className="category-name">{item.name}</span>
                  <div className="category-right">
                    <span className="category-amount">{formatCurrency(item.amount)}</span>
                    <span className="category-pct">{item.percent}%</span>
                  </div>
                </div>
                <div className="bar-track">
                  <span className="bar-fill" style={{ width: `${item.percent}%`, backgroundColor: item.color }}/>
                </div>
              </div>
            ))}
            <div className="category-total-row">
              <span>Total</span>
              <span>{formatCurrency(totalSpent)}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
