Ayelet Yeruham - Artist Portfolio
==================================

This repository powers the zero-cost static website at https://ayeletyeruham.com.
It is designed to run directly on GitHub Pages with no build step, no paid CMS,
and no server dependency.

Project structure
-----------------

- `index.html` contains the accessible page structure, metadata, and contact form.
- `assets/css/main.css` contains the complete visual system.
- `assets/js/artworks.js` is the structured artwork archive used by the gallery.
- `assets/js/main.js` renders filters, search, lightbox, navigation, and keyboard controls.
- `images/` contains preserved artwork, portrait, press, and favicon assets.
- `robots.txt` and `sitemap.xml` support search indexing.
- `CNAME` keeps the custom domain connected to GitHub Pages.

Updating artworks
-----------------

Each artwork uses two image sizes so the gallery loads fast and the lightbox
stays sharp:

- `images/art/<n>.jpg`: full image for the lightbox (max 1920px, JPEG ~85)
- `images/thumbs/<n>.jpg`: grid thumbnail (max 800px, JPEG ~80)

On a Mac you can create both with `sips`:

```sh
sips -Z 1920 -s format jpeg -s formatOptions 85 original.jpg --out images/art/300.jpg
sips -Z 800 -s format jpeg -s formatOptions 80 original.jpg --out images/thumbs/300.jpg
```

Then add one object at the TOP of `assets/js/artworks.js` (newest works appear
first) with:

- `src`: full image path (used in the lightbox)
- `thumb`: thumbnail path (used in the gallery grid)
- `title`: artwork title
- `medium`: material description
- `dimensions`: artwork size, e.g. "70 x 50"
- `year`: creation year (number) - powers the year filter buttons
- `status`: optional; "sold" (red mark) or "nfs" (blue "Not for sale" mark)
- `category`: one of the filter labels, or a new label
- `alt`: concise accessibility text

Notes for future image updates:

- Keep the old filename if you are replacing an existing artwork image and want
  the gallery order/details to stay the same.
- Add a new object in `assets/js/artworks.js` only when adding a brand-new
  artwork.
- Year filter buttons and category filter buttons are generated automatically
  from the data; there is nothing else to update.
- Use compressed JPG/JPEG/PNG files when possible so GitHub Pages stays fast.

Site title and icon
-------------------

The browser/search title is set in `index.html` as `Ayelet Yeruham Art`.
The favicon/search icon uses Ayelet's portrait:

- `favicon.png`
- `images/favicon-16x16.png`
- `images/favicon-32x32.png`
- `images/favicon-48x48.png`
- `images/apple-touch-icon.png`
- `images/icon-512x512.png`

Local preview
-------------

From the repository root, run:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

GitHub Pages deployment
-----------------------

Push changes to the GitHub repository. In GitHub Pages settings, publish from
the `main` branch root. The existing `CNAME` file should keep
`ayeletyeruham.com` attached.

Contact form
------------

The contact form uses the existing Formspree endpoint:

`https://formspree.io/f/xjvnrqvn`
