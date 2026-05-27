#!/bin/bash
set -euo pipefail

# Shiftlink Production Deployment Script
# Usage: ./deploy.sh [command]
# Commands: start | stop | restart | logs | migrate | status

COMPOSE_FILE="docker-compose.yml"
PROJECT_NAME="shiftlink"

load_env() {
  if [ ! -f .env ]; then
    echo "ERROR: .env file not found. Copy .env.example and configure it:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    exit 1
  fi
  export $(grep -v '^#' .env | xargs)
}

cmd_start() {
  load_env
  echo "Building and starting Shiftlink..."
  docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d --build
  echo "Waiting for database..."
  sleep 5
  echo "Running migrations..."
  docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" exec app npx prisma migrate deploy
  echo ""
  echo "Shiftlink is running!"
  echo "  App:    http://localhost:3000"
  echo "  Health: http://localhost:3000/api/v1/health"
}

cmd_stop() {
  docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down
}

cmd_restart() {
  cmd_stop
  cmd_start
}

cmd_logs() {
  docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" logs -f "${1:-}"
}

cmd_migrate() {
  load_env
  docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" exec app npx prisma migrate deploy
}

cmd_status() {
  docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps
  echo ""
  echo "Health check:"
  curl -s http://localhost:3000/api/v1/health 2>/dev/null || echo "App not responding"
}

case "${1:-help}" in
  start)    cmd_start ;;
  stop)     cmd_stop ;;
  restart)  cmd_restart ;;
  logs)     cmd_logs "$2" ;;
  migrate)  cmd_migrate ;;
  status)   cmd_status ;;
  *)
    echo "Usage: $0 {start|stop|restart|logs|migrate|status}"
    exit 1
    ;;
esac
