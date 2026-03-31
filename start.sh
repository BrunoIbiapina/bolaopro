#!/bin/bash
# Script para iniciar o Bolão Pro completo

PROJECT_DIR="$HOME/Documents/Claude/Projects/bolao"

echo "🚀 Iniciando Bolão Pro..."
echo ""

# Verificar Docker
echo "🐳 Verificando Docker (banco de dados)..."
cd "$PROJECT_DIR"
docker compose up -d 2>/dev/null || docker-compose up -d 2>/dev/null
sleep 2

# Verificar se banco está acessível
if curl -s http://localhost:5433 > /dev/null 2>&1 || pg_isready -h localhost -p 5433 > /dev/null 2>&1; then
  echo "✅ Banco de dados OK"
else
  echo "⚠️  Banco pode ainda estar iniciando, aguardando..."
  sleep 3
fi

echo ""
echo "🔧 Iniciando Backend (porta 3001)..."
osascript -e "tell application \"Terminal\" to do script \"cd $PROJECT_DIR/server && rm -rf dist && npm run start:dev\""

echo "⏳ Aguardando backend compilar (15s)..."
sleep 15

# Testar backend
if curl -s http://localhost:3001/api/v1/admin/championships > /dev/null 2>&1; then
  echo "✅ Backend rodando!"
else
  echo "⚠️  Backend ainda iniciando, aguarde mais alguns segundos..."
fi

echo ""
echo "🌐 Iniciando Frontend (porta 3000)..."
osascript -e "tell application \"Terminal\" to do script \"cd $PROJECT_DIR/web && npm run dev\""

sleep 3
echo ""
echo "✅ Tudo iniciado!"
echo ""
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:3001/api/docs"
echo ""
echo "   Login: bruno@bolaopro.com / Admin@2026"

# Abrir no browser
open http://localhost:3000
