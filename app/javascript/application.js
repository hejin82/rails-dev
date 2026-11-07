import "@hotwired/turbo-rails"
import "./controllers"

import React from "react"
import { createRoot } from "react-dom/client"
import App from "./components/App"

const mountReact = () => {
  const container = document.getElementById("react-root")
  if (!container || container.dataset.reactMounted === "true") return

  container.dataset.reactMounted = "true"
  createRoot(container).render(React.createElement(App))
}

document.addEventListener("turbo:load", mountReact)
