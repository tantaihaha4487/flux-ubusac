# flux-ubusac-chrome

Geolocation override tools for `https://dev.ubu.ac.th/`.

## Variants

- `chrome/` - Chrome Manifest V3 extension.
- `firefox/` - Firefox Manifest V2 add-on.
- `console/` - standalone browser-console hook.

## CI Packaging

GitHub Actions validates the JavaScript files and manifests, then builds zip artifacts for the Chrome and Firefox extensions.

The generated archives are not committed to the repository. Download them from the workflow run artifacts.
