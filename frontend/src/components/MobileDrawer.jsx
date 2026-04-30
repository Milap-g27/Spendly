const MOBILE_LINKS = [
  { label: "Dashboard", value: "dashboard" },
  { label: "Transactions", value: "transactions" },
  { label: "Insights", value: "insights" },
  { label: "Budgets", value: "budgets" },
  { label: "Profile", value: "profile" },
];

export function MobileDrawer({ menuOpen, route, navigate, setMenuOpen }) {
  if (!menuOpen) return null;

  const handleNavigate = (nextRoute) => {
    setMenuOpen(false);
    navigate(nextRoute);
  };

  const handleSignOut = () => {
    setMenuOpen(false);
    navigate("logout");
  };

  return (
    <div className="mobile-drawer">
      <nav className={`mobile-drawer-panel ${menuOpen ? "open" : ""}`}>
        <div className="mobile-drawer-header">
          <div className="sidebar-logo">
            <div className="logo-s">S</div>
            <span className="logo-text">Spendly</span>
          </div>
          <p className="mobile-drawer-subtitle">Navigate your finances</p>
        </div>

        <div className="mobile-drawer-links">
          {MOBILE_LINKS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`mobile-drawer-link ${route === item.value ? "active" : ""}`}
              onClick={() => handleNavigate(item.value)}
            >
              {item.label}
            </button>
          ))}
          <button type="button" className="mobile-drawer-link sign-out" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </nav>

      <button
        type="button"
        className={`mobile-drawer-backdrop ${menuOpen ? "open" : ""}`}
        aria-label="Close menu"
        onClick={() => setMenuOpen(false)}
      />
    </div>
  );
}
