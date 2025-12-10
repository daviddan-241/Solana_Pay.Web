import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import "./index.css"

if (typeof window !== "undefined") {
  window.Buffer = window.Buffer || require("buffer").Buffer;
  window.global = window;
  window.process = window.process || { env: {}, version: "", browser: true };
}

const root = ReactDOM.createRoot(document.getElementById("root"));

setTimeout(() => {
  document.getElementById("root")?.classList.add("loaded");
}, 100);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
