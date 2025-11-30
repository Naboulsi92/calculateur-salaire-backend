# Backend - Calculateur de Salaire Maroc 2025

API Backend pour le calcul du salaire net à partir du brut (et vice-versa) pour les salariés au Maroc, conforme à la **Loi de Finances 2025**.

## 🌐 Déploiement

Ce backend est déployé sur **Vercel** :
- **URL** : https://calculateur-salaire-backend.vercel.app
- **Health Check** : https://calculateur-salaire-backend.vercel.app/api/health

## 🏗️ Architecture

```
backend/
├── api/
│   ├── calculate.js    # Endpoint POST /api/calculate
│   └── health.js       # Endpoint GET /api/health
├── server.js           # Serveur Express (dev local)
├── package.json        # Dépendances
└── vercel.json         # Configuration Vercel
```

## 📡 API Endpoints

### GET /api/health
Vérifie que le serveur fonctionne.

**Réponse :**
```json
{
  "status": "ok",
  "timestamp": "2025-11-30T12:00:00.000Z"
}
```

### POST /api/calculate
Calcule le salaire net à partir du brut.

**Corps de la requête :**
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

**Réponse :**
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

## 🚀 Déploiement sur Vercel

### Prérequis
- Compte Vercel connecté à GitHub
- Repo GitHub : https://github.com/Naboulsi92/calculateur-salaire-backend

### Configuration Vercel
| Paramètre | Valeur |
|-----------|--------|
| Framework Preset | Other |
| Build Command | (vide) |
| Output Directory | (vide) |
| Install Command | `npm install` |

### Redéployer
Chaque `git push` sur `main` déclenche un redéploiement automatique.

## 🔧 Développement local

```bash
# Installer les dépendances
npm install

# Démarrer le serveur
npm start
```

Le serveur démarre sur `http://localhost:3000`

### Tester localement
```bash
# Health check
curl http://localhost:3000/api/health

# Calcul
curl -X POST http://localhost:3000/api/calculate \
  -H "Content-Type: application/json" \
  -d '{"salaireDeBaseMensuel": 10000, "isAMOActive": true}'
```

## 📋 Règles de calcul (Loi de Finances 2025)

| Élément | Taux/Plafond |
|---------|--------------|
| **CNSS** | 4.48% (plafond 6000 MAD) |
| **AMO** | 2.26% (sans plafond) |
| **Frais Pro** | 35% si SBI ≤ 6500, sinon 25% (plafond 2916.67 MAD) |
| **IR** | Barème progressif (0%, 10%, 20%, 30%, 34%, 37%) |
| **Charges famille** | 500 MAD/an/personne (max 6 personnes) |

## 🛡️ CORS

Les origines autorisées sont :
- `https://naboulsi92.github.io/calculateur-salaire-frontend` (Production GitHub Pages)
- `http://localhost:*` (Développement local)

## 🔗 Liens

- **Frontend** : https://github.com/Naboulsi92/calculateur-salaire-frontend
- **Application** : https://naboulsi92.github.io/calculateur-salaire-frontend/
