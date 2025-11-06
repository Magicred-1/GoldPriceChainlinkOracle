# 🚀 Web3 Workshop – Smart Contract & NFT Integration

## 🎯 Objectif

Construire un **front-end Next.js + Wagmi** qui intègre :
- Un **smart contract de token** (`GoldStableChainlink.sol`)
- Un **smart contract NFT** (`NFTCollection.sol`)
- La possibilité de **minter des NFTs en payant avec votre propre token**

---

## 🧠 Étape 1 — Intégrer le smart contract au front-end

### ✅ Tâches

1. **Utiliser l’ABI et le smart contract déployé**
   - Importer l’ABI et l’adresse du contrat `GoldStableChainlink.sol` dans le projet front-end.

2. **Intégration avec Next.js & Wagmi**
   - Mettre en place un projet **Next.js**.
   - Installer **Wagmi** et **ViEM** pour interagir avec la blockchain.
   - Intégrer les fonctions :
     - `mintWithCollateral()`
     - `balanceOf(address)`
     - `approve(spender, amount)` pour permettre les transactions de tokens entre le smart contract et le token.

3. **Front-end**
   - Afficher le solde (`balanceOf`) du token pour l’adresse connectée.
   - Permettre à l’utilisateur de **minter des tokens** via `mintWithCollateral`.

4. **Organisation**
   - 👥 Atelier à faire en groupe de **3 maximum**.

5. **Déploiement**
   - 🚀 Déployer le front-end sur **Vercel**.

---

## 🖼️ Étape 2 — Intégrer l’achat de vos propres NFT avec votre token

### ✅ Tâches

1. **Stockage des métadonnées**
   - Utiliser **Pinata** pour héberger les CIDs (images et métadonnées) de votre collection NFT.

2. **Compléter le smart contract NFT**
   - Compléter et déployer `NFTCollection.sol`.
   - Ajouter les fonctions nécessaires pour **créer et minter** des NFTs.
   - Pousser le code sur le **repo GitHub**.

3. **Front-end : affichage et interaction**
   - Afficher la **collection NFT** sur le front-end.
   - Donner la possibilité aux utilisateurs de **minter un NFT** en payant avec votre propre token (`GoldStableChainlink`).

---

## Étape 3 — Présentation finale
### ✅ Tâches
1. **Préparer une présentation rapide (3 minutes)**
   - Slides expliquant votre projet, les défis rencontrés et les solutions apportées combiné à l'intégration technique.
   - Démo live de votre application front-end déployée sur Vercel.
   - Assurez-vous que le déploiement Vercel fonctionne avant la présentation !
   - Partager le lien du dépôt **GitHub** et du **déploiement Vercel** sur le Google Sheet du workshop.
---

## 🧩 Stack Technique

| Composant | Description |
|------------|-------------|
| **Smart Contracts** | Solidity (`NFTCollection.sol`, `GoldStableChainlink.sol`) |
| **Blockchain** | Ethereum / Sepolia Testnet |
| **Frontend** | Next.js + Wagmi + ViEM |
| **Storage** | Pinata (IPFS) |
| **Deployment** | Vercel |

## 💡 Conseils

- Testez vos contrats sur **Remix** avant l’intégration.
- Vérifiez vos transactions sur **Etherscan (testnet)**.
- Gérer les erreurs de connexion du wallet dans le front-end.
- Mettez à jour les **ABIs** après chaque déploiement de smart contract.

---

## 🧾 À Livrer

- ✅ Smart contracts fonctionnels et vérifiés sur testnet  
- ✅ Front-end déployé sur **Vercel**  
- ✅ Intégration complète des fonctions :
  - `mintWithCollateral`
  - `balanceOf`
  - Mint de NFT avec votre propre token  
- ✅ Lien du dépôt **GitHub**  
- ✅ Lien du **déploiement Vercel**
- ✅ Présentation rapide (3 minutes) de votre projet avec slides et démo live (pensez à vérifier que le Vercel fonctionne avant la présentation !)


---

## 🪙 Références

- [Wagmi Documentation](https://wagmi.sh/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Pinata IPFS](https://www.pinata.cloud/)
- [Vercel Deployment](https://vercel.com/docs)

