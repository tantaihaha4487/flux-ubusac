# flux-ubusac

Firefox Manifest V2 add-on that overrides geolocation on the UBU registration prompt and derives the returned position from the page map/register state.

## Target

`https://dev.ubu.ac.th/`

The page hook scans Nuxt/Vue state for:

- Leaflet circle center and radius
- `department_latitude`, `department_longitude`, `gps_radius`
- a `title` row whose `r_rand` matches the current `?rand=` query
- logged coordinate strings or objects as a fallback

## Options

Open the extension options to configure the random integer `coords.accuracy` range. Defaults are `0` to `10`.

Accuracy is picked once per page-hook run. Latitude/longitude is always picked once inside the received radius when a valid radius is available. Later geolocation calls reuse the same values.

## Load Temporarily

1. Open `about:debugging#/runtime/this-firefox`.
2. Click `Load Temporary Add-on...`.
3. Select `manifest.json` from this folder.
4. Visit any page on the target site.

To test in the page console:

```js
navigator.geolocation.getCurrentPosition(console.log)
```
