import { Icon } from "./Icons";
import { NAV_TABS } from "../lib/constants";

export function AppHeader({ displayName, avatarSrc, onMenuClick, menuOpen }) {
  return (
    <header className="app-header">
      <button
        className="header-icon-btn md:hidden"
        aria-label="Menu"
        aria-expanded={menuOpen}
        onClick={onMenuClick}
      >
        <Icon name="menu" size={24}/>
      </button>
      <div className="header-logo">
        <div className="logo-s">S</div>
        <span className="logo-text">Spendly</span>
      </div>
      <div className="header-avatar">
        {avatarSrc ? <img src={avatarSrc} alt="Profile avatar" /> : (displayName[0]?.toUpperCase() || "N")}
      </div>
    </header>
  );
}

export function BottomNav({ route, navigate }) {
  return (
    <nav className="bottom-nav">
      {NAV_TABS.map((tab) => (
        <button key={tab.value} className={`bottom-nav-item ${route === tab.value ? "active" : ""} ${tab.value === "add" ? "add-tab" : ""}`} onClick={() => navigate(tab.value)}>
          <span className="bottom-nav-icon"><Icon name={tab.icon} size={24}/></span>
          <span className="bottom-nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function DesktopSidebar({ route, navigate, displayName }) {
  return (
    <aside className="desktop-sidebar">
      <div className="sidebar-logo">
        <div className="logo-s">S</div>
        <span className="logo-text">Spendly</span>
      </div>
      <nav className="sidebar-nav">
        {NAV_TABS.map((tab) => (
          <button key={tab.value} className={`sidebar-nav-item ${route === tab.value ? "active" : ""}`} onClick={() => navigate(tab.value)}>
            <span className="sidebar-nav-icon"><Icon name={tab.icon} size={20}/></span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-user">
        <div className="sidebar-avatar">{displayName[0]?.toUpperCase() || "N"}</div>
        <div className="sidebar-user-info">
          <p className="sidebar-user-name">{displayName}</p>
          <p className="sidebar-user-role">Personal</p>
        </div>
        <span className="sidebar-chevron"><Icon name="chevron-down" size={16}/></span>
      </div>
    </aside>
  );
}

export function DesktopHeader({ route, displayName, avatarSrc, activeFilter }) {
  const current = NAV_TABS.find((t) => t.value === route);
  const routeTitles = {
    privacy: "Privacy Policy",
    terms: "Terms of Service",
  };
  return (
    <header className="desktop-header">
      <h1 className="desktop-header-title">{current?.label || routeTitles[route] || "Dashboard"}</h1>
      <div className="desktop-header-right">
        <div className="desktop-date-pill">
          <Icon name="calendar" size={15}/>
          <span>{activeFilter}</span>
        </div>
        <button className="desktop-bell-btn" aria-label="Notifications">
          <Icon name="bell" size={18}/>
        </button>
        <button className="desktop-user-pill">
          <div className="desktop-user-avatar">
            {avatarSrc ? <img src={avatarSrc} alt="Profile avatar" /> : (displayName[0]?.toUpperCase() || "N")}
          </div>
          <span className="desktop-user-name">{displayName}</span>
          <Icon name="chevron-down" size={14}/>
        </button>
      </div>
    </header>
  );
}
