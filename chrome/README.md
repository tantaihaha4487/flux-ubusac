# flux-ubusac

Firefox Manifest V2 add-on that overrides geolocation on the UBU registration prompt and derives the returned position from the page map/register state.

## Target

`https://dev.ubu.ac.th/`

The page hook scans Nuxt/Vue state for:

- Leaflet circle center and radius
- `department_latitude`, `department_longitude`, `gps_radius`
- a `title` row whose `r_rand` matches the current `?rand=` query
- logged coordinate strings or objects as a fallback

## Sidebar settings panel

Open the Chrome side panel for the main settings UI. It uses a white + dark-blue theme and includes:

- randomize location in detected radius
- reset defaults
- advanced settings for:
  - accuracy min/max
  - target origin
  - scan interval/timeout
  - debug logs
  - manual fallback coordinates
  - status readout
  - export/import JSON

The old options page still exists as a quick fallback for accuracy range only.

The side panel bundles Kanit locally in `fonts/`, so the panel uses it even when the system font is missing. The UI uses Kanit 200 for the header title and Kanit 300 for supporting text to keep the panel readable.

Accuracy defaults to an integer from 1–10 m, picked once per page-hook run. Stored zero values are clamped to 1 because the current page ignores zero accuracy. When randomization is enabled and a valid radius is available, latitude/longitude is picked once using a random bearing and `sqrt(random) * radius`, distributed across the circle area. Disabling randomization uses the center. Later geolocation calls reuse the same values. Reload after changing settings.

If the registration page has already started a native GPS watch, the hook restarts that watch after selecting its position so the map and form receive the new coordinates. It does not submit registration.

## Load Temporarily

1. Open `chrome://extensions`.
2. Click `Load Temporary Add-on...`.
3. Select `manifest.json` from this folder.
4. Visit any page on the target site.

To test in the page console:

```js
navigator.geolocation.getCurrentPosition(console.log)
```
