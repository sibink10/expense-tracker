import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { branding } from "./shared/branding";

document.title = branding.appTitle;

const faviconLink =
  document.querySelector<HTMLLinkElement>("link[rel='icon']") ??
  Object.assign(document.createElement("link"), { rel: "icon", type: "image/png" });
faviconLink.href = branding.favicon;
if (!faviconLink.parentNode) document.head.appendChild(faviconLink);

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
