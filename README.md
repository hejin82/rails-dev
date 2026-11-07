# Rails 开发环境（Docker + MySQL + VS Code Dev Containers）

这是一个独立的 Rails 8.1 项目，和 `java-dev`、`python-gpu` 以及现有的 Python 分析脚本互不影响。

技术栈：

- Ruby 3.4.12
- Rails 8.1.4.1
- MySQL 8.4
- Puma + Propshaft + Importmap + Hotwire
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
| 测试 | `bin/rails test`：2 runs, 4 assertions, 0 failures |
| 代码检查 | RuboCop：25 files inspected, no offenses |
| 数据库 | `railsdev_development`、`railsdev_test` 已创建 |
| Ruby LSP | 0.26.11 可用 |

## 目录结构（关键文件）

```text
rails-dev/
├─ .devcontainer/
│  └─ devcontainer.json   # VS Code 连接 Compose 的 web 服务
├─ app/                   # Rails 应用代码
├─ bin/
│  ├─ rails
│  └─ docker-entrypoint   # 修复 Windows 挂载权限 + bundle/db 准备
├─ config/
│  ├─ database.yml        # 从环境变量读取 DB_HOST/DB_USER 等
│  └─ routes.rb
├─ db/
│  ├─ init/
│  │  └─ 01-create-test-db.sql  # 创建 railsdev_test 并授权
│  └─ seeds.rb
├─ test/
│  └─ integration/home_test.rb
├─ Dockerfile             # Ruby 3.4 + Rails 依赖 + vscode 用户
├─ compose.yaml           # web + MySQL 8.4
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

首次会构建镜像并安装全部 gem（100+），之后启动会复用 `bundle` 卷，速度快很多。
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

# 停止（保留数据库和 bundle 卷）
docker compose down
```

`docker compose down -v` 会同时删除数据库数据和 bundle 卷，谨慎使用。

## 环境是怎么工作的

### Dockerfile

- 基于 `ruby:3.4-bookworm`
- 安装 `build-essential`、`default-libmysqlclient-dev`、`default-mysql-client` 等
- 创建非 root 用户 `vscode`（UID 1000）
- 先复制 `Gemfile`/`Gemfile.lock` 并 `bundle install`，再复制应用代码，利用 Docker 层缓存
- `BUNDLE_PATH=/home/vscode/.bundle`，由 Compose 的 `bundle` 命名卷持久化

### Compose

- `web` 挂载当前项目到 `/rails`，改代码立即生效
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
| Dev Containers 一直停在构建 | 首次要装 100+ 个 gem；看 VS Code 的 Dev Containers 日志，或先 `docker compose build` |
| 改了 Gemfile 但容器里找不到新 gem | 在容器里 `bundle install`；或重建镜像 `docker compose build` |
| 系统测试 `test:system` 失败 | 镜像没有安装 Chrome/Chromedriver；本项目只验证普通 Minitest。需要系统测试时另加浏览器 |
| `master.key` 相关错误 | 开发环境使用项目里的 `config/master.key`（已 gitignore）。确认用 Compose 挂载项目启动，而不是单独 `docker run` 镜像 |

## 安全说明

- `MYSQL_ROOT_PASSWORD=root`、应用密码 `rails` 等配置只适合本机开发
- 不要提交 `config/master.key`
- 不要把这个开发容器的 3000 端口直接暴露到公网

## 参考

- Rails 官方指南：<https://guides.rubyonrails.org/>
- Rails 8.1 Release Notes：<https://guides.rubyonrails.org/8_1_release_notes.html>
- Ruby 官方镜像：<https://hub.docker.com/_/ruby>
- MySQL 官方镜像：<https://hub.docker.com/_/mysql>
- VS Code Dev Containers：<https://code.visualstudio.com/docs/devcontainers/containers>
