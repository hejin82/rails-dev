import "@hotwired/turbo-rails"
import "./controllers"

import React from "react"
import { createRoot } from "react-dom/client"
import App from "./components/App"
import UsersPage from "./components/UsersPage"
import TerminalPage from "./components/TerminalPage"

const mountComponent = (id, Component) => {
  const container = document.getElementById(id)
  if (!container || container.dataset.reactMounted === "true") return

  container.dataset.reactMounted = "true"
  createRoot(container).render(React.createElement(Component))
}

const mountReact = () => {
  mountComponent("react-root", App)
  mountComponent("users-root", UsersPage)
  mountComponent("terminal-root", TerminalPage)
}

document.addEventListener("turbo:load", mountReact)
