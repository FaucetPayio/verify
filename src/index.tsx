import { createRoot } from "react-dom/client";

import App from "containers/App";
import "./bootstrap.css";
import "./style.scss";

createRoot(document.querySelector("#root") as Element)?.render(
  <>
    <App />
  </>,
);
