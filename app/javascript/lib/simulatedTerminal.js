export const HOME = "/home/guest"
export const USER = "guest"
export const HOST = "rails-dev"

const line = (text, tone = "output") => ({ text, tone })

const FILES = {
  [`${HOME}/README.md`]: [
    "# Rails 8.1 + React 19",
    "",
    "这是一个 Docker 开发环境示例。",
    "前端使用 React + esbuild，后端是 Rails + MySQL。",
    "运行 `bin/dev` 可以同时启动 Rails 和 esbuild watch。"
  ].join("\n"),
  [`${HOME}/Gemfile`]: [
    'source "https://rubygems.org"',
    "",
    'gem "rails", "~> 8.1.4"',
    'gem "mysql2", "~> 0.5"',
    'gem "jsbundling-rails"',
    'gem "turbo-rails"',
    'gem "stimulus-rails"'
  ].join("\n"),
  [`${HOME}/package.json`]: [
    "{",
    '  "name": "rails-dev",',
    '  "scripts": {',
    '    "build": "esbuild app/javascript/application.js ...",',
    '    "build:watch": "esbuild ... --watch=forever"',
    "  },",
    '  "dependencies": { "react": "^19.3.1", "react-dom": "^19.3.1" }',
    "}"
  ].join("\n"),
  [`${HOME}/config/database.yml`]: [
    "default: &default",
    "  adapter: mysql2",
    "  encoding: utf8mb4",
    "  host: <%= ENV.fetch(\"DB_HOST\", \"localhost\") %>",
    "  port: <%= ENV.fetch(\"DB_PORT\", 3306) %>",
    "  username: <%= ENV.fetch(\"DB_USER\", \"rails\") %>",
    "  password: <%= ENV.fetch(\"DB_PASSWORD\", \"rails\") %>",
    "",
    "development:",
    "  <<: *default",
    "  database: railsdev_development"
  ].join("\n")
}

const DIRECTORIES = {
  "/": ["home"],
  "/home": ["guest"],
  [HOME]: ["README.md", "Gemfile", "app", "config", "db", "package.json"],
  [`${HOME}/app`]: ["controllers", "models", "views", "javascript"],
  [`${HOME}/app/controllers`]: ["application_controller.rb", "home_controller.rb", "users_controller.rb"],
  [`${HOME}/app/models`]: ["user.rb"],
  [`${HOME}/app/views`]: ["home", "users"],
  [`${HOME}/app/views/home`]: ["index.html.erb"],
  [`${HOME}/app/views/users`]: ["index.html.erb"],
  [`${HOME}/app/javascript`]: ["application.js", "components", "controllers"],
  [`${HOME}/app/javascript/components`]: ["App.jsx", "UsersPage.jsx", "TerminalPage.jsx"],
  [`${HOME}/config`]: ["database.yml", "routes.rb"],
  [`${HOME}/db`]: ["schema.rb", "migrate"],
  [`${HOME}/db/migrate`]: ["20261107153837_create_users.rb"]
}

export function displayPath(cwd) {
  if (cwd === HOME) return "~"
  if (cwd.startsWith(`${HOME}/`)) return `~${cwd.slice(HOME.length)}`
  return cwd
}

export function promptFor(cwd) {
  return `${USER}@${HOST}:${displayPath(cwd)}$`
}

function normalizePath(cwd, target) {
  if (!target || target === "~") return HOME

  let path = target
  if (target === "~/") path = HOME
  else if (target.startsWith("~/")) path = `${HOME}/${target.slice(2)}`
  else if (!target.startsWith("/")) path = `${cwd}/${target}`

  const parts = []
  for (const part of path.split("/")) {
    if (!part || part === ".") continue
    if (part === "..") parts.pop()
    else parts.push(part)
  }

  return `/${parts.join("/")}`
}

function fileContent(path) {
  return FILES[path]
}

function directoryEntries(path) {
  return DIRECTORIES[path]
}

function errors(...messages) {
  return messages.map((message) => line(message, "error"))
}

function helpLines() {
  return [
    line("Available commands:"),
    line("  help              show this help"),
    line("  pwd               print working directory"),
    line("  ls [path]         list directory contents"),
    line("  cd [path]         change directory"),
    line("  cat <file>        print a file"),
    line("  echo <text>       print text"),
    line("  date              show current date"),
    line("  whoami            show current user"),
    line("  uname -a          show simulated system info"),
    line("  ruby -v           Ruby version"),
    line("  rails -v          Rails version"),
    line("  rails routes      sample routes"),
    line("  node -v           Node version"),
    line("  npm -v            npm version"),
    line("  mysql --version   MySQL version"),
    line("  history           command history"),
    line("  clear             clear the screen"),
    line("  exit              leave the simulated shell"),
    line(""),
    line("This is a browser-only simulation. No command runs on the server.", "muted")
  ]
}

