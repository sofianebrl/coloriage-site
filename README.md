# CoachManager 🏅

Application web (PWA) pour les **coachs de sport collectif** : gérez vos groupes,
le calendrier des entraînements/matchs et faites l'appel des présences, sur mobile
comme sur ordinateur.

## Fonctionnalités (MVP)

- **Groupes / équipes** — créez plusieurs équipes, chacune avec sa couleur.
- **Membres** — fiches joueurs (nom, n° de maillot, poste, téléphone du parent).
- **Calendrier** — planifiez entraînements et matchs (date, lieu, adversaire, notes),
  en vue **liste** (à venir / passées) ou en vue **mois** (grille agenda).
- **Présences** — faites l'appel en un tap (présent / absent / excusé) avec le
  compteur de présents.
- **Statistiques** — taux de présence par joueur sur la saison, classé du plus
  assidu au moins assidu, avec moyenne du groupe.
- **Fiche joueur** — page dédiée par joueur : infos, bouton d'appel, note de
  niveau, taux de présence et historique des séances.
- **Tableau de bord (style DYF)** — profil coach personnalisable (photo, nom,
  rôle, citation, étoiles), widgets Calendrier semaine, Présence (donut),
  Indicateurs clés.
- **Charge d'entraînement** — calcul du rapport charge aiguë/chronique à partir
  de l'intensité des séances, avec alertes (rotation conseillée / risque de
  fatigue).
- **Évaluation** — note de niveau par joueur et moyenne de l'effectif.
- **Footboard** — composition d'équipe sur un terrain (formations 4-3-3,
  4-4-2, 3-5-2).
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
- 🧑‍🤝‍🧑 Partage du planning avec les joueurs/parents
