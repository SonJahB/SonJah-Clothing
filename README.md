# SonJah Clothing

## Run the site

This project uses Node.js built-in modules and needs no package installation.

```sh
ADMIN_API_KEY='choose-a-long-private-key' node server.js
```

Open `http://localhost:3000`. The storefront and admin page both use the shared catalogue stored in `data/products.json`. Admin changes are saved to that file and appear for other visitors. The first edit prompts for the API key; the key stays in that browser tab's session.

Open the site through the server URL (`http://localhost:3000`), not by double-clicking `public/index.html`. The server maps the contents of `public/` to the site root so `index.html`, `admin.html`, assets, and the `/api/products` endpoint share the same origin.

Set `PORT` to change the port. Keep `ADMIN_API_KEY` private and use a hosting provider with HTTPS before making the site public.

## Project layout

- `server.js` — Node.js web server and catalogue API
- `public/` — storefront and admin pages served to visitors
- `public/assets/css/` — site styles
- `public/assets/js/` — browser scripts
- `public/assets/images/` — logos and storefront artwork
- `data/products.json` — shared catalogue data
- `reference/screenshots/` — saved design screenshots
