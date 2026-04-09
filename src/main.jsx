import React from "react";
import ReactDOM from "react-dom/client";
import { LangProvider } from "./i18n";
import MoonRhythm from "./MoonRhythm";
import InstallPrompt from "./InstallPrompt";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LangProvider>
      <MoonRhythm />
      <InstallPrompt />
    </LangProvider>
  </React.StrictMode>
);
