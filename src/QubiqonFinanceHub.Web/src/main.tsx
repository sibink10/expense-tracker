import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          fontFamily: "'Inter', 'Manrope', sans-serif",
          fontSize: "13px",
          fontWeight: 600,
          borderRadius: "10px",
        },
        success: { style: { background: "#0F6E56", color: "#fff" } },
        error: { style: { background: "#A32D2D", color: "#fff" } },
      }}
    />
  </React.StrictMode>
);
