# Matelas Sankara — Plateforme de gestion (frontend)

Application web unique pour tous les rôles : caissier, magasinier, comptable,
administrateur et super administrateur. Chacun voit un panel adapté à ses
permissions.

- **Stack** : React 18 · TypeScript (strict) · Vite · React Router · TanStack Query · Ant Design 5 · Zustand · pnpm
- **Documents de référence** : `Cahier des charges`, `FRONTEND.md`, `BACKEND.md`

> L'application ne contient aucune règle métier critique : **le backend décide**,
> le frontend guide et affiche. Les contrôles côté client (stock, remise) ne
> servent que le confort de saisie.

## Démarrer

```bash
cp .env.example .env          # VITE_API_URL pointe vers l'API
pnpm install
pnpm dev                      # http://localhost:5173
```

L'API doit tourner (voir le dépôt `sankara-backend`) : au chargement,
l'application tente un `POST /auth/refresh` silencieux puis `GET /auth/me`.

## Scripts

| Script                                          | Rôle                                                             |
| ----------------------------------------------- | ---------------------------------------------------------------- |
| `pnpm dev` / `pnpm build` / `pnpm preview`      | Développement, build statique, prévisualisation                  |
| `pnpm gen:api`                                  | Régénère `src/shared/api/schema.d.ts` depuis le Swagger de l'API |
| `pnpm lint` / `pnpm lint:check` / `pnpm format` | ESLint (corrige) / ESLint (vérifie) / Prettier                   |
| `pnpm typecheck`                                | `tsc --noEmit`                                                   |
| `pnpm test` / `pnpm test:watch`                 | Vitest + Testing Library                                         |

## Organisation du code

```
src/
├── main.tsx            point d'entrée
├── app/                providers, thème Ant Design, client Query, routeur
├── layouts/            AuthLayout · AppLayout (menu + en-tête) · PosLayout (plein écran)
├── shared/
│   ├── api/            axios + intercepteurs, clés de requête, erreurs traduites, types
│   ├── auth/           store Zustand, usePermission, RequireAuth, RequirePermission
│   ├── components/     Money, StatusTag, PageHeader, PermissionGate, OfflineBanner…
│   ├── hooks/          useDebounce, useOnline
│   ├── utils/          formatXof, formatDate (fuseau Africa/Porto-Novo)
│   └── constants/      libellés des enums, couleurs de statut, accueil par rôle
└── features/           un dossier par module métier (api.ts, hooks.ts, pages, components)
```

Règle : **une fonctionnalité n'importe jamais les fichiers internes d'une autre** ;
ce qui est partagé monte dans `shared/`.

## Conventions

- Jeton d'accès **en mémoire** (Zustand), jamais dans `localStorage` ; le refresh
  token vit dans un cookie `HttpOnly`. Seul le site courant est mémorisé localement.
- Site courant envoyé dans l'en-tête `X-Site-Id` ; en changer vide le cache des
  requêtes liées au site.
- Les types d'API viennent de `schema.d.ts` (généré) — aucun DTO écrit à la main.
- Montants en entiers XOF, affichés par `<Money />` ; dates en JJ/MM/AAAA.
- Commits conventionnels vérifiés par commitlint ; `lint-staged` au commit,
  lint + types + tests au push (hooks husky).

## Écrans livrés

| Écran               | Rôle                   | Ce qu'il fait                                                                                            |
| ------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------- |
| Connexion           | tous                   | Email ou téléphone, redirection vers l'accueil du rôle                                                   |
| Tableau de bord     | `reports:read`         | CA jour / semaine / mois, courbe sur 30 jours, top ventes, stock bas, caisses à vérifier, écarts du mois |
| Point de vente      | `sales:create`         | Ouverture de caisse, recherche et scan, panier, encaissement, ticket                                     |
| Ma caisse           | `cash-sessions:open`   | Totaux en temps réel, recette attendue                                                                   |
| Clôture             | `cash-sessions:close`  | Saisie des montants comptés, aide au comptage par coupures                                               |
| Sessions à vérifier | `cash-sessions:verify` | File d'attente du comptable                                                                              |
| Vérification        | `cash-sessions:verify` | Écart en direct, conformité, régularisation, historique                                                  |

### Le point de vente

- **sans caisse ouverte**, l'écran ne propose que « Ouvrir ma caisse » ;
- recherche à 250 ms de debounce, et **douchette** détectée à la cadence de
  frappe : un code scanné ajoute l'article directement ;
- une carte en rupture est grisée et ne s'ajoute pas — contrôle de confort, le
  backend reste l'arbitre ;
- **panier persistant** (`sessionStorage`) : un rechargement accidentel en
  pleine vente ne le perd pas ;
- encaissement multi-modes, rendu monnaie affiché en grand, référence
  obligatoire hors espèces, « Valider » actif seulement si la somme égale le
  total ;
- **une clé d'idempotence par tentative** : après une coupure réseau, « Réessayer »
  rejoue la même clé et la vente n'est jamais enregistrée deux fois. Toute
  modification du panier repart sur une clé neuve ;
- raccourcis : `F2` recherche, `F4` client, `F9` encaisser, `Ctrl+Suppr` vider.

## Contrat avec l'API

```bash
VITE_OPENAPI_URL=http://localhost:3000/docs-json pnpm gen:api
```

`src/shared/api/schema.d.ts` est **généré**, jamais édité : les corps de requête
et les énumérations en viennent. Les réponses ne sont pas encore décrites côté
backend (les contrôleurs n'exposent pas de DTO de sortie) : elles sont déclarées
à la main dans `shared/api/types.ts`, regroupées pour qu'une divergence se
corrige en un seul endroit. À mesure que le backend ajoutera ses
`@ApiOkResponse`, ces vues se remplaceront par des alias générés.

## Poids des bundles

Le point de vente charge **~333 Ko gzip** (React, Ant Design, le routeur et
l'écran lui-même), au-dessus de la cible de 250 Ko du cahier des charges. Les
deux tiers sont Ant Design, que le même document impose. La bibliothèque de
graphiques a été retirée au profit d'un histogramme SVG maison : elle pesait à
elle seule plus de 400 Ko gzip pour une courbe.

## À brancher

Catalogue, stock, transferts, inventaires, historique des ventes et retours,
clients, rapports, notifications et administration : chacun avec son dossier de
fonctionnalité et ses routes chargées en `lazy`, sur le modèle de
`features/cash-sessions`.
