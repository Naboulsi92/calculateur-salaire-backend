# Backend - Calculateur de Salaire Maroc 2025

API Backend pour le calcul du salaire net à partir du brut (et vice-versa) pour les salariés au Maroc, conforme à la Loi de Finances 2025.

## 🚀 Déploiement sur Render

### Étapes de déploiement

1. **Créer un compte sur [Render.com](https://render.com)**

2. **Créer un nouveau repository GitHub** pour ce backend
   ```bash
   cd backend
   git init
   git add .
   git commit -m "Initial commit - Backend API"
   git remote add origin https://github.com/VOTRE_USERNAME/calculateur-salaire-backend.git
   git push -u origin main
   ```

3. **Sur Render.com :**
   - Cliquez sur "New +" → "Web Service"
   - Connectez votre repository GitHub
   - Configurez :
     - **Name**: `calculateur-salaire-api`
     - **Region**: Frankfurt (EU Central) ou autre proche du Maroc
     - **Branch**: `main`
     - **Runtime**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: Free (ou payant pour plus de performance)

4. **Une fois déployé**, notez l'URL (exemple: `https://calculateur-salaire-api.onrender.com`)

5. **Mettez à jour le frontend** avec cette URL dans `js/script.js`

## 📡 API Endpoints

### GET /health
Vérifie que le serveur fonctionne.

**Réponse:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-28T12:00:00.000Z"
}
```

### POST /api/calculate
Calcule le salaire net à partir du brut.

**Corps de la requête:**
```json
{
  "salaireDeBaseMensuel": 10000,
  "dateEmbauche": "2020-01-15",
  "nbCharges": 2,
  "indemniteTransport": 500,
  "indemnitePanier": 0,
  "tauxCIMR": 3,
  "isCIMRActive": true,
  "isTransportActive": true,
  "isPanierActive": false,
  "isAMOActive": true
}
```

**Réponse:**
```json
{
  "salaireDeBase": 10000,
  "primeAnciennete": 500,
  "indemniteTransport": 500,
  "indemnitePanier": 0,
  "salaireBrutGlobal": 11000,
  "cotisationCnss": 268.80,
  "cotisationAmo": 248.60,
  "cotisationCimr": 315,
  "fraisPro": 2625,
  "salaireNetImposable": 7042.60,
  "irBrut": 611.45,
  "reductionFamille": 83.33,
  "irNet": 528.12,
  "salaireNetMensuel": 9639.48
}
```

## 🔧 Développement local

```bash
# Installer les dépendances
npm install

# Démarrer le serveur
npm start
```

Le serveur démarre sur `http://localhost:3000`

## 📋 Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `PORT` | Port du serveur | 3000 |

## 🛡️ CORS

Les origines autorisées sont :
- `https://naboulsi92.github.io` (Production GitHub Pages)
- `http://localhost:3000` (Développement local)
- `http://localhost:5500` (Live Server VS Code)
