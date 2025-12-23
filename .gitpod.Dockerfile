FROM gitpod/workspace-node:latest

# Install additional dependencies
USER root
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    unzip \
    zip \
    openjdk-17-jdk \
    build-essential \
    imagemagick \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Set Java home
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH=$JAVA_HOME/bin:$PATH

# Install AWS CLI v2
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip -q awscliv2.zip && \
    ./aws/install && \
    rm -rf aws awscliv2.zip

# Install AWS SAM CLI for serverless deployments
RUN pip3 install aws-sam-cli

USER gitpod

# Install Android SDK
ENV ANDROID_HOME=/home/gitpod/android-sdk
ENV PATH=${PATH}:${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/build-tools/33.0.0

RUN mkdir -p ${ANDROID_HOME}/cmdline-tools && \
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip && \
    unzip -q commandlinetools-linux-9477386_latest.zip -d ${ANDROID_HOME}/cmdline-tools && \
    mv ${ANDROID_HOME}/cmdline-tools/cmdline-tools ${ANDROID_HOME}/cmdline-tools/latest && \
    rm commandlinetools-linux-9477386_latest.zip

# Accept Android licenses and install required packages
RUN yes | ${ANDROID_HOME}/cmdline-tools/latest/bin/sdkmanager --licenses && \
    ${ANDROID_HOME}/cmdline-tools/latest/bin/sdkmanager \
    "platform-tools" \
    "platforms;android-33" \
    "build-tools;33.0.0"

# Install global npm packages
RUN npm install -g \
    eas-cli \
    expo-cli \
    @expo/ngrok@^4.1.0 \
    sharp-cli

# Set up environment variables
ENV EXPO_NO_DOTENV=1
ENV EXPO_USE_FAST_RESOLVER=1

# Create workspace directories
RUN mkdir -p /home/gitpod/.aws \
    /home/gitpod/.expo \
    /home/gitpod/builds

USER gitpod
