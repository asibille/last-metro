```bash
#!/bin/bash

echo "🧪 Test de l'API Last Metro"
echo ""

echo "1️⃣ Test Health Check..."
curl -s http://localhost:3000/health | jq
echo ""

echo "2️⃣ Test Next Metro avec station..."
curl -s "http://localhost:3000/next-metro?station=Chatelet" | jq
echo ""

echo "3️⃣ Test erreur sans station..."
curl -s http://localhost:3000/next-metro | jq
echo ""

echo "✅ Tests terminés"
```