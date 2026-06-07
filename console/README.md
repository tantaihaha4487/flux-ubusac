# flux-ubusac-console

Standalone browser-console version of the `flux-ubusac` geolocation hook.

## Use

1. Open a page on the target site:

```text
https://dev.ubu.ac.th/
```

2. Open browser Developer Tools.
3. Open the `Console` tab.
4. Paste the full contents of `flux-ubusac-console.js` into the console.
5. Press `Enter`.

The script applies once per page load. If you paste it again on the same page, it prints:

```text
[flux-ubusac] console hook already applied
```

## Test

Run this in the same console after applying the script:

```js
navigator.geolocation.getCurrentPosition(console.log)
```

Expected coordinates:

```json
{
  "latitude": 15.114926007239427,
  "longitude": 104.90221112966539
}
```

Only integer `coords.accuracy` is randomized. Latitude and longitude are not jittered.

## Behavior

The script overrides `navigator.geolocation.getCurrentPosition`, `navigator.geolocation.watchPosition`, and `navigator.geolocation.clearWatch` in the page context.

It also watches `console.debug`, `console.info`, `console.log`, and `console.warn` output for coordinates. The first logged `lat,lng` pair or object containing `lat` and `lng` locks the fake position for the rest of the page load.
