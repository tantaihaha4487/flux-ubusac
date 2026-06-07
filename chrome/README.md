# flux-ubusac Chrome Extension

Chrome Manifest V3 extension that overrides geolocation on the UBU registration prompt and derives the returned position from the page map/register state.

## Target

`https://dev.ubu.ac.th/`

The page hook scans Nuxt/Vue state for:

- Leaflet circle center and radius
- `department_latitude`, `department_longitude`, `gps_radius`
- a `title` row whose `r_rand` matches the current `?rand=` query
- logged coordinate strings or objects as a fallback

## Side panel settings

Open the Chrome side panel for the main settings UI. It uses the same soft white + dark-blue dashboard design as the Firefox sidebar and includes:

- randomize location in detected radius
- restore defaults
- advanced settings for:
  - accuracy min/max
  - target origin
  - scan interval/timeout
  - debug logs
  - manual fallback coordinates
  - live status readout
  - export/import JSON

The old options page still exists as a quick fallback for accuracy range only.

Accuracy is picked once per page-hook run. Latitude/longitude is picked once inside the received radius when randomization is enabled and a valid radius is available. Later geolocation calls reuse the same values.

## Load Temporarily

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click `Load unpacked`.
4. Select this folder.
5. Open the extension side panel when you want to change settings.
6. Visit any page on the target site.

To test in the page console:

```js
navigator.geolocation.getCurrentPosition(console.log)
```
