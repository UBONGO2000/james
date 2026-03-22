# Portfolio Astro + Decap CMS — Guide de création

Guide complet pour construire un site portfolio statique avec **Astro** (générateur de site) et **Decap CMS** (gestion de contenu sans backend), déployé sur **Netlify**.

---

## Table des matières

1. [Principe](#principe)
2. [Prérequis](#prérequis)
3. [Installation d'Astro](#installation-dastro)
4. [Structure du projet](#structure-du-projet)
5. [Collections de contenu (Markdown)](#collections-de-contenu)
6. [Composants et pages](#composants-et-pages)
7. [Configuration de Decap CMS](#configuration-de-decap-cms)
8. [Connexion CMS ↔ Astro](#connexion-cms--astro)
9. [Style et thèmes](#style-et-thèmes)
10. [Déploiement sur Netlify](#déploiement-sur-netlify)
11. [Flux de travail quotidien](#flux-de-travail-quotidien)
12. [Problèmes courants](#problèmes-courants)

---

## Principe

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────┐
│  Decap CMS UI   │─────▶│  fichiers .md    │─────▶│  Astro SSG  │
│  /admin         │      │  src/content/    │      │  → dist/    │
└─────────────────┘      └──────────────────┘      └─────────────┘
        │                                                  │
        │ commit git                                       │
        ▼                                                  ▼
   ┌──────────┐                                    ┌──────────────┐
   │  GitHub   │────── Netlify build hook ────────▶│  Netlify CDN │
   └──────────┘                                    └──────────────┘
```

- **Astro** génère des pages HTML statiques à partir de fichiers Markdown
- **Decap CMS** fournit une interface web pour éditer le contenu sans toucher au code
- **Netlify** héberge le site et gère le formulaire de contact
- Le contenu vit dans le repo Git — pas de base de données

---

## Prérequis

- **Node.js** ≥ 22 (`node -v`)
- **npm** ou **pnpm** ou **yarn**
- Un compte **GitHub**
- Un compte **Netlify** (gratuit)
- Un éditeur de code (VS Code recommandé)

---

## Installation d'Astro

### 1. Créer le projet

```bash
npm create astro@latest mon-portfolio
# Options recommandées :
#   Template: Empty
#   TypeScript: Strict
#   Install dependencies: Yes
#   Initialize git: Yes
```

### 2. Installer les dépendances

```bash
cd mon-portfolio
npm install sharp              # optimisation d'images
npm install -D @biomejs/biome  # linter/formatter (optionnel)
```

### 3. Scripts npm

```jsonc
// package.json
{
  "scripts": {
    "dev": "astro dev",          // serveur local http://localhost:4321
    "build": "astro build",      // génère dist/
    "preview": "astro preview",  // prévisualise dist/
    "lint": "biome check src/",
    "lint:fix": "biome check --write src/"
  }
}
```

### 4. Configurer Astro

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
});
```

---

## Structure du projet

```
mon-portfolio/
├── public/
│   ├── admin/
│   │   ├── index.html          ← interface Decap CMS
│   │   └── config.yml          ← configuration des collections CMS
│   ├── uploads/                 ← images uploadées par le CMS
│   ├── favicon.svg
│   └── favicon.ico
├── src/
│   ├── content/
│   │   ├── creations/           ← fichiers .md (gérés par CMS)
│   │   │   ├── projet-1.md
│   │   │   └── projet-2.md
│   │   └── events/              ← fichiers .md (gérés par CMS)
│   │       ├── event-1.md
│   │       └── event-2.md
│   ├── content.config.ts        ← schémas Zod des collections
│   ├── components/
│   │   ├── Card.astro
│   │   └── EventCard.astro
│   ├── layouts/
│   │   └── Layout.astro
│   ├── pages/
│   │   ├── index.astro          ← page d'accueil
│   │   ├── projets.astro        ← liste des projets
│   │   ├── projets/[slug].astro ← page détail (route dynamique)
│   │   └── contact.astro
│   └── styles/
│       └── global.css
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

---

## Collections de contenu

### Étape 1 — Définir le schéma Zod

```ts
// src/content.config.ts
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const projets = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projets" }),
  schema: z.object({
    title: z.string(),                     // obligatoire
    image: z.string(),                     // chemin vers l'image
    type: z.enum(["logo", "affiche", "web", "autre"]),
    description: z.string().optional(),    // optionnel
    date: z.string().optional(),
  }),
});

export const collections = {
  projets: projets,
};
```

Le schéma Zod sert de **contrat** : il valide les fichiers Markdown et fournit l'autocomplétion TypeScript.

### Étape 2 — Créer un fichier Markdown type

```markdown
---
title: "Mon Super Projet"
image: "/uploads/projet-1.jpg"
type: logo
description: "Création d'un logo pour une marque fictive."
date: "2026-03-15"
---

Description détaillée du projet. Ce texte sera rendu dans la page
de détail via le composant `<Content />`.
```

Le bloc entre `---` est le **frontmatter** (métadonnées en YAML). Le reste est le corps Markdown.

### Étape 3 — Générer les pages dynamiquement

```astro
---
// src/pages/projets/[slug].astro
import { getCollection, render } from "astro:content";
import Layout from "../../layouts/Layout.astro";

// Génère une page statique pour chaque .md du dossier
export async function getStaticPaths() {
  const projets = await getCollection("projets");
  return projets.map((projet) => ({
    params: { slug: projet.id },
    props: { projet },
  }));
}

const { projet } = Astro.props;
const { Content } = await render(projet);
---

<Layout title={projet.data.title}>
  <img src={projet.data.image} alt={projet.data.title} />
  <h1>{projet.data.title}</h1>
  <span>{projet.data.type}</span>
  <div><Content /></div>
</Layout>
```

Astro appelle `getStaticPaths()` au build : pour chaque élément retourné, il génère un fichier HTML.

---

## Composants et pages

### Composant réutilisable

```astro
---
// src/components/ProjectCard.astro
interface Props {
  title: string;
  image: string;
  type: string;
  slug: string;
}

const { title, image, type, slug } = Astro.props;
---

<a href={`/projets/${slug}`} class="card">
  <img src={image} alt={title} loading="lazy" />
  <h3>{title}</h3>
  <span>{type}</span>
</a>
```

### Page liste

```astro
---
// src/pages/projets.astro
import { getCollection } from "astro:content";
import Layout from "../layouts/Layout.astro";
import ProjectCard from "../components/ProjectCard.astro";

const projets = await getCollection("projets");
---

<Layout title="Mes projets">
  <h1>Projets</h1>
  <div class="gallery">
    {projets.map((p) => (
      <ProjectCard
        title={p.data.title}
        image={p.data.image}
        type={p.data.type}
        slug={p.id}
      />
    ))}
  </div>
</Layout>
```

---

## Configuration de Decap CMS

### Étape 1 — Fichier HTML du CMS

```html
<!-- public/admin/index.html -->
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Content Manager</title>
  </head>
  <body>
    <script src="https://unpkg.com/decap-cms@^3/dist/decap-cms.js"></script>
  </body>
</html>
```

Ce fichier charge l'interface Decap CMS depuis un CDN. L'URL d'accès sera `/admin`.

### Étape 2 — Configuration des collections

```yaml
# public/admin/config.yml

# Backend Git (Netlify Identity + Git Gateway)
backend:
  name: git-gateway
  branch: main

# Où stocker les images uploadées
media_folder: "public/uploads"
public_folder: "/uploads"

collections:
  # Collection "projets"
  - name: "projets"
    label: "Projets"
    folder: "src/content/projets"    # dossier des .md
    create: true                      # permet la création depuis le CMS
    slug: "{{slug}}"                  # nom de fichier = slug du titre
    fields:
      - { label: "Titre", name: "title", widget: "string" }
      - label: "Type"
        name: "type"
        widget: "select"
        options:
          - { label: "Logo", value: "logo" }
          - { label: "Affiche", value: "affiche" }
          - { label: "Web", value: "web" }
          - { label: "Autre", value: "autre" }
      - { label: "Image", name: "image", widget: "image" }
      - { label: "Description", name: "description", widget: "text", required: false }
      - { label: "Date", name: "date", widget: "datetime", format: "YYYY-MM-DD" }

  # Collection "événements"
  - name: "events"
    label: "Événements"
    folder: "src/content/events"
    create: true
    slug: "{{slug}}"
    fields:
      - { label: "Titre", name: "title", widget: "string" }
      - { label: "Date", name: "date", widget: "datetime", format: "YYYY-MM-DD" }
      - { label: "Affiche", name: "affiche", widget: "image" }
      - { label: "Description", name: "description", widget: "text", required: false }
```

### Widgets disponibles

| Widget | Usage | Sortie |
|--------|-------|--------|
| `string` | Texte court | `"Mon titre"` |
| `text` | Texte long (textarea) | `"Description..."` |
| `markdown` | Éditeur Markdown | corps du .md |
| `image` | Upload d'image | `"/uploads/photo.jpg"` |
| `number` | Nombre | `42` |
| `boolean` | Case à cocher | `true` |
| `select` | Liste déroulante | `"logo"` |
| `datetime` | Sélecteur de date | `"2026-03-15"` |
| `list` | Liste de valeurs | `["a", "b"]` |
| `object` | Objet imbriqué | `{ key: "value" }` |

---

## Connexion CMS ↔ Astro

Le lien entre les deux se fait par **convention** :

```
Decap CMS                           Astro
─────────                           ─────
config.yml                          content.config.ts
  folder: src/content/projets    →    loader: glob({ base: "./src/content/projets" })
  fields:                           schema: z.object({
    - name: title                   →   title: z.string(),
    - name: image                   →   image: z.string(),
    - name: type (select)           →   type: z.enum([...]),
  })
```

**Règle** : chaque `name` dans config.yml doit correspondre à une propriété du schéma Zod.

### Flux de données

```
1. Éditeur ouvre /admin
2. Decap CMS lit les .md existants dans le dossier
3. Éditeur modifie un projet → Decap commit sur GitHub
4. Netlify détecte le commit → lance `astro build`
5. Astro lit les .md via le schéma Zod → génère les pages HTML
6. Netlify déploie dist/ sur son CDN
```

---

## Style et thèmes

### Approche recommandée : CSS vanilla + custom properties

```css
/* src/styles/global.css */
:root {
  --font-body: "Inter", sans-serif;
  --font-display: "Playfair Display", serif;
  --radius: 12px;
  --max-width: 1200px;
}

[data-theme="light"] {
  --bg: #faf7f2;
  --text: #1c1917;
  --accent: #b85c3a;
}

[data-theme="dark"] {
  --bg: #141210;
  --text: #f0ebe3;
  --accent: #d4845a;
}
```

### Toggle thème (dans Layout.astro)

```html
<script is:inline>
  (function() {
    var saved = localStorage.getItem("theme");
    var theme = saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);

    document.getElementById("theme-toggle").addEventListener("click", function() {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
    });
  })();
</script>
```

---

## Déploiement sur Netlify

### Étape 1 — Push sur GitHub

```bash
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/votre-user/mon-portfolio.git
git push -u origin main
```

### Étape 2 — Connecter à Netlify

1. Aller sur [app.netlify.com](https://app.netlify.com)
2. **Add new site** → **Import an existing project**
3. Sélectionner le repo GitHub
4. Configuration du build :
   - **Build command** : `astro build` (ou `npm run build`)
   - **Publish directory** : `dist`
5. Cliquer **Deploy**

### Étape 3 — Activer Netlify Identity

1. Dans le dashboard Netlify → **Site configuration** → **Identity**
2. Cliquer **Enable Identity**
3. **Settings** → **Identity** → **Services** → **Git Gateway** → **Enable Git Gateway**
4. **Settings** → **Identity** → **Registration** → **Invite only** (recommandé)

### Étape 4 — Inviter des utilisateurs

1. **Identity** → **Invite users**
2. Entrer l'email de l'éditeur
3. L'éditeur reçoit un lien → définit son mot de passe → accède à `/admin`

### Étape 5 — Formulaire de contact

```html
<form name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field">
  <input type="hidden" name="form-name" value="contact" />
  <input type="text" name="name" placeholder="Nom" required />
  <input type="email" name="email" placeholder="Email" required />
  <textarea name="message" placeholder="Message" required></textarea>
  <button type="submit">Envoyer</button>
</form>
```

L'attribut `data-netlify="true"` active le traitement des soumissions par Netlify Forms (gratuit jusqu'à 100/mois).

---

## Flux de travail quotidien

### Pour l'éditeur (non-développeur)

```
1. Aller sur https://mon-site.netlify.app/admin
2. Se connecter avec son email/mot de passe
3. Cliquer sur "Projets" ou "Événements"
4. Cliquer "New Projet"
5. Remplir le formulaire (titre, image, type...)
6. Cliquer "Publish"
7. Attendre ~1 minute → le site est mis à jour
```

### Pour le développeur

```bash
# Travailler en local
npm run dev                     # http://localhost:4321

# Ajouter du contenu manuellement
# → créer un .md dans src/content/projets/

# Tester le build
npm run build                   # génère dist/
npm run preview                 # prévisualise dist/

# Déployer
git add . && git commit -m "nouveau contenu" && git push
# Netlify build automatiquement
```

---

## Problèmes courants

### Les images uploadées ne s'affichent pas

Vérifier que `public/uploads/` existe. Le CMS y écrit les fichiers, mais le dossier doit exister dans le repo.

```bash
mkdir -p public/uploads
touch public/uploads/.gitkeep
git add public/uploads/.gitkeep
```

### Erreur de schéma Zod

Si Astro refuse de build avec une erreur `invalid_type`, c'est qu'un champ Markdown ne correspond pas au schéma.

```
# Erreur typique :
# "Expected string, received number" sur le champ "likes"
```

Solution : vérifier que la valeur dans le frontmatter correspond au type Zod (`z.number()` vs `z.string()`).

### Le CMS affiche "Failed to load entries"

1. Vérifier que Git Gateway est activé dans Netlify
2. Vérifier que l'utilisateur a accepté l'invitation
3. Vérifier que le `branch` dans `config.yml` correspond à la branche principale

### Le formulaire Netlify ne fonctionne pas en local

C'est normal. `data-netlify="true"` ne fonctionne qu'une fois déployé sur Netlify. En local, le formulaire fait une requête POST standard qui échoue.

### Les routes dynamiques retournent 404

Vérifier que `getStaticPaths()` retourne bien des objets avec `params` et `props` :

```ts
return projets.map((p) => ({
  params: { slug: p.id },  // ← doit correspondre au nom du fichier [slug].astro
  props: { projet: p },
}));
```

---

## Récapitulatif des fichiers clés

| Fichier | Rôle |
|---------|------|
| `astro.config.mjs` | Configuration Astro (image service, intégrations) |
| `src/content.config.ts` | Schémas Zod des collections |
| `public/admin/index.html` | Charge l'interface Decap CMS |
| `public/admin/config.yml` | Définit les collections et champs du CMS |
| `src/content/**/*.md` | Contenu géré par le CMS |
| `src/layouts/Layout.astro` | Layout HTML commun |
| `src/pages/**/*.astro` | Pages du site |
| `src/components/*.astro` | Composants réutilisables |
| `src/styles/global.css` | Styles CSS |
| `package.json` | Dépendances et scripts |
