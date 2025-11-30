// --- Fonctions Utilitaires ---

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

function calculerNetDepuisBrut(salaireDeBaseMensuel, dateEmbauche, nbCharges, indemniteTransport, indemnitePanier, tauxCIMR, isCIMRActive, isTransportActive, isPanierActive, isAMOActive) {
    const anneesAnciennete = calculerAncienneteEnAnnees(dateEmbauche);
    let tauxAnciennete = 0;
    if (anneesAnciennete >= 25) tauxAnciennete = 0.25;
    else if (anneesAnciennete >= 20) tauxAnciennete = 0.20;
    else if (anneesAnciennete >= 12) tauxAnciennete = 0.15;
    else if (anneesAnciennete >= 5) tauxAnciennete = 0.10;
    else if (anneesAnciennete >= 2) tauxAnciennete = 0.05;

    const primeAnciennete = salaireDeBaseMensuel * tauxAnciennete;
    const salaireBrutGlobal = salaireDeBaseMensuel + primeAnciennete + indemniteTransport + indemnitePanier;

    const baseCnss = Math.min(salaireBrutGlobal, 6000);
    const cotisationCnss = baseCnss * 0.0448;

    let cotisationAmo = 0;
    if (isAMOActive) {
        cotisationAmo = salaireBrutGlobal * 0.0226;
    }

    let cotisationCimr = 0;
    if (isCIMRActive) {
        const baseCimr = salaireBrutGlobal - indemniteTransport - indemnitePanier;
        cotisationCimr = baseCimr * (tauxCIMR / 100);
    }

    const salaireBrutImposable = salaireBrutGlobal - indemniteTransport - indemnitePanier;

    let fraisPro = 0;
    if (salaireBrutImposable <= 6500) {
        fraisPro = salaireBrutImposable * 0.35;
    } else {
        fraisPro = Math.min(salaireBrutImposable * 0.25, 2916.67);
    }

    const salaireNetImposable = salaireBrutImposable - cotisationCnss - cotisationAmo - cotisationCimr - fraisPro;
    const irBrut = calculerIRSelonBareme(salaireNetImposable);
    const reductionFamille = Math.min(nbCharges, 6) * (500 / 12);
    const irNet = Math.max(0, irBrut - reductionFamille);

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

// --- Handler Vercel Serverless ---
export default function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

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

        res.status(200).json(resultats);
    } catch (error) {
        console.error('Erreur de calcul:', error);
        res.status(500).json({ error: 'Erreur interne du serveur lors du calcul' });
    }
}
