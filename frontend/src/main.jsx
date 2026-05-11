import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App.jsx";
import "./styles.css";

// Prevent standard browser zoom shortcuts and gestures
document.addEventListener(
  "wheel",
  (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
    }
  },
  { passive: false }
);

document.addEventListener(
  "keydown",
  (e) => {
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === "=" || e.key === "-" || e.key === "+" || e.key === "0")
    ) {
      e.preventDefault();
    }
  },
  { passive: false }
);

document.addEventListener("gesturestart", function (e) {
  e.preventDefault();
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
