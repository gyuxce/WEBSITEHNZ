import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { MIDTRANS_CLIENT_KEY } from "./lib/supabase";

// Inject Midtrans client key into snap script
const snapScript = document.getElementById("midtrans-snap");
if (snapScript && MIDTRANS_CLIENT_KEY) {
  snapScript.setAttribute("data-client-key", MIDTRANS_CLIENT_KEY);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
