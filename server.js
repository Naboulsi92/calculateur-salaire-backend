const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// Configuration CORS pour autoriser GitHub Pages et localhost
const corsOptions = {
    origin: [
        'https://naboulsi92.github.io',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5500',
        'http://127.0.0.1:5500'
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// --- Fonctions Utilitaires ---

/**
 * Calcule l'ancienneté en années complètes.
 * @param {string} dateEmbaucheString (YYYY-MM-DD)
 * @returns {number}
 */
function calculerAncienneteEnAnnees(dateEmbaucheString) {
    if (!dateEmbaucheString) return 0;
    const embauche = new Date(dateEmbaucheString);
    const now = new Date();
    let years = now.getFullYear() - embauche.getFullYear();
    const m = now.getMonth() - embauche.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < embauche.getDate())) {
        years--;
    }
    return Math.max(0, years);
}

/**
 * Calcule l'IR Brut selon le barème 2025.
 * @param {number} baseImposable (SNI)
 * @returns {number} IR Brut
 */
function calculerIRSelonBareme(baseImposable) {
    let taux = 0;
    let abattement = 0;

    if (baseImposable <= 3333.33) {
        taux = 0;
        abattement = 0;
    } else if (baseImposable <= 5000.00) {
        taux = 0.10;
        abattement = 333.33;
    } else if (baseImposable <= 6666.67) {
        taux = 0.20;
        abattement = 833.33;
    } else if (baseImposable <= 8333.33) {
        taux = 0.30;
        abattement = 1500.00;
    } else if (baseImposable <= 15000.00) {
        taux = 0.34;
        abattement = 1833.33;
    } else {
        taux = 0.37;
        abattement = 2283.33;
    }

    const irBrut = (baseImposable * taux) - abattement;
    return Math.max(0, irBrut);
}

// --- Fonctions de Calcul ---

/**
 * Calcule le salaire Net à partir du Brut.
 */
function calculerNetDepuisBrut(salaireDeBaseMensuel, dateEmbauche, nbCharges, indemniteTransport, indemnitePanier, tauxCIMR, isCIMRActive, isTransportActive, isPanierActive, isAMOActive) {
    // 1. Prime d'ancienneté
    const anneesAnciennete = calculerAncienneteEnAnnees(dateEmbauche);
    let tauxAnciennete = 0;
    if (anneesAnciennete >= 25) tauxAnciennete = 0.25;
    else if (anneesAnciennete >= 20) tauxAnciennete = 0.20;
    else if (anneesAnciennete >= 12) tauxAnciennete = 0.15;
    else if (anneesAnciennete >= 5) tauxAnciennete = 0.10;
    else if (anneesAnciennete >= 2) tauxAnciennete = 0.05;

    const primeAnciennete = salaireDeBaseMensuel * tauxAnciennete;

    // 2. Salaire Brut Global
    const salaireBrutGlobal = salaireDeBaseMensuel + primeAnciennete + indemniteTransport + indemnitePanier;

    // 3. Cotisations Sociales (CNSS & AMO)
    // CNSS : 4.48% plafonné à 6000 MAD
    const baseCnss = Math.min(salaireBrutGlobal, 6000);
    const cotisationCnss = baseCnss * 0.0448;

    // AMO : 2.26% sans plafond
    let cotisationAmo = 0;
    if (isAMOActive) {
        cotisationAmo = salaireBrutGlobal * 0.0226;
    }

    // 4. CIMR (Retraite Complémentaire)
    // Base = Brut Global - Indemnités exonérées (Transport, Panier)
    let cotisationCimr = 0;
    if (isCIMRActive) {
        const baseCimr = salaireBrutGlobal - indemniteTransport - indemnitePanier;
        cotisationCimr = baseCimr * (tauxCIMR / 100);
    }

    // 5. Salaire Brut Imposable (SBI)
    // SBI = Brut Global - Indemnités exonérées (Transport, Panier)
    // Note: Les indemnités de transport et panier sont exonérées d'IR.
    const salaireBrutImposable = salaireBrutGlobal - indemniteTransport - indemnitePanier;

    // 6. Frais Professionnels
    // Taux 35% si SBI <= 6500, sinon 25%. Plafond 2916.67 MAD.
    let fraisPro = 0;
    if (salaireBrutImposable <= 6500) {
        fraisPro = salaireBrutImposable * 0.35;
    } else {
        fraisPro = Math.min(salaireBrutImposable * 0.25, 2916.67);
    }

    // 7. Salaire Net Imposable (SNI)
    // SNI = SBI - CNSS - AMO - CIMR - FraisPro
    const salaireNetImposable = salaireBrutImposable - cotisationCnss - cotisationAmo - cotisationCimr - fraisPro;

    // 8. Impôt sur le Revenu (IR)
    const irBrut = calculerIRSelonBareme(salaireNetImposable);

    // 9. Réduction pour charges de famille
    // 500 MAD par personne à charge par an => 41.666... par mois. Plafond 3000/an (6 pers).
    const reductionFamille = Math.min(nbCharges, 6) * (500 / 12);

    const irNet = Math.max(0, irBrut - reductionFamille);

    // 10. Salaire Net Mensuel
    // Net = Brut Global - Retenues.
    // Retenues = CNSS + AMO + CIMR + IR Net.
    const totalRetenues = cotisationCnss + cotisationAmo + cotisationCimr + irNet;
    const salaireNetMensuel = salaireBrutGlobal - totalRetenues;

    return {
        salaireDeBase: salaireDeBaseMensuel,
        primeAnciennete: primeAnciennete,
        indemniteTransport: indemniteTransport,
        indemnitePanier: indemnitePanier,
        salaireBrutGlobal: salaireBrutGlobal,
        cotisationCnss: cotisationCnss,
        cotisationAmo: cotisationAmo,
        cotisationCimr: cotisationCimr,
        fraisPro: fraisPro,
        salaireNetImposable: salaireNetImposable,
        irBrut: irBrut,
        reductionFamille: reductionFamille,
        irNet: irNet,
        salaireNetMensuel: salaireNetMensuel
    };
}

// --- Routes API ---

// Route de santé pour vérifier que le serveur fonctionne
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Route principale de calcul
app.post('/api/calculate', (req, res) => {
    try {
        const {
            salaireDeBaseMensuel,
            dateEmbauche,
            nbCharges,
            indemniteTransport,
            indemnitePanier,
            tauxCIMR,
            isCIMRActive,
            isTransportActive,
            isPanierActive,
            isAMOActive
        } = req.body;

        // Validation basique
        if (salaireDeBaseMensuel === undefined || salaireDeBaseMensuel === null) {
            return res.status(400).json({ error: 'Le salaire de base est requis' });
        }

        const resultats = calculerNetDepuisBrut(
            Number(salaireDeBaseMensuel),
            dateEmbauche,
            Number(nbCharges),
            Number(indemniteTransport),
            Number(indemnitePanier),
            Number(tauxCIMR),
            Boolean(isCIMRActive),
            Boolean(isTransportActive),
            Boolean(isPanierActive),
            Boolean(isAMOActive)
        );

        res.json(resultats);
    } catch (error) {
        console.error('Erreur de calcul:', error);
        res.status(500).json({ error: 'Erreur interne du serveur lors du calcul' });
    }
});

// Démarrage du serveur sur 0.0.0.0 pour Render
app.listen(port, '0.0.0.0', () => {
    console.log(`Serveur de calcul démarré sur le port ${port}`);
});
