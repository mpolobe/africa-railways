FROM gitpod/workspace-full:latest

# Install Go (latest stable version)
RUN brew install go

# Install Node.js LTS
RUN bash -c ". .nvm/nvm.sh && nvm install 18 && nvm use 18 && nvm alias default 18"

# Install useful tools
RUN sudo apt-get update && \
    sudo apt-get install -y \
    curl \
    wget \
    git \
    htop \
    nano \
    jq \
    && sudo rm -rf /var/lib/apt/lists/*

# Set Go environment variables
ENV GOPATH=/workspace/go
ENV PATH=$GOPATH/bin:$PATH

# Install Go tools
RUN go install golang.org/x/tools/gopls@latest && \
    go install github.com/go-delve/delve/cmd/dlv@latest && \
    go install honnef.co/go/tools/cmd/staticcheck@latest

# Pre-warm Go module cache
RUN go mod download || true

# Set working directory
WORKDIR /workspaces/africa-railways
