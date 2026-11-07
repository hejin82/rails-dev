FROM node:22-bookworm-slim AS node

FROM ruby:3.4-bookworm

ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=1000
ARG DEBIAN_FRONTEND=noninteractive

ENV RAILS_ENV=development \
    BUNDLE_PATH=/home/vscode/.bundle \
    BUNDLE_JOBS=4 \
    BUNDLE_RETRY=3 \
    LANG=C.UTF-8 \
    LC_ALL=C.UTF-8

# default-libmysqlclient-dev is needed to build the mysql2 gem;
# default-mysql-client provides the mysql CLI for debugging.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        ca-certificates \
        curl \
        default-libmysqlclient-dev \
        default-mysql-client \
        git \
        less \
        libssl-dev \
        pkg-config \
        sudo \
        vim \
    && rm -rf /var/lib/apt/lists/*

# Node/npm are used by esbuild and React. Copy them from the official Node image
# instead of adding a NodeSource apt repository.
COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -sf /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -sf /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx \
    && node --version \
    && npm --version

RUN groupadd --gid "${USER_GID}" "${USERNAME}" \
    && useradd --uid "${USER_UID}" --gid "${USER_GID}" \
        --create-home --shell /bin/bash "${USERNAME}" \
    && echo "${USERNAME} ALL=(root) NOPASSWD:ALL" > "/etc/sudoers.d/${USERNAME}" \
    && chmod 0440 "/etc/sudoers.d/${USERNAME}" \
    && mkdir -p /rails "/home/${USERNAME}/.bundle" \
    && chown -R "${USERNAME}:${USERNAME}" /rails "/home/${USERNAME}"

ENV HOME=/home/${USERNAME}

WORKDIR /rails

# Install gems and npm packages first so application code changes do not
# invalidate these layers.
COPY --chown=vscode:vscode Gemfile Gemfile.lock package.json package-lock.json ./
USER vscode
RUN bundle install \
    && npm ci

# Application code. In development Compose mounts the project over /rails,
# but keeping a copy here keeps the image usable for one-off tasks.
COPY --chown=vscode:vscode . .
RUN npm run build \
    && chmod +x bin/*

EXPOSE 3000

ENTRYPOINT ["/rails/bin/docker-entrypoint"]
CMD ["bash", "bin/dev"]
