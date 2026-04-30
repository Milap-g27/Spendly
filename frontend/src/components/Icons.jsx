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
    case "bus":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="5" y="4" width="14" height="12" rx="3"/><path d="M8 16v3m8-3v3M7 9h10" strokeLinecap="round"/><circle cx="9" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1" fill="currentColor" stroke="none"/></svg>;
    case "bolt":
      return <svg {...props} fill="currentColor"><path d="M13 2 5 13h6l-1 9 9-12h-6l0-8Z"/></svg>;
    case "heart":
      return <svg {...props} fill="currentColor"><path d="M12 20s-6-4.4-8.4-7.6C1.4 9.4 3.3 5 7.5 5c2.1 0 3.4 1.1 4.5 2.6C13.1 6.1 14.4 5 16.5 5c4.2 0 6.1 4.4 3.9 7.4C18 15.6 12 20 12 20Z"/></svg>;
    case "ticket":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><path d="M5 7h14v3a2 2 0 0 0 0 4v3H5v-3a2 2 0 0 0 0-4V7Z"/><path d="M9 9h6" strokeLinecap="round"/></svg>;
    case "shoe":
      return <svg {...props} fill="currentColor"><path d="M3 16c4 0 6-4 9-4 2.2 0 3.6 1.3 6 1.3 1.5 0 3-.4 3-.4v4.1H3Z"/></svg>;
    case "fork":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M6 3v7a2 2 0 0 0 4 0V3m8 0v18"/></svg>;
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
