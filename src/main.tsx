import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initWebVitalsObserver } from "@/lib/webVitals";

initWebVitalsObserver();

createRoot(document.getElementById("root")!).render(<App />);
