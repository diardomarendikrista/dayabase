import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Provider } from "react-redux";
import App from "./App.jsx";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { store } from "store";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <Provider store={store}>
    <App />
  </Provider>
  // </StrictMode>,
);
