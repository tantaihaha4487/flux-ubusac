# flux-ubusac

Firefox Manifest V2 add-on that overrides geolocation on the UBU registration prompt and updates the returned position when the page logs coordinates.

## Target

`https://dev.ubu.ac.th/`

Coordinates:

```json
{
  "lat": 15.114926007239427,
  "lng": 104.90221112966539
}
```

## Options

Open the extension options to configure the random integer `coords.accuracy` range. Defaults are `0` to `10`.

Latitude and longitude are not randomized.

## Load Temporarily

1. Open `about:debugging#/runtime/this-firefox`.
2. Click `Load Temporary Add-on...`.
3. Select `manifest.json` from this folder.
4. Visit any page on the target site.

To test in the page console:

```js
navigator.geolocation.getCurrentPosition(console.log)
```
