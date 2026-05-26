#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo ".env not found. Copy .env.example to .env and set BOT_TOKEN before starting."
  exit 1
fi

echo "Installing dependencies..."
npm install

echo "Building project..."
npm run build

echo "Starting bot..."
npm start
