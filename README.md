# Urban Passive Radar for LEO Debris Detection Dashboard Demo

Static browser demo for presenting our project idea in an interactive way! Demo uses the following passive bistatic geometry:

- `PNU Radio Telescope` as the RX node
- `Riyadh TV Tower` as the TX node
- `ISS` as the tracked object

RX/TX coordinates are taken from google maps:

- `PNU`: `24.856155, 46.72139`
- `Riyadh TV Tower`: `24.64322, 46.6960`

## Files

- `index.html` - clean visualizer page (scene-first view)
- `storyline.html` - narrative/story page with cards and expanded project context
- `styles.css` - mission-control visual styling and responsive layout
- `app.js` - 3D scene, geometry calculations, story mode, and content scaffolding
- `vendor/three.min.js` - local Three.js runtime for the browser

## Run

Open one of these in a modern browser:

- `index.html` for the visualizer-only page
- `storyline.html` for the storytelling page

The demo is designed to work offline after load. If the live ISS API is unreachable or blocked, it falls back automatically to a scripted orbit path.

## GitHub Pages And N2YO Updates

GitHub Pages serves this as a static site, so live N2YO pass data should be refreshed into `n2yo-passes.js`.

Before publishing publicly, do not put the N2YO key in `n2yo-config.js`. Instead, add it as a GitHub repository secret named `N2YO_API_KEY`.

The workflow in `.github/workflows/update-n2yo-passes.yml` refreshes `n2yo-passes.js` every 12 hours and can also be run manually from the GitHub Actions tab.

## Replace Placeholder Research Copy

Update the `CONTENT_SECTIONS` object in `app.js` to add:

- your final project overview
- passive radar explanation
- LEO debris statistics
- project aims
- references and example websites
