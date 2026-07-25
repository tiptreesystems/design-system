import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const targetUrl = process.argv[2];
if (!targetUrl) {
  console.error('usage: node tests/parity/consumer-run.mjs <http-or-file-url>');
  process.exit(2);
}

const TOLERANCE = 0.5;
const VIEWPORTS = [
  { name: 'desktop', width: 1024, height: 900, deviceScaleFactor: 1 },
  { name: 'mobile', width: 390, height: 900, deviceScaleFactor: 1 },
  { name: 'desktop-hidpi', width: 1024, height: 900, deviceScaleFactor: 2 },
  { name: 'mobile-hidpi', width: 390, height: 900, deviceScaleFactor: 2 },
];

function findNamedFile(root, wanted, depth = 0) {
  if (!existsSync(root) || depth > 7) return [];
  const found = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isFile() && entry.name === wanted) found.push(path);
    else if (entry.isDirectory()) found.push(...findNamedFile(path, wanted, depth + 1));
  }
  return found;
}

function browserCandidates() {
  return [
    process.env.TT_PARITY_BROWSER,
    ...findNamedFile(join(homedir(), 'Library/Caches/ms-playwright'), 'chrome-headless-shell'),
    ...findNamedFile(join(homedir(), '.cache/puppeteer'), 'chrome-headless-shell'),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'chromium',
    'chromium-browser',
    'google-chrome',
  ].filter(Boolean);
}

function browserWorks(candidate) {
  if (candidate.includes('/') && !existsSync(candidate)) return false;
  return spawnSync(candidate, ['--version'], { encoding: 'utf8' }).status === 0;
}

function connectCdp(url) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    let nextId = 1;
    const pending = new Map();
    socket.addEventListener('open', () => {
      resolve({
        send(method, params = {}) {
          const id = nextId++;
          socket.send(JSON.stringify({ id, method, params }));
          return new Promise((resolveRequest, rejectRequest) => {
            pending.set(id, { resolve: resolveRequest, reject: rejectRequest });
          });
        },
        close() {
          socket.close();
        },
      });
    });
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (!message.id || !pending.has(message.id)) return;
      const request = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
    });
    socket.addEventListener('error', () => reject(new Error(`CDP connection failed: ${url}`)));
  });
}

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function launchBrowser(browser, profileDirectory) {
  const child = spawn(
    browser,
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--allow-file-access-from-files',
      '--remote-debugging-port=0',
      `--user-data-dir=${profileDirectory}`,
      'about:blank',
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  );
  let stderr = '';
  const websocketUrl = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`browser did not expose CDP\n${stderr}`)), 10_000);
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
      const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (!match) return;
      clearTimeout(timeout);
      resolve(match[1]);
    });
    child.on('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`browser exited before CDP was ready (${code})\n${stderr}`));
    });
  });
  const endpoint = new URL(websocketUrl);
  const listUrl = `http://${endpoint.host}/json/list`;
  let pages = [];
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      pages = await (await fetch(listUrl)).json();
      if (pages.some((page) => page.type === 'page')) break;
    } catch {
      // Browser endpoint can race startup.
    }
    await delay(50);
  }
  const page = pages.find((candidate) => candidate.type === 'page');
  if (!page) throw new Error('browser exposed no debuggable page');
  return { child, cdp: await connectCdp(page.webSocketDebuggerUrl) };
}

const measurementExpression = `(() => {
  const layoutProperties = [
    'height', 'minHeight', 'width',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'gap', 'fontSize', 'lineHeight', 'letterSpacing',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth'
  ];
  const identityProperties = [
    'backgroundColor', 'color', 'borderTopColor', 'borderRadius',
    'fontFamily', 'fontWeight', 'cursor', 'opacity'
  ];
  const rect = (element, parentRect) => {
    const value = element.getBoundingClientRect();
    return {
      x: value.x - parentRect.x,
      y: value.y - parentRect.y,
      width: value.width,
      height: value.height
    };
  };
  const state = (container) => {
    const parent = container.querySelector('[data-parent]');
    const parentRect = parent.getBoundingClientRect();
    const controls = {};
    for (const control of container.querySelectorAll('[data-control]')) {
      const style = getComputedStyle(control);
      const icon = control.querySelector('svg, img');
      controls[control.dataset.control] = {
        layout: {
          ...Object.fromEntries(layoutProperties.map((name) => [name, style[name]])),
          rect: rect(control, parentRect),
          icon: icon ? rect(icon, parentRect) : null
        },
        identity: Object.fromEntries(identityProperties.map((name) => [name, style[name]]))
      };
    }
    const adjacent = {};
    for (const element of container.querySelectorAll('[data-adjacent]')) {
      adjacent[element.dataset.adjacent] = rect(element, parentRect);
    }
    return {
      parent: { width: parentRect.width, height: parentRect.height },
      controls,
      adjacent
    };
  };
  return [...document.querySelectorAll('[data-proof]')].map((proof) => ({
    name: proof.dataset.proof,
    original: state(proof.querySelector('[data-state="original"]')),
    target: state(proof.querySelector('[data-state="target"]'))
  }));
})()`;

function numeric(value) {
  if (typeof value === 'number') return value;
  const match = String(value).match(/^(-?[0-9]+(?:\.[0-9]+)?)px$/);
  return match ? Number(match[1]) : null;
}

