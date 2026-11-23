# SonJah Clothing

The frontend is a static site in `public/`. The Node.js API remains in `server.js` and reads/writes the existing `data/products.json` catalogue.

## GitHub Pages frontend

The repository is configured for the `main` branch. `.github/workflows/deploy-pages.yml` publishes the contents of `public/` directly; no frontend build command or package installation is needed. Relative asset and page links allow the site to run at the repository URL:

`https://sonjahb.github.io/Sonjah-Clothing/`

After the files are pushed to GitHub:

1. Open **Settings → Pages** in `SonJahB/SonJah-Clothing`.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push the site files and workflow to `main`. The workflow deploys on each subsequent push; check its run under **Actions**.

The Pages artifact contains only `public/`, so the Node server, admin key, and catalogue file are not published as website files.

## Node.js backend

The API must run on a separate Node.js host. It requires Node.js 20 or newer and has no third-party packages:

```sh
npm start
```

Configure these environment variables on the host:

- `PORT` — provided by most hosts; defaults to `3000` locally.
- `ADMIN_API_KEY` — a long, private secret required for catalogue updates.
- `CORS_ORIGINS` — comma-separated allowed website origins. For this Pages site, set `https://sonjahb.github.io` (no repository path or trailing slash).

The API writes to `data/products.json`. Choose a backend host with a persistent writable disk and mount the app's `data/` directory there; otherwise a restart or redeploy on an ephemeral filesystem can discard catalogue edits. Keep the original JSON file when deploying.

The browser reads `public/assets/js/config.js`. Set `apiBaseUrl` to the backend **origin** after choosing a host, for example `https://your-service.example.com`; no backend URL is set in this project yet. Updating that file and deploying the static files is enough to change the API address; there is no frontend build step. The API host must allow the Pages origin through `CORS_ORIGINS`.

For local development, leave `apiBaseUrl` empty and run `npm start`; the frontend then uses the same-origin `/api/products` route.

## Project layout

- `.github/workflows/deploy-pages.yml` — GitHub Pages deployment workflow
- `public/` — static storefront and admin pages
- `public/assets/` — CSS, browser JavaScript, logos, and artwork
- `server.js` — Node.js API and local static-file server
- `data/products.json` — shared product catalogue
- `.env.example` — names and examples for backend environment settings; contains no real secrets
