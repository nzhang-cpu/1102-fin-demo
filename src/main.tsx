import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { preloadSharedSettings } from "./app/sharedSettings";
import "./styles/index.css";

// Load the shared demo settings first so the page opens straight into the last saved setup.
preloadSharedSettings().finally(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
