import * as webdriver from 'selenium-webdriver';
const { Builder, By, until } = webdriver;
type WebDriver = webdriver.WebDriver;

import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import 'chromedriver';

const FRONT_URL = process.env.FRONT_URL || 'https://swift-match-frontend.vercel.app';
const API_URL = process.env.API_URL || 'https://swift-match-backend.onrender.com';
const USER = process.env.TEST_USER || 'selenium';
const PASS = process.env.TEST_PASS || '123';
const TEST_TOKEN = process.env.TEST_TOKEN;
const HEADLESS = (process.env.HEADLESS ?? '1') === '1';

const ARTIFACTS_DIR = path.resolve('tests', 'e2e', 'artifacts');
const ensureArtifactsDir = () => { 
  if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true }); 
};

const takeArtifact = async (driver: WebDriver | null | undefined, name: string) => {
  try {
    ensureArtifactsDir();
    if (!driver) {
      const msg = `no-driver-${name}.txt`;
      fs.writeFileSync(path.join(ARTIFACTS_DIR, msg), 'No driver available to capture screenshot/html', 'utf8');
      console.warn('[artifact] driver absent, wrote marker file:', msg);
      return;
    }
    const buffer = await driver.takeScreenshot();
    const file = path.join(ARTIFACTS_DIR, `${name}.png`);
    fs.writeFileSync(file, Buffer.from(buffer, 'base64'));
    const html = await driver.getPageSource();
    fs.writeFileSync(path.join(ARTIFACTS_DIR, `${name}.html`), html, 'utf8');
    console.log('[artifact] saved:', file);
  } catch (e) {
    console.error('[artifact] failed', e);
  }
};

