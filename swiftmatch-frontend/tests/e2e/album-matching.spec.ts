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

const clickComebackBtn = async (driver: WebDriver, timeoutMs = 30000, intervalMs = 500) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const elements = await driver.findElements(By.css('button'));
    for (const el of elements) {
      let label = '';
      try {
        label = (await el.getAttribute('aria-label')) || '';
      } catch (_) { label = ''; }
      let text = '';
      try {
        text = (await el.getText()) || '';
      } catch (_) { text = ''; }

      const normalized = (label || text).trim();

      const isExactText = text.trim() === 'Comeback!';
      const isAriaMatch = !!label && label.toLowerCase().includes('comeback');

      if (isExactText || isAriaMatch) {
        try {
          const displayed = await el.isDisplayed();
          const enabled = await el.isEnabled();
          if (displayed && enabled) {
            await driver.executeScript('arguments[0].scrollIntoView({ behavior: "auto", block: "center" });', el);
            await sleep(200); 
            try {
              await driver.executeScript('arguments[0].click();', el);
            } catch (e) {
              try {
                await el.click();
              } catch (_) { /* ignore */ }
            }
            await sleep(600);
            return el;
          }
        } catch (e) {
        }
      }
    }
    await sleep(intervalMs);
  }
  throw new Error('Could not find or click the Comeback button within timeout');
};

describe('E2E — Open Tyler profile, album matching and comeback', function () {
  this.timeout(5 * 60 * 1000);
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

  it('searches for Tyler, opens albums, waits 20s, scrolls and clicks comeback', async () => {
    if (!driver) throw new Error('driver-not-initialized');

    let token: string | null = TEST_TOKEN ?? await obtainTokenViaApi();
    await driver.get(FRONT_URL);
    if (token) {
      await driver.executeScript(`window.localStorage.setItem('authToken', arguments[0]);`, token);
      await sleep(200);
    }

    await spaNavigate(driver, '/catalog');
    await sleep(1000);

    const searchSelector = By.css('input[placeholder*="Search"]');
    await driver.wait(until.elementLocated(searchSelector), 10000);
    const searchInput = await driver.findElement(searchSelector);
    await searchInput.sendKeys('tylerlovesjosh');
    await sleep(500);

    const userResultSelector = By.css('div[style*="position: absolute"] > div');
    await driver.wait(until.elementsLocated(userResultSelector), 10000);
    const userResults = await driver.findElements(userResultSelector);

    let clicked = false;
    for (const r of userResults) {
      const text = await r.getText();
      if (text.trim().toLowerCase() === 'tylerlovesjosh') {
        await r.click();
        clicked = true;
        break;
      }
    }
    if (!clicked) throw new Error('Could not find user "tylerlovesjosh" in search results');
    await sleep(1500);

    const albumMatchingSelector = By.css('button[aria-label*="Rank de ALBUM"]');
    const albumMatchingBtn = await driver.wait(until.elementLocated(albumMatchingSelector), 15000);
    await albumMatchingBtn.click();

    console.log('[test] Waiting 20 seconds for matching to fully load...');
    await sleep(20000);

    await driver.executeScript('window.scrollTo({ top: document.body.scrollHeight, behavior: "auto" });');
    await sleep(1000); 

    await clickComebackBtn(driver, 30000, 500);

    await takeArtifact(driver, 'tyler-album-matching-' + Date.now());
    console.log('[test] SUCCESSFULLY clicked comeback after wait and scroll');
  });
});
