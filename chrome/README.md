# flux-ubusac

Chrome Manifest V3 extension that overrides geolocation on the UBU registration prompt and updates the returned position when the page logs coordinates.

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

## Load Unpacked

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select this folder.
5. Visit any page on the target site.

To test in the page console:

```js
navigator.geolocation.getCurrentPosition(console.log)
```
