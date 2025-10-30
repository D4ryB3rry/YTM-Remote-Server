#!/bin/bash

echo "=================================================="
echo "🎵 YTM Remote Server - Setup"
echo "=================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js ist nicht installiert!"
    echo "Bitte installiere Node.js von https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js gefunden: $(node --version)"
echo ""

# Install dependencies
echo "📦 Installiere Dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "=================================================="
    echo "✅ Setup erfolgreich abgeschlossen!"
    echo "=================================================="
    echo ""
    echo "Starte den Server mit:"
    echo "  npm start"
    echo ""
    echo "Öffne dann im Browser:"
    echo "  http://localhost:3000"
    echo ""
    echo "⚠️  WICHTIG:"
    echo "1. Starte zuerst YouTube Music Desktop App"
    echo "2. Aktiviere Remote Control in den Einstellungen"
    echo "3. Akzeptiere die Authentifizierungsanfrage!"
    echo ""
else
    echo ""
    echo "❌ Installation fehlgeschlagen!"
    echo "Bitte prüfe die Fehlermeldungen oben."
    exit 1
fi
