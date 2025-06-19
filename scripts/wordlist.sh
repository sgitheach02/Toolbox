#!/bin/bash

echo "📝 INSTALLATION WORDLISTS DANS LE CONTAINER"
echo "==========================================="

# Entrer dans le container et installer les wordlists
docker-compose exec backend bash -c "
echo '1️⃣ Création du répertoire wordlists...'
mkdir -p /usr/share/wordlists

echo '2️⃣ Création des wordlists de base...'

# Wordlist rapide pour tests
cat > /usr/share/wordlists/fasttrack.txt << 'EOF'
password
admin
123456
root
toor
pass
test
guest
user
login
password123
admin123
12345
qwerty
letmein
welcome
monkey
dragon
master
github
ubuntu
kali
penetration
security
hacker
EOF

# Darkweb2017 simulation (top passwords)
cat > /usr/share/wordlists/darkweb2017-top1000.txt << 'EOF'
password
123456
password123
admin
qwerty
12345
letmein
welcome
monkey
1234567890
root
toor
pass
test
guest
login
master
dragon
github
EOF

# Common passwords
cp /usr/share/wordlists/fasttrack.txt /usr/share/wordlists/common.txt

echo '3️⃣ Installation de SecLists (wordlists avancées)...'
cd /tmp
wget -q https://github.com/danielmiessler/SecLists/archive/master.zip 2>/dev/null || echo 'Téléchargement SecLists échoué'
if [ -f master.zip ]; then
    unzip -q master.zip
    mkdir -p /usr/share/seclists
    cp -r SecLists-master/Passwords/* /usr/share/seclists/ 2>/dev/null || true
    rm -rf master.zip SecLists-master
    echo 'SecLists installé partiellement'
else
    echo 'SecLists non disponible, utilisation des wordlists de base'
fi

echo '4️⃣ Vérification des wordlists installées:'
echo 'Wordlists disponibles:'
ls -la /usr/share/wordlists/
echo
echo 'Taille des fichiers:'
wc -l /usr/share/wordlists/*.txt 2>/dev/null || echo 'Pas de fichiers .txt'

echo '5️⃣ Test Hydra avec les nouvelles wordlists:'
echo 'Test format de commande:'
hydra -l test -P /usr/share/wordlists/fasttrack.txt 127.0.0.1 ssh -t 1 -w 3 2>&1 | head -5 || echo 'Test échoué'
"

echo "✅ Installation terminée !"
echo "🔗 Retestez maintenant votre attaque Hydra"
