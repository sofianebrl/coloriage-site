# CoachManager 🏅

Application web (PWA) pour les **coachs de sport collectif** : gérez vos groupes,
le calendrier des entraînements/matchs et faites l'appel des présences, sur mobile
comme sur ordinateur.

## Fonctionnalités (MVP)

- **Groupes / équipes** — créez plusieurs équipes, chacune avec sa couleur.
- **Membres** — fiches joueurs (nom, n° de maillot, poste, téléphone du parent).
- **Calendrier** — planifiez entraînements et matchs (date, lieu, adversaire, notes),
  séparés en « à venir » et « passées ».
- **Présences** — faites l'appel en un tap (présent / absent / excusé) avec le
  compteur de présents.
- **Installable** — fonctionne comme une appli (PWA) sur téléphone.

## Stack technique

- [Next.js 15](https://nextjs.org/) (App Router) + React 19 + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com/)
- Données stockées **en local** dans le navigateur (`localStorage`) — aucune
  configuration de serveur requise pour démarrer.

## Démarrer

```bash
npm install
npm run dev
```

L'app tourne sur http://localhost:3000.

Pour une version de production :

```bash
npm run build
npm start
```

## Architecture

```
app/
  layout.tsx        # layout global + navigation
  page.tsx          # tableau de bord + gestion des groupes
  membres/          # liste et fiches des membres
  calendrier/       # séances (entraînements / matchs)
  presences/        # appel des présences
components/          # composants UI réutilisables (Nav, Modal, Button…)
lib/
  types.ts          # modèle de données
  store.tsx         # store React + persistance localStorage
  format.ts         # helpers de dates (français)
```

La couche de données est isolée dans `lib/store.tsx` : tout passe par le hook
`useStore()`. Pour brancher une vraie base de données partagée plus tard (ex.
Supabase / Postgres), il suffira de remplacer l'implémentation du store sans
toucher aux pages.

## Pistes d'évolution

- 🔐 Comptes coachs + base de données partagée (synchro multi-appareils)
- 📣 Communication : convocations, annonces et rappels aux membres
- 📊 Statistiques de présence sur la saison
- 📅 Vue calendrier mensuelle
- 🧑‍🤝‍🧑 Partage du planning avec les joueurs/parents