export function executeCommand(rawInput, cwd, history = []) {
  const input = rawInput.trim()
  if (!input) return { output: [], cwd }

  const match = input.match(/^(\S+)(?:\s+(.*))?$/)
  const command = match[1]
  const args = match[2] ?? ""

  switch (command) {
    case "help":
      return { output: helpLines(), cwd }

    case "pwd":
      return { output: [line(cwd)], cwd }

    case "whoami":
      return { output: [line(USER)], cwd }

    case "date":
      return { output: [line(new Date().toString())], cwd }

    case "echo":
      return { output: [line(args)], cwd }

    case "ls": {
      const target = args && !args.startsWith("-") ? normalizePath(cwd, args) : cwd
      const file = fileContent(target)

      if (file !== undefined) {
        return { output: [line(target.split("/").pop())], cwd }
      }

      const entries = directoryEntries(target)
      if (!entries) {
        return { output: errors(`ls: cannot access '${args || target}': No such file or directory`), cwd }
      }

      const rendered = entries.map((entry) => {
        const entryPath = target === "/" ? `/${entry}` : `${target}/${entry}`
        return directoryEntries(entryPath) ? `${entry}/` : entry
      })

      return { output: [line(rendered.join("  "))], cwd }
    }

    case "cd": {
      const target = args || "~"
      const path = normalizePath(cwd, target)

      if (!directoryEntries(path)) {
        return { output: errors(`cd: no such file or directory: ${target}`), cwd }
      }

      return { output: [], cwd: path }
    }

    case "cat": {
      if (!args) return { output: errors("cat: missing file operand"), cwd }

      const path = normalizePath(cwd, args)
      const content = fileContent(path)
      if (content !== undefined) {
        return { output: content.split("\n").map((text) => line(text)), cwd }
      }

      if (directoryEntries(path)) {
        return { output: errors(`cat: ${args}: Is a directory`), cwd }
      }

      return { output: errors(`cat: ${args}: No such file or directory`), cwd }
    }

    case "uname":
      if (args === "-a") {
        return {
          output: [line("Linux rails-dev 6.18.33.2-microsoft-standard-WSL2 #1 SMP x86_64 GNU/Linux")],
          cwd
        }
      }
      return { output: [line("Linux")], cwd }

    case "ruby":
      if (args === "-v" || args === "--version") {
        return { output: [line("ruby 3.4.12 (2026-10-23 revision 366f5fdc00) +PRISM [x86_64-linux]")], cwd }
      }
      return { output: errors("ruby: this simulated shell only supports `ruby -v`"), cwd }

    case "rails":
      if (args === "-v" || args === "--version") {
        return { output: [line("Rails 8.1.4.1")], cwd }
      }
      if (args === "routes") {
        return {
          output: [
            line("Prefix Verb   URI Pattern             Controller#Action"),
            line("  root GET    /                       home#index"),
            line(" users GET    /users                  users#index"),
            line("   api GET    /api/users              api/users#index"),
            line("       POST   /api/users              api/users#create")
          ],
          cwd
        }
      }
      return { output: errors("rails: this simulated shell supports `rails -v` and `rails routes`"), cwd }

    case "node":
      if (args === "-v" || args === "--version") {
        return { output: [line("v22.23.4")], cwd }
      }
      return { output: errors("node: this simulated shell only supports `node -v`"), cwd }

    case "npm":
      if (args === "-v" || args === "--version") {
        return { output: [line("10.9.9")], cwd }
      }
      return { output: errors("npm: this simulated shell only supports `npm -v`"), cwd }

    case "mysql":
      if (args === "--version" || args === "-V") {
        return { output: [line("mysql  Ver 8.4.13 for Linux on x86_64 (MySQL Community Server - GPL)")], cwd }
      }
      return { output: errors("mysql: this simulated shell only supports `mysql --version`"), cwd }

    case "history":
      if (history.length === 0) return { output: [line("No commands in history.")], cwd }
      return {
        output: history.map((item, index) => line(`  ${String(index + 1).padStart(2, " ")}  ${item}`)),
        cwd
      }

    case "clear":
      return { output: [], cwd, clear: true }

    case "exit":
      return {
        output: [line("This is a simulated terminal. Close the tab or use the navigation above.")],
        cwd
      }

    case "sudo":
      return {
        output: errors(`[sudo] password for ${USER}:`, `${USER} is not in the sudoers file. This incident has been reported.`),
        cwd
      }

    case "rm":
      return { output: errors("rm: operation not permitted in the simulated terminal"), cwd }

    default:
      return { output: errors(`bash: ${command}: command not found`), cwd }
  }
}