const obtainTokenViaApi = async (): Promise<string | null> => {
  const attempts = [
    { url: `${API_URL}/api/token/`, data: { username: USER, password: PASS } },
    { url: `${API_URL}/api/auth/token/`, data: { username: USER, password: PASS } },
    { url: `${API_URL}/api/login/`, data: { username: USER, password: PASS } },
    { url: `${API_URL}/api/auth/login/`, data: { username: USER, password: PASS } },
    { url: `${API_URL}/api/auth/login/`, data: { email: USER, password: PASS } },
  ];

  for (const attempt of attempts) {
    try {
      const res = await axios.post(attempt.url, attempt.data, { timeout: 20000 });
      const body: any = res.data;
      if (!body) continue;
      if (typeof body.access === 'string') return body.access;
      if (typeof body.token === 'string') return body.token;
      if (typeof body.key === 'string') return body.key;
      if (body.data && typeof body.data === 'object') {
        if (typeof body.data.access === 'string') return body.data.access;
        if (typeof body.data.token === 'string') return body.data.token;
      }
    } catch { /* ignore errors */ }
  }
  return null;
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const spaNavigate = async (driver: WebDriver, absolutePath: string) => {
  await driver.executeScript(
    `window.history.pushState({}, '', arguments[0]); window.dispatchEvent(new PopStateEvent('popstate'));`,
    absolutePath
  );
  await sleep(800);
};

const clickSidebarAnalytics = async (driver: WebDriver) => {
  let sidebar: webdriver.WebElement | null = null;
  try {
    sidebar = await driver.findElement(By.css('div[style*="flex: 0 0 150px"], div[style*="flex:0 0 150px"]'));
  } catch (_) {
    const allDivs = await driver.findElements(By.css('div'));
    for (const d of allDivs) {
      try {
        const buttons = await d.findElements(By.css('button'));
        if (buttons.length >= 3) { sidebar = d; break; }
      } catch { /* ignore */ }
    }
  }

  if (!sidebar) throw new Error('Sidebar container not found');
  const buttons = await sidebar.findElements(By.css('button'));
  if (buttons.length < 3) throw new Error('Sidebar does not contain expected buttons (need at least 3)');
  await buttons[2].click();
  await sleep(800);
};

const findCountryElement = async (driver: WebDriver, code: string) => {
  const els = await driver.findElements(By.xpath(`//div[normalize-space(text())='${code}']`));
  for (const el of els) if (await el.isDisplayed()) return el;
  const titled = await driver.findElements(By.xpath(`//div[contains(@title, '${code}')]`));
  for (const el of titled) if (await el.isDisplayed()) return el;
  return null;
};

const dispatchWheel = async (driver: WebDriver, element: webdriver.WebElement, deltaX: number, deltaY: number, steps = 6) => {
  const stepX = Math.round(deltaX / steps);
  const stepY = Math.round(deltaY / steps);
  for (let i = 0; i < steps; i++) {
    await driver.executeScript(
      `const el = arguments[0];
       const ev = new WheelEvent('wheel', {deltaX: arguments[1], deltaY: arguments[2], bubbles: true, cancelable: true});
       el.dispatchEvent(ev);`,
      element,
      stepX,
      stepY
    );
    await sleep(120);
  }
};

const performDrag = async (driver: WebDriver, element: webdriver.WebElement, dx: number, dy: number) => {
  const rect = await element.getRect();
  const startX = Math.floor(rect.x + rect.width / 2);
  const startY = Math.floor(rect.y + rect.height / 2);
  await driver.actions()
    .move({ origin: element, x: 0, y: 0 })
    .press()
    .move({ origin: element, x: dx, y: dy })
    .release()
    .perform();
  await sleep(250);
};

const panUntilAndClickCountry = async (driver: WebDriver, countryCode = 'AU', timeoutMs = 90000) => {
  const start = Date.now();

  let mainArea: webdriver.WebElement | null = null;
  try {
    mainArea = await driver.findElement(By.css('div[style*="cursor: grab"], div[style*="cursor:grab"]'));
  } catch (_) {
    try { mainArea = await driver.findElement(By.css('div[role="main"]')); } catch (_) { mainArea = await driver.findElement(By.css('body')); }
  }

  const moves = [
    { dx: -700, dy: 0 },
    { dx: -700, dy: -420 },
    { dx: -700, dy: 420 },
    { dx: 700, dy: 0 },
    { dx: 700, dy: -420 },
    { dx: 700, dy: 420 },
    { dx: 0, dy: -900 },
    { dx: 0, dy: 900 },
    { dx: -420, dy: -900 },
    { dx: 420, dy: 900 }
  ];

  let found = await findCountryElement(driver, countryCode);
  if (found) {
    await driver.executeScript('arguments[0].scrollIntoView({behavior:"auto", block:"center"})', found);
    await sleep(150);
    await driver.executeScript('arguments[0].click();', found);
    return found;
  }

  while (Date.now() - start < timeoutMs) {
    for (const mv of moves) {
      try {
        try {
          await dispatchWheel(driver, mainArea!, mv.dx, mv.dy, 6);
        } catch (_) {
        }

        await sleep(350);
        found = await findCountryElement(driver, countryCode);
        if (found) {
          await driver.executeScript('arguments[0].scrollIntoView({behavior:"auto", block:"center"})', found);
          await sleep(150);
          try { await driver.executeScript('arguments[0].click();', found); } catch { try { await found.click(); } catch (_) { } }
          return found;
        }

        try {
          await performDrag(driver, mainArea!, Math.round(mv.dx / 2), Math.round(mv.dy / 2));
        } catch (_) { /* ignore drag errors */ }

        await sleep(350);
        found = await findCountryElement(driver, countryCode);
        if (found) {
          await driver.executeScript('arguments[0].scrollIntoView({behavior:"auto", block:"center"})', found);
          await sleep(150);
          try { await driver.executeScript('arguments[0].click();', found); } catch { try { await found.click(); } catch (_) { } }
          return found;
        }
      } catch (err) {
      }
    }
    await sleep(500);
  }

  throw new Error(`Could not find and click country "${countryCode}" within ${timeoutMs}ms`);
};


describe('E2E — Analytics: open sidebar analytics and click AU (no search)', function () {
  this.timeout(6 * 60 * 1000);
  let driver: WebDriver | null = null;

  beforeEach(async () => {
    const options = new chrome.Options();
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';
    options.addArguments(`--user-agent=${userAgent}`);
    if (HEADLESS) options.addArguments('--headless=new', '--no-sandbox', '--disable-dev-shm-usage');
    else options.addArguments('--start-maximized');
    options.addArguments('--disable-features=site-per-process');
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  });

  afterEach(async () => {
    if (driver) {
      try { await driver.quit(); } catch (_) { }
      driver = null;
    }
  });

  it('logs in, opens analytics via sidebar, pans until AU and clicks it', async () => {
    if (!driver) throw new Error('driver-not-initialized');

    let token: string | null = TEST_TOKEN ?? await obtainTokenViaApi();
    await driver.get(FRONT_URL);
    if (token) {
      await driver.executeScript(`window.localStorage.setItem('authToken', arguments[0]);`, token);
      await sleep(200);
    }

    await spaNavigate(driver, '/catalog');
    await sleep(1000);

    await clickSidebarAnalytics(driver);

    await driver.wait(async () => {
      const elems = await driver.findElements(By.xpath("//div[string-length(normalize-space(text()))=2]"));
      return elems.length > 0;
    }, 15000).catch(() => { /* ignora se timeout, seguimos pra tentar pan */ });

    await sleep(1000);

    await panUntilAndClickCountry(driver, 'AU', 90000);

    await takeArtifact(driver, 'analytics-au-' + Date.now());
    console.log('[test] SUCCESS: clicked AU on Analytics page');
  });
});
