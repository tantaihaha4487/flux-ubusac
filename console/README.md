# Console tools

## Existing registration map

1. Open the UBU `/regisprompt/register/?rand=…` page and wait for its activity and map to load.
2. Open DevTools → Console.
3. Paste all of [`regisprompt-location.js`](regisprompt-location.js), then press Enter.

This helper reads the current activity center and radius, stops the previous watch and starts tracking again. It selects one random point inside the radius with the same `sqrt(random) * radius` spherical sampler used by the extensions. Subsequent GPS callbacks reuse that point. Accuracy is picked once from 1–10 m; zero is excluded because the current page ignores it.

To use the activity center instead, change `randomLocationInRange: true` to `false` before pasting. Running the helper again samples a new point and restores the previous helper first.

Remove the helper with:

```js
window.fluxRegispromptLocation.restore()
```

Reload afterward to request real GPS again. Reload before switching between hook variants. This helper does not submit registration or interact with consent/login controls.

## General page hook

[`flux-ubusac-console.js`](flux-ubusac-console.js) scans Nuxt/Vue state and coordinate logs for the target activity. Paste the whole file on `https://dev.ubu.ac.th/`. It applies once per page load and restarts an existing registration-page native GPS watch when it discovers the target.

The same area sampler and default 1–10 m accuracy range apply. Configure `randomLocationInRange` near the top of the file to disable sampling. Reload the page to remove this general hook.

## Validation

Run `node tests/geolocation.cjs` from the repository root. These checks simulate the browser and page GPS lifecycle; they do not submit a real registration.
