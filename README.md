# Rails + React 开发环境（Docker + MySQL + VS Code Dev Containers）

这是一个独立的 Rails 8.1 项目，和 `java-dev`、`python-gpu` 以及现有的 Python 分析脚本互不影响。

技术栈：

- Ruby 3.4.12
- Rails 8.1.4.1
- MySQL 8.4
- Puma + Propshaft + esbuild
- React 19 + React DOM
- Hotwire Turbo + Stimulus（通过 npm 引入）
- Node.js 22 + npm
- VS Code Dev Containers + Ruby LSP

## 本机验证结果（2026-11-07）

| 项目 | 结果 |
| --- | --- |
| 镜像构建 | `rails-dev:latest` 构建成功 |
| Rails | 8.1.4.1 |
| Ruby | 3.4.12 |
| MySQL | 8.4.13 |
| 应用启动 | `http://localhost:3000/up` 返回 200 |
| 首页 | `/` 返回 Rails 8.1 + MySQL 页面 |
| 测试 | `bin/rails test`：10 runs, 42 assertions, 0 failures |
| 代码检查 | RuboCop：34 files inspected, no offenses |
| 数据库 | `railsdev_development`、`railsdev_test`、`users` 表已创建 |
| 模拟终端 | `/terminal` 返回 200，命令引擎 smoke test 通过 |
| React | 19.3.1，esbuild 打包的 `/assets/application-*.js` 返回 200 |
| Node / npm | 22.23.4 / 10.9.9 |
| Ruby LSP | 0.26.11 可用 |

## 目录结构（关键文件）

```text
rails-dev/
├─ .devcontainer/
│  └─ devcontainer.json   # VS Code 连接 Compose 的 web 服务
├─ app/
│  ├─ controllers/
│  │  ├─ users_controller.rb        # /users 页面
│  │  ├─ terminal_controller.rb     # /terminal 页面
│  │  └─ api/users_controller.rb    # JSON CRUD API
│  ├─ models/user.rb
│  ├─ javascript/
│  │  ├─ application.js             # Turbo/Stimulus/React 入口
│  │  ├─ components/App.jsx
│  │  ├─ components/UsersPage.jsx   # 用户 CRUD 界面
│  │  ├─ components/TerminalPage.jsx
│  │  ├─ lib/simulatedTerminal.js  # 前端命令解析
│  │  └─ controllers/
│  └─ views/
│     ├─ home/index.html.erb
│     ├─ terminal/index.html.erb
│     └─ users/index.html.erb
├─ bin/
│  ├─ rails
│  ├─ dev                  # 启动 Rails + esbuild watch
│  └─ docker-entrypoint    # 修复 Windows 挂载权限 + bundle/db 准备
├─ config/
│  ├─ database.yml         # 从环境变量读取 DB_HOST/DB_USER 等
│  └─ routes.rb
├─ db/
│  ├─ migrate/
│  │  └─ 20261107153837_create_users.rb
│  ├─ init/
│  │  └─ 01-create-test-db.sql  # 创建 railsdev_test 并授权
│  └─ seeds.rb
├─ test/
│  ├─ integration/home_test.rb
│  ├─ integration/users_page_test.rb
│  ├─ integration/users_api_test.rb
│  ├─ integration/terminal_page_test.rb
│  └─ models/user_test.rb
├─ Dockerfile              # Ruby 3.4 + Node 22 + Rails 依赖
├─ compose.yaml            # web + MySQL 8.4
├─ package.json / package-lock.json
├─ Gemfile / Gemfile.lock
├─ .dockerignore
├─ .gitattributes
└─ README.md
```

## 快速开始（VS Code Dev Containers）

### 1. 打开项目

```powershell
code C:\work\deepseek\pj1\rails-dev
```

### 2. 安装 Dev Containers 扩展（如果还没装）

```powershell
code --install-extension ms-vscode-remote.remote-containers
```

### 3. 在容器中重新打开

