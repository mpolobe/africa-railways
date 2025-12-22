#!/bin/bash

# 🧹 Africa Railways - Cleanup Script
# Kills hanging processes and clears git locks

echo "🧹 Cleaning up processes and locks..."

# Kill processes
echo "Killing git processes..."
pkill -9 git 2>/dev/null || true

echo "Killing node processes..."
pkill -9 node 2>/dev/null || true

echo "Killing go processes..."
pkill -9 go 2>/dev/null || true

# Clear git locks
echo "Removing git locks..."
rm -f .git/index.lock 2>/dev/null || true
rm -f .git/*.lock 2>/dev/null || true
rm -f .git/refs/heads/*.lock 2>/dev/null || true
rm -f .git/refs/remotes/origin/*.lock 2>/dev/null || true

# Clear any stale PIDs
echo "Clearing stale PIDs..."
rm -f /tmp/*.pid 2>/dev/null || true

# Check git status
echo ""
echo "Git status:"
git status --short

echo ""
echo "✅ Cleanup complete!"
