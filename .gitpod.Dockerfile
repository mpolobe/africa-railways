FROM gitpod/workspace-full:latest

USER root

# Install system-level dependencies for Rust, Sui, Go, and Postgres
RUN apt-get update && apt-get install -y \
    clang \
    cmake \
    build-essential \
    libssl-dev \
    pkg-config \
    libclang-dev \
    libpq-dev \
    postgresql-client \
    postgresql \
    postgresql-contrib \
    curl \
    wget \
    git \
    htop \
    nano \
    jq \
    && rm -rf /var/lib/apt/lists/*

USER gitpod

# Ensure Rust is installed and up to date (workspace-full has it, but we verify)
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
ENV PATH="/home/gitpod/.cargo/bin:${PATH}"

# Install Node.js LTS
RUN bash -c ". ~/.nvm/nvm.sh && nvm install 18 && nvm use 18 && nvm alias default 18"

# Install Go (latest stable version)
RUN brew install go

# Set Go environment variables
ENV GOPATH=/workspace/go
ENV PATH=$GOPATH/bin:$PATH

# Install Go development tools
RUN go install golang.org/x/tools/gopls@latest && \
    go install github.com/go-delve/delve/cmd/dlv@latest && \
    go install honnef.co/go/tools/cmd/staticcheck@latest && \
    go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

# Note: Sui CLI installation is done in .gitpod.yml init task to leverage prebuilds
# This keeps the Docker image smaller and allows for faster workspace startup

# Set working directory
WORKDIR /workspaces/africa-railways