`Ctrl+Shift+P` 执行：

```text
Dev Containers: Reopen in Container
```

中文界面可能是 `Dev Containers: 在容器中重新打开`。

VS Code 会用 `compose.yaml` 启动两个服务：

- `web`：Rails + Puma，监听 3000
- `db`：MySQL 8.4

首次会构建镜像并安装全部 gem（100+）和 npm 依赖，之后启动会复用 `bundle` / `node_modules` 卷，速度快很多。
左下角显示 `Dev Container: Rails 8.1 + MySQL 8.4`。

### 4. 验证

打开 <http://localhost:3000>，应看到 Rails 8.1 / MySQL 页面；健康检查：

```text
http://localhost:3000/up
```

容器终端里执行：

```bash
bin/rails test
bin/rails routes
bin/rails console
```

### 5. 常用命令

```bash
# 生成 scaffold（会自动生成 migration 和测试）
bin/rails generate scaffold Post title:string body:text
bin/rails db:migrate

# 只生成 model
bin/rails generate model Comment post:references body:text
bin/rails db:migrate

# 代码检查 / 自动修复
bin/rubocop
bin/rubocop -A

# 查看日志
tail -f log/development.log
```

## 命令行方式（不用 Dev Containers）

```powershell
cd C:\work\deepseek\pj1\rails-dev

# 构建并启动 web + db
docker compose up -d --build

# 查看状态和日志
docker compose ps
docker compose logs -f web

# 健康检查
curl.exe http://localhost:3000/up

# 跑测试 / 进 Rails console
docker compose exec web bin/rails test
docker compose exec web bin/rails console

# 进入 MySQL
docker compose exec db mysql -u rails -prails railsdev_development

# 停止（保留数据库、bundle、node_modules 卷）
docker compose down
```

`docker compose down -v` 会同时删除数据库数据、bundle 和 node_modules 卷，谨慎使用。

## 环境是怎么工作的

### Dockerfile

- 基于 `ruby:3.4-bookworm`
- 从 `node:22-bookworm-slim` 复制 Node/npm
- 安装 `build-essential`、`default-libmysqlclient-dev`、`default-mysql-client` 等
- 创建非 root 用户 `vscode`（UID 1000）
- 先复制 `Gemfile`/`package*.json` 并安装依赖，再复制应用代码，利用 Docker 层缓存
- `bundle install` + `npm ci` + `npm run build`
- `BUNDLE_PATH=/home/vscode/.bundle` 和 `node_modules` 分别由 Compose 命名卷持久化

### Compose

- `web` 挂载当前项目到 `/rails`，改代码立即生效
- `node_modules` 使用命名卷，避免 Windows bind mount 的 npm 性能问题
- `db` 使用 `mysql:8.4`，数据在 `mysqldata` 卷
- 首次初始化时，`db/init/01-create-test-db.sql` 会创建 `railsdev_test` 并授权给 `rails` 用户
- `web` 等待 `db` 的 healthcheck 通过后再启动
- `web` 的 healthcheck 请求 `/up`
- `DATABASE` 配置通过环境变量传给 `config/database.yml`：

```yaml
host: <%= ENV.fetch("DB_HOST", "localhost") %>
port: <%= ENV.fetch("DB_PORT", 3306) %>
username: <%= ENV.fetch("DB_USER", "rails") %>
password: <%= ENV.fetch("DB_PASSWORD", "rails") %>
```

### 前端

- **React 19**：`app/javascript/components/App.jsx`、`UsersPage.jsx` 和 `TerminalPage.jsx`
- **esbuild**：把 `app/javascript/application.js` 打包到 `app/assets/builds/application.js`
- **Hotwire**：Turbo 和 Stimulus 通过 npm 引入，仍保留
- **Propshaft**：样式和打包后的 JS 都走 Rails 资源管线
- 页面仍由 Rails 服务端渲染 ERB；React 接管 `#react-root` / `#users-root`
- 不再使用 Importmap，`config/importmap.rb` 和 `bin/importmap` 已移除

