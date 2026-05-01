export function Icon({ name, size = 22 }) {
  const props = { viewBox: "0 0 24 24", width: size, height: size, "aria-hidden": true };
  switch (name) {
    case "menu":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
    case "plus":
      return <svg {...props}><path d="M12 5v14M5 12h14" strokeLinecap="round" strokeWidth="2" stroke="currentColor"/></svg>;
    case "home":
      return <svg {...props} fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>;
    case "swap":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16V4m0 0L4 7m3-3 3 3"/><path d="M17 8v12m0 0 3-3m-3 3-3-3"/></svg>;
    case "barchart":
      return <svg {...props} fill="currentColor"><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg>;
    case "person":
      return <svg {...props} fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>;
    case "cart":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h2l2.4 11.5a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L21 7H7"/><circle cx="10" cy="20" r="1.5" fill="currentColor" stroke="none"/><circle cx="18" cy="20" r="1.5" fill="currentColor" stroke="none"/></svg>;
    case "shopping-bag":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8a3 3 0 0 1 6 0"/><path d="M9 11h.01M15 11h.01"/></svg>;
    case "bus":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="5" y="4" width="14" height="12" rx="3"/><path d="M8 16v3m8-3v3M7 9h10" strokeLinecap="round"/><circle cx="9" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1" fill="currentColor" stroke="none"/></svg>;
    case "bolt":
      return <svg {...props} fill="currentColor"><path d="M13 2 5 13h6l-1 9 9-12h-6l0-8Z"/></svg>;
    case "receipt":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12v18l-2-1-2 1-2-1-2 1-2-1-2 1V3Z"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>;
    case "film":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 5v14M16 5v14M4 10h16M4 14h16"/></svg>;
    case "pill":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5a4 4 0 0 1 5.7 5.7l-5 5A4 4 0 0 1 4 10.9l5-5Z"/><path d="M8 11l4-4"/></svg>;
    case "pizza":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 19 12 5l7 14H5Z"/><path d="M10.2 12.3h.01M12.9 15.2h.01M13.7 10.3h.01"/></svg>;
    case "box":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8l8-4 8 4-8 4-8-4Z"/><path d="M4 8v8l8 4 8-4V8"/><path d="M12 12v8"/></svg>;
    case "handshake":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l4-4 4 4"/><path d="M21 12l-4-4-4 4"/><path d="M7 12l3 3a2 2 0 0 0 2.8 0L16 12"/><path d="M9 15l2 2a2 2 0 0 0 2.8 0l2.2-2"/></svg>;
    case "wallet":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 7h13a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7Z"/><path d="M5 10V8a2 2 0 0 1 2-2h10"/><circle cx="16" cy="12.5" r="1.1"/></svg>;
    case "briefcase":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h10a2 2 0 0 1 2 2v9H5V9a2 2 0 0 1 2-2Z"/><path d="M9 7V6a3 3 0 0 1 6 0v1M5 13h14"/></svg>;
    case "graduation-cap":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-4 9 4-9 4-9-4Z"/><path d="M7 11v3c0 1.7 2.2 3 5 3s5-1.3 5-3v-3"/><path d="M21 9v6"/></svg>;
    case "fuel":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4h7v16H7z"/><path d="M14 7h2l2 2v9"/><path d="M16 11h2"/><path d="M9 8h2"/><path d="M9 12h2"/><circle cx="10.5" cy="18" r="1" fill="currentColor" stroke="none"/></svg>;
    case "arrow-down-circle":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v8m0 0-4-4m4 4 4-4"/></svg>;
    case "laptop":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="6" width="14" height="9" rx="1.5"/><path d="M3 17h18"/></svg>;
    case "search":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="7"/><path d="M20 20 16.5 16.5" strokeLinecap="round"/></svg>;
    case "share":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M8 12h8m-4-4 4 4-4 4"/><rect x="4" y="6" width="16" height="12" rx="3"/></svg>;
    case "download":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v13m0 0-4-4m4 4 4-4"/><path d="M5 20h14"/></svg>;
    case "calendar":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
    case "bell":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M15 17H9m3 4a1 1 0 0 0 1-1h-2a1 1 0 0 0 1 1zM5.07 17A8 8 0 0 1 4 13V9a8 8 0 1 1 16 0v4a8 8 0 0 1-1.07 4H5.07z"/></svg>;
    case "chevron-down":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>;
    case "chevron-right":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>;
    case "camera":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h3l2-3h6l2 3h3v12H4z"/><circle cx="12" cy="13" r="3.25"/></svg>;
    case "mail":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/></svg>;
    case "shield":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 19 5.5V11c0 4.3-2.8 7.7-7 10-4.2-2.3-7-5.7-7-10V5.5L12 3z"/></svg>;
    case "lock":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V8a4 4 0 0 1 8 0v2"/></svg>;
    case "info":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 10.5v6"/><path d="M12 7.5h.01"/></svg>;
    case "document":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5"/><path d="M9 11h6M9 15h6"/></svg>;
    case "logout":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h4"/><path d="M14 7l5 5-5 5"/><path d="M19 12H9"/></svg>;
    case "close":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12"/><path d="M18 6 6 18"/></svg>;
    default:
      return null;
  }
}
