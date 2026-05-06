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

 N2YO Updates

 live N2YO pass data should be refreshed into `n2yo-passes.js`.


The workflow in `.github/workflows/update-n2yo-passes.yml` refreshes `n2yo-passes.js` every 12 hours ensuring ISS pass predications are updated automatically.

## Sources and Data References

This project uses public and project-specific sources for visualization, pass prediction, and space situational awareness context.

- **N2YO REST API:** Used for ISS radio-pass predictions over the PNU receiver site. ISS NORAD ID: `25544`.  
  https://www.n2yo.net/api/
- **Where the ISS at? API:** Used as an optional live ISS position source for latitude, longitude, altitude, and velocity.  
  https://wheretheiss.at/w/developer
- **OrbitSmith:** Used as a reference for LEO catalog visualization style, tracked-object categories, and debris-dashboard inspiration.  
  https://orbitsmith.net/
- **LeoLabs System Metrics:** Used for public SSA context such as tracked-object/system performance metrics.  
  https://api.leolabs.space/system_metrics
- **Three.js:** Used as the local 3D rendering library for the Earth scene and interactive visualizer.  
  https://threejs.org/
- **Three.js Earth texture examples:** Used as reference/source material for Earth surface, clouds, lights, normal, and specular textures.  
  https://github.com/mrdoob/three.js/tree/dev/examples/textures/planets

This dashboard is for educational and demonstration purposes only. It is not intended for operational satellite tracking, collision avoidance, or safety-critical space surveillance decisions.


