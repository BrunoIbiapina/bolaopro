#!/bin/bash
# Setup do auto-push para o Bolão Pro
# Roda UMA VEZ: bash autopush-setup.sh

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$HOME/.bolao-autopush.sh"
PLIST="$HOME/Library/LaunchAgents/com.bolao.autopush.plist"

# Cria o script de watch
cat > "$SCRIPT" << SCRIPT
#!/bin/bash
REPO="$REPO_DIR"
LOG="\$HOME/.bolao-autopush.log"
echo "[\$(date '+%Y-%m-%d %H:%M:%S')] Auto-push iniciado para \$REPO" >> "\$LOG"
while true; do
  cd "\$REPO" || exit 1
  LOCAL=\$(git rev-parse HEAD 2>/dev/null)
  REMOTE=\$(git rev-parse origin/main 2>/dev/null)
  if [ "\$LOCAL" != "\$REMOTE" ] && [ -n "\$LOCAL" ]; then
    echo "[\$(date '+%H:%M:%S')] Novo commit detectado, fazendo push..." >> "\$LOG"
    git push origin main >> "\$LOG" 2>&1
    echo "[\$(date '+%H:%M:%S')] Push concluído" >> "\$LOG"
  fi
  sleep 8
done
SCRIPT
chmod +x "$SCRIPT"

# Cria o launchd agent (inicia automático no login)
cat > "$PLIST" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.bolao.autopush</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$SCRIPT</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>$HOME/.bolao-autopush.log</string>
  <key>StandardErrorPath</key>
  <string>$HOME/.bolao-autopush.log</string>
</dict>
</plist>
PLIST

# Carrega o agent agora (não precisa reiniciar)
launchctl unload "$PLIST" 2>/dev/null
launchctl load "$PLIST"

echo ""
echo "✅ Auto-push configurado com sucesso!"
echo "   Repo: $REPO_DIR"
echo "   O git push vai acontecer automaticamente a cada commit."
echo "   Log em: ~/.bolao-autopush.log"
