import { render } from "preact";
import { App } from "./App.js";
import { ErrorBoundary } from "./components/ErrorBoundary.js";
import "./styles.css";

const root = document.getElementById("app");
if (!root) throw new Error("Application root was not found.");
render(<ErrorBoundary><App /></ErrorBoundary>, root);
