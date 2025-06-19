#!/bin/bash
set -e

echo "🚀 Starting Pacha Toolbox with real Metasploit..."

# Démarrer PostgreSQL
echo "📊 Starting PostgreSQL..."
service postgresql start
sleep 5

# Initialiser Metasploit DB si nécessaire
if [ ! -f /home/msf/.msf4/database.yml ]; then
    echo "🔧 Initializing Metasploit database..."
    su - msf -c "msfdb init" || echo "⚠️ DB init skipped, will use without DB"
fi

# Vérifier les outils
echo "🔍 Checking security tools..."
for tool in nmap nikto hydra tcpdump msfconsole; do
    if command -v $tool >/dev/null 2>&1; then
        echo "✅ $tool: Available"
    else
        echo "❌ $tool: Missing"
    fi
done

# Test de Metasploit
echo "🕷️ Testing Metasploit..."
if msfconsole --version; then
    echo "✅ Metasploit Framework is ready"
else
    echo "⚠️ Metasploit needs initialization"
fi

echo "🎯 All tools ready, starting application..."
exec python3 main.py