`bin/dev` 会先执行一次 `npm run build`，然后启动 esbuild watch 和 Rails server。单独构建：

```bash
npm run build
npm run build:watch
```

### 用户管理 CRUD

打开 <http://localhost:3000/users>，页面由 React 渲染，支持：

- 列表查看
- 新建用户
- 编辑用户
- 删除用户（带确认）

字段：

| 字段 | 说明 |
| --- | --- |
| `email` | 邮箱，唯一，格式校验 |
| `username` | 用户名，唯一，最长 50 |
| `gender` | `male` 男 / `female` 女 / `other` 其他 |
| `birth_date` | 出生年月日，不能晚于今天 |
| `user_type` | `normal` 普通用户 / `admin` 管理员 |

JSON API：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/users` | 用户列表 |
| GET | `/api/users/:id` | 单个用户 |
| POST | `/api/users` | 创建（body: `{ "user": {...} }`） |
| PATCH | `/api/users/:id` | 更新 |
| DELETE | `/api/users/:id` | 删除 |

修改模型后执行：

```bash
bin/rails db:migrate
```

> 当前没有登录和权限控制，`/users` 只适合本机开发；上线前需要加认证，并限制只有管理员能访问。

### 模拟终端

打开 <http://localhost:3000/terminal>，这是一个纯浏览器端的模拟终端，适合演示命令和文件系统交互。

支持的常用命令：

```text
help              查看帮助
pwd               当前目录
ls [path]         列出目录
cd [path]         切换目录
cat <file>        查看文件
echo <text>       输出文本
date              当前时间
whoami            当前用户
uname -a          模拟系统信息
ruby -v           Ruby 版本
rails -v          Rails 版本
rails routes      示例路由
node -v / npm -v  Node/npm 版本
mysql --version   MySQL 版本
history           命令历史
clear             清屏
exit              退出提示
```

支持 `↑` / `↓` 浏览历史命令，`Ctrl+L` 清屏。

> 这是**前端模拟**：命令只在浏览器内存中的虚拟文件系统里执行，不会调用服务器 shell，也不会执行 `rm`、`sudo` 等真实操作。

### Windows 挂载权限

Docker Desktop 从 Windows 挂载的项目目录在容器里可能是 `root:root`，非 root 的
`vscode` 用户无法写 `Gemfile.lock`、`tmp/`、`log/`。`bin/docker-entrypoint` 会在
启动时检查 `/rails` 的所有者，必要时执行一次 `chown`，然后以 `vscode` 运行 Rails。

如果仍然遇到写入权限问题，可以手动执行：

```bash
docker compose exec web sudo chown -R vscode:vscode /rails
```

> 这个 chown 策略针对 Windows Docker Desktop；在 Linux 上运行会修改宿主项目文件的
> 所有者，请按需改成 UID 匹配方案。

## 添加 Gem

开发时可以直接在容器里：

```bash
bundle add 某个gem
bundle install
```

`Gemfile` 和 `Gemfile.lock` 会写回 Windows 项目目录，gem 安装在 `bundle` 卷里。
为了下次重建镜像也带上它，提交 `Gemfile`/`Gemfile.lock` 后执行：

```powershell
docker compose build
docker compose up -d
```

## 添加 npm 包

```bash
npm install 某个包
```

`package.json` 和 `package-lock.json` 会写回项目目录，包安装在 `node_modules` 卷里。
安装后重启 `web` 或重新执行 `bin/dev`，让 esbuild 重新打包：

```powershell
docker compose restart web
```

提交 `package.json` / `package-lock.json` 后重建镜像，确保新环境也带上依赖：

```powershell
docker compose build
```

## 自定义

### 换端口

例如改成 3001：

1. `compose.yaml`：`"3001:3000"`
2. `.devcontainer/devcontainer.json`：`forwardPorts` / `portsAttributes` 改为 3001
3. 访问 <http://localhost:3001>

### 换 Rails / Ruby 版本

- Ruby：修改 `Dockerfile` 的 `FROM ruby:3.4-bookworm`
- Rails：修改 `Gemfile` 的 `gem "rails"` 版本，然后 `bundle update rails`

Rails 8.1 需要 Ruby ≥ 3.2；改版本后重建镜像：

```powershell
docker compose build --no-cache
docker compose up -d
```

### 加 Redis / Sidekiq

在 `compose.yaml` 增加 `redis` 服务，把 `REDIS_URL` 传给 `web`，并在 Gemfile 加
`redis` / `sidekiq`。Rails 8 默认的 Solid Queue 不依赖 Redis；只有确实需要时再加。

## 常见问题

| 现象 | 原因 / 处理 |
| --- | --- |
| `Gemfile.lock` 写入失败 / `Permission denied` | Windows 挂载目录所有者是 root。确认 `bin/docker-entrypoint` 已执行；手动 `docker compose exec web sudo chown -R vscode:vscode /rails` |
| 3000 端口被占用 | 改 `compose.yaml` 和 `devcontainer.json` 的端口；用 `netstat -ano` 查占用进程 |
| `could not connect to server` / `database does not exist` | 等 `db` healthy；执行 `docker compose exec web bin/rails db:prepare` |
| `bin/rails: bad interpreter` 或 `\r` 错误 | Windows 换行导致。确认 `.gitattributes` 生效，或执行 `dos2unix bin/*` |
| `rails: command not found` | 用 `bin/rails` 或 `bundle exec rails`；不要直接依赖系统 PATH |
| `bundle: command not found` | 确认在 `web` 容器里，且镜像构建完整；执行 `docker compose exec web bundle -v` |
| Dev Containers 一直停在构建 | 首次要装 100+ 个 gem 和 npm 依赖；看 VS Code 的 Dev Containers 日志，或先 `docker compose build` |
| 改了 Gemfile 但容器里找不到新 gem | 在容器里 `bundle install`；或重建镜像 `docker compose build` |
| 改了 React/JS 但页面没变化 | 确认 esbuild watch 在跑；`docker compose logs -f web` 看 `[watch] build finished`，或执行 `npm run build` |
| `Cannot use import statement outside a module` | `javascript_include_tag` 必须带 `type: "module"`；当前 layout 已配置 |
| `esbuild: command not found` | `node_modules` 卷未初始化。执行 `npm ci`，或 `docker compose build` 后重启 |
| `stale_when_importmap_changes` NameError | 已从 `ApplicationController` 移除；如果自行生成旧模板，删掉这一行 |
| 系统测试 `test:system` 失败 | 镜像没有安装 Chrome/Chromedriver；本项目只验证普通 Minitest。需要系统测试时另加浏览器 |
| `master.key` 相关错误 | 开发环境使用项目里的 `config/master.key`（已 gitignore）。确认用 Compose 挂载项目启动，而不是单独 `docker run` 镜像 |

## 安全说明

- `MYSQL_ROOT_PASSWORD=root`、应用密码 `rails` 等配置只适合本机开发
- 不要提交 `config/master.key`
- 不要把这个开发容器的 3000 端口直接暴露到公网
- 用户管理页面目前没有登录/权限控制，不要直接部署到公网
- `/terminal` 是前端模拟终端，不会在服务器执行命令；不要把它改成真实的 Web Shell 暴露到公网

## 参考

- Rails 官方指南：<https://guides.rubyonrails.org/>
- Rails 8.1 Release Notes：<https://guides.rubyonrails.org/8_1_release_notes.html>
- Ruby 官方镜像：<https://hub.docker.com/_/ruby>
- MySQL 官方镜像：<https://hub.docker.com/_/mysql>
- VS Code Dev Containers：<https://code.visualstudio.com/docs/devcontainers/containers>