function compareScalar(original, target, path, mismatches) {
  const originalNumber = numeric(original);
  const targetNumber = numeric(target);
  if (originalNumber !== null && targetNumber !== null) {
    const delta = Math.abs(originalNumber - targetNumber);
    if (delta > TOLERANCE) mismatches.push(`${path}: ${original} != ${target} (${delta}px)`);
    return delta;
  }
  if (original !== target) mismatches.push(`${path}: ${original} != ${target}`);
  return 0;
}

function compareObject(original, target, path, mismatches) {
  let maxDelta = 0;
  for (const [key, value] of Object.entries(original)) {
    if (value && typeof value === 'object') {
      maxDelta = Math.max(
        maxDelta,
        compareObject(value, target[key], `${path}.${key}`, mismatches),
      );
    } else {
      maxDelta = Math.max(
        maxDelta,
        compareScalar(value, target[key], `${path}.${key}`, mismatches),
      );
    }
  }
  return maxDelta;
}

const browser = browserCandidates().find(browserWorks);
if (!browser) {
  console.error('DEGRADED: no Chrome/Chromium found; set TT_PARITY_BROWSER.');
  process.exit(2);
}

const profileDirectory = mkdtempSync(join(tmpdir(), 'tt-consumer-parity-'));
let launched;
let failed = false;
const reports = [];
try {
  launched = await launchBrowser(browser, profileDirectory);
  const { cdp } = launched;
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  for (const viewport of VIEWPORTS) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: viewport.deviceScaleFactor,
      mobile: false,
    });
    await cdp.send('Page.navigate', { url: targetUrl });
    await cdp.send('Runtime.evaluate', {
      expression: `new Promise((resolve) => {
        const ready = () => document.fonts.ready.then(() => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        if (document.readyState === 'complete') ready();
        else addEventListener('load', ready, { once: true });
      })`,
      awaitPromise: true,
    });
    const media = await cdp.send('Runtime.evaluate', {
      expression: `({
        devicePixelRatio: window.devicePixelRatio,
        highDensityRuleMatches: matchMedia('(resolution >= 192dpi)').matches
      })`,
      returnByValue: true,
    });
    const measured = await cdp.send('Runtime.evaluate', {
      expression: measurementExpression,
      returnByValue: true,
    });
    const proofs = measured.result.value;
    if (!proofs.length) {
      failed = true;
      console.error(`FAIL ${viewport.name}: target page exposed no [data-proof] cases`);
      reports.push({ viewport, media: media.result.value, proofs });
      continue;
    }

    for (const proof of proofs) {
      for (const stateName of ['original', 'target']) {
        proof[stateName].hoverIdentity = {};
        for (const controlName of Object.keys(proof[stateName].controls)) {
          const selector = `[data-proof=${JSON.stringify(proof.name)}] [data-state=${JSON.stringify(
            stateName,
          )}] [data-control=${JSON.stringify(controlName)}]`;
          const centerResult = await cdp.send('Runtime.evaluate', {
            expression: `(() => {
              const element = document.querySelector(${JSON.stringify(selector)});
              element.scrollIntoView({ block: 'center', inline: 'center' });
              const rect = element.getBoundingClientRect();
              return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
            })()`,
            returnByValue: true,
          });
          await cdp.send('Input.dispatchMouseEvent', {
            type: 'mouseMoved',
            x: centerResult.result.value.x,
            y: centerResult.result.value.y,
          });
          await cdp.send('Runtime.evaluate', {
            expression: 'new Promise((resolve) => setTimeout(resolve, 350))',
            awaitPromise: true,
          });
          const hover = await cdp.send('Runtime.evaluate', {
            expression: `(() => {
              const style = getComputedStyle(document.querySelector(${JSON.stringify(selector)}));
              return {
                backgroundColor: style.backgroundColor,
                color: style.color,
                borderTopColor: style.borderTopColor,
                borderRadius: style.borderRadius
              };
            })()`,
            returnByValue: true,
          });
          proof[stateName].hoverIdentity[controlName] = hover.result.value;
          await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1, y: 1 });
        }
      }

      const mismatches = [];
      let maxDelta = compareObject(
        proof.original.parent,
        proof.target.parent,
        `${proof.name}.parent`,
        mismatches,
      );
      maxDelta = Math.max(
        maxDelta,
        compareObject(
          proof.original.adjacent,
          proof.target.adjacent,
          `${proof.name}.adjacent`,
          mismatches,
        ),
      );
      for (const [controlName, original] of Object.entries(proof.original.controls)) {
        maxDelta = Math.max(
          maxDelta,
          compareObject(
            original.layout,
            proof.target.controls[controlName].layout,
            `${proof.name}.${controlName}`,
            mismatches,
          ),
        );
      }
      if (mismatches.length) {
        failed = true;
        console.error(`FAIL ${viewport.name} ${proof.name}`);
        for (const mismatch of mismatches) console.error(`  ${mismatch}`);
      } else {
        console.log(
          `PASS ${viewport.name} ${proof.name} max layout delta ${maxDelta.toFixed(3)}px`,
        );
      }
    }
    reports.push({ viewport, media: media.result.value, proofs });
  }
  console.log(`TT_PARITY_REPORT=${JSON.stringify(reports)}`);
  cdp.close();
} finally {
  if (launched?.child && !launched.child.killed) {
    launched.child.kill('SIGTERM');
    await Promise.race([
      new Promise((resolve) => launched.child.once('exit', resolve)),
      delay(2_000),
    ]);
  }
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      rmSync(profileDirectory, { recursive: true, force: true });
      break;
    } catch (error) {
      if (attempt === 4) throw error;
      await delay(100);
    }
  }
}

if (failed) process.exit(1);
