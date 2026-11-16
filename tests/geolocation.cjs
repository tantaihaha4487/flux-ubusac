const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const files = ['chrome/page-hook.js', 'firefox/page-hook.js', 'console/flux-ubusac-console.js', 'console/regisprompt-location.js'];
function distance(a, b) {
  const rad = x => x * Math.PI / 180;
  const dlat = rad(a.latitude - b.latitude), dlng = rad(a.longitude - b.longitude);
  return 2 * 6378137 * Math.asin(Math.sqrt(Math.sin(dlat/2)**2 + Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(dlng/2)**2));
}
function run(file, random = true, latitude = '15.120250170571007', sample = 0.25) {
  let code = fs.readFileSync(path.join(root, file), 'utf8');
  if (!random) code = code.replace('randomLocationInRange: true', 'randomLocationInRange: false');
  const tasks = new Map(), cancelled = [], received = [];
  let timer = 0;
  const geo = {getCurrentPosition() {}, watchPosition() {return 71;}, clearWatch(id) {cancelled.push(id);}};
  const originals = {...geo};
  const page = {rand: 'activity', department_latitude: latitude, department_longitude: '104.90910730447975', gps_radius: 50,
    watchID: 71, restarts: 0, form: {},
    stopGpsTracking() {if (this.watchID != null) geo.clearWatch(this.watchID); this.watchID = null;},
    onGpsPosition(p) {received.push(p); this.form.lat = p.coords.latitude; this.form.lng = p.coords.longitude;},
    todo() {this.restarts++; this.stopGpsTracking(); geo.getCurrentPosition(p => this.onGpsPosition(p)); this.watchID = geo.watchPosition(p => this.onGpsPosition(p));}
  };
  const location = {origin: 'https://dev.ubu.ac.th', pathname: '/regisprompt/register/', search: '?rand=activity'};
  const math = Object.create(Math); math.random = () => sample;
  const context = {URLSearchParams, Math: math, location, navigator: {geolocation: geo},
    document: {getElementById() {return null;}}, $nuxt: {$children: [page]},
    console: Object.fromEntries(['log','debug','info','warn','error'].map(k => [k, () => {}])),
    setTimeout(fn) {tasks.set(++timer, fn); return timer;}, clearTimeout(id) {tasks.delete(id);},
    setInterval() {return ++timer;}, clearInterval() {}, addEventListener() {}, postMessage() {}};
  context.window = context;
  vm.runInNewContext(code, context);
  const flush = () => {while (tasks.size) {const pending = [...tasks.values()]; tasks.clear(); pending.forEach(fn => fn());}};
  flush();
  return {geo, page, received, cancelled, context, originals, flush};
}
for (const file of files) {
  const x = run(file);
  assert.equal(x.page.restarts, 1, file + ': restart native tracking');
  assert.deepEqual(x.cancelled, [71], file + ': clear native watch');
  assert.equal(x.received.length, 2);
  const center = {latitude: 15.120250170571007, longitude: 104.90910730447975};
  assert.ok(Math.abs(distance(x.received[0].coords, center) - 25) < 1e-6, file + ': sqrt radial sampling');
  assert.ok(x.received[0].coords.accuracy >= 1 && x.received[0].coords.accuracy <= 10);
  let next; x.geo.getCurrentPosition(p => {next = p;}); x.flush();
  assert.deepEqual(next.coords, x.received[0].coords, file + ': stable coordinates');
  const fixed = run(file, false);
  assert.equal(distance(fixed.received[0].coords, center), 0, file + ': disabled randomization');
  for (const sample of [0, 0.01, 0.5, 0.99, 0.999999999999]) {
    const edge = run(file, true, String(center.latitude), sample);
    assert.ok(distance(edge.received[0].coords, center) <= 50 + 1e-6, file + ': within radius');
  }
  if (file.endsWith('/regisprompt-location.js')) {
    x.context.fluxRegispromptLocation.restore();
    for (const name of Object.keys(x.originals)) assert.equal(x.geo[name], x.originals[name]);
    assert.throws(() => run(file, true, ''), /Wait for the activity/);
  }
  console.log('PASS', file);
}
for (const variant of ['chrome','firefox']) {
  const context = {}; context.window = context;
  vm.runInNewContext(fs.readFileSync(path.join(root, variant, 'settings.js'), 'utf8'), context);
  const settings = context.FluxUbusacSettings;
  assert.equal(settings.defaults.accuracyMin, 1);
  const normalized = settings.normalizeConfig({accuracyMin: 0, accuracyMax: 0});
  assert.equal(normalized.accuracyMin, 1); assert.equal(normalized.accuracyMax, 1);
}
console.log('PASS persisted zero accuracy settings migrate to positive values');
