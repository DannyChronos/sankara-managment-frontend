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

## À brancher

Les écrans actuels sont le socle : connexion, redirection par rôle, coquille
d'application avec menu filtré par permission, tableau de bord et point de vente.
Les modules suivants (`catalog`, `stock`, `transfers`, `inventories`,
`cash-sessions`, `sales`, `reports`, administration) s'ajoutent un par un, chacun
avec son `routes.tsx` chargé en `lazy`, à mesure que les endpoints existent.
