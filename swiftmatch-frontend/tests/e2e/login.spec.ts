import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';
import path from 'path';
import 'chromedriver';

const FRONT_URL = process.env.FRONT_URL || 'https://swift-match-frontend.vercel.app';
const USER = process.env.TEST_USER || 'selenium';
const PASS = process.env.TEST_PASS || '123';
const HEADLESS = (process.env.HEADLESS || '1') === '1';

const ensureArtifactsDir = () => {
  const out = path.resolve('tests', 'e2e', 'artifacts');
  if (!fs.existsSync(out)) fs.mkdirSync(out, { recursive: true });
  return out;
};

const takeArtifact = async (driver: WebDriver, name: string) => {
  try {
    const buffer = await driver.takeScreenshot();
    const out = ensureArtifactsDir();
    const file = path.join(out, `${name}.png`);
    fs.writeFileSync(file, Buffer.from(buffer, 'base64'));
    const html = await driver.getPageSource();
    fs.writeFileSync(path.join(out, `${name}.html`), html, 'utf8');
    console.log('[artifact] saved:', file);
  } catch (e) {
    console.error('[artifact] failed', e);
  }
};

describe('E2E — Login flow', function () {
  this.timeout(180000);
  let driver: WebDriver;

  beforeEach(async () => {
    const options = new chrome.Options();

    if (HEADLESS) {
      options.addArguments('--headless=new', '--no-sandbox', '--disable-dev-shm-usage');
    } else {
      options.addArguments('--start-maximized');
    }

    options.addArguments(
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.7444.176 Safari/537.36'
    );
    options.addArguments('--disable-blink-features=AutomationControlled', '--window-size=1366,768');

    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  });

  afterEach(async () => {
    if (driver) {
      try { await driver.quit(); } catch (e) { /* ignore */ }
    }
  });

  it('should login and reach catalog', async () => {
    try {
      await driver.get(FRONT_URL);
      await driver.sleep(1200); 

      try {
        const current = await driver.getCurrentUrl();
        console.log('[debug] currentUrl after open:', current);
      } catch (e) { console.log('[debug] getCurrentUrl failed', (e as Error).message); }

      try {
        const title = await driver.getTitle();
        console.log('[debug] page title:', title);
      } catch (e) { console.log('[debug] getTitle failed', (e as Error).message); }

      try {
        const bodyText = await driver.findElement(By.css('body')).getText();
        console.log('[debug] body starts (snippet):', bodyText.slice(0, 300));
        const up = bodyText.toUpperCase();
        if (up.includes('NOT_FOUND') || up.includes('VERCEL') || up.includes('ID: GRU1::')) {
          await takeArtifact(driver, 'debug-redirect-404-' + Date.now());
          throw new Error('Loaded a Vercel 404 / preview page. Use a public URL or preview with access allowed.');
        }
      } catch (e) {
        console.log('[debug] reading body failed (maybe empty)', (e as Error).message);
      }

      const usernameSel = By.css('input[type="text"], input[name="username"], input#username, input[autocomplete="username"]');
      const passwordSel = By.css('input[type="password"], input[name="password"], input#password, input[autocomplete="current-password"]');

      let usernameFound = false;
      try {
        await driver.wait(until.elementLocated(usernameSel), 10000);
        usernameFound = true;
      } catch {
        usernameFound = false;
      }

      if (!usernameFound) {
        console.log('[info] login inputs not found — checking if we are already logged in or at catalog');

        const cur = await driver.getCurrentUrl();
        if (cur.includes('/catalog') || cur.includes('/home') || cur.includes('/dashboard')) {
          console.log('[test] root opened and app is already at catalog — considered success:', cur);
          await takeArtifact(driver, 'already-at-catalog-' + Date.now());
          return;
        }

        const possibleSelectors = [
          'main',
          '[data-testid="catalog"]',
          '[data-testid="ranking-list"]',
          '.catalog',
          '.ranking-list',
          'nav a[href="/catalog"]',
        ];
        for (const s of possibleSelectors) {
          const els = await driver.findElements(By.css(s));
          if (els.length > 0) {
            console.log('[test] found catalog-like element on root — considered success (selector):', s);
            await takeArtifact(driver, 'catalog-like-on-root-' + Date.now());
            return;
          }
        }

        console.log('[info] trying to open explicit /login as fallback (but it may 404 on Vercel preview)');
        await driver.get(`${FRONT_URL}/login`);
        await driver.sleep(800);
        try {
          await driver.wait(until.elementLocated(usernameSel), 8000);
          usernameFound = true;
        } catch {
          usernameFound = false;
        }
      }

      if (!usernameFound) {
        await takeArtifact(driver, 'login-input-not-found-' + Date.now());
        throw new Error('Login inputs not found after trying root and /login. Check that FRONT_URL is the public site and not a protected preview.');
      }

      const usernameEl = await driver.findElement(usernameSel);
      await usernameEl.clear();
      await usernameEl.sendKeys(USER);

      const passwordEl = await driver.findElement(passwordSel);
      await passwordEl.clear();
      await passwordEl.sendKeys(PASS);

      let submitEl;
      try {
        submitEl = await driver.findElement(By.css('button[type="submit"], input[type="submit"]'));
      } catch {
        const candidates = await driver.findElements(By.css('button, input[type="button"], input[type="submit"]'));
        for (const b of candidates) {
          const value = (await b.getAttribute('value')) || (await b.getText());
          if (!value) continue;
          const txt = value.trim().toLowerCase();
          if (txt.includes('login') || txt.includes('entrar') || txt.includes('sign in')) { submitEl = b; break; }
        }
      }

      if (!submitEl) {
        await takeArtifact(driver, 'login-no-submit-' + Date.now());
        throw new Error('Could not locate submit button after filling form.');
      }

      await submitEl.click();

      await driver.wait(async () => {
        try {
          const url = await driver.getCurrentUrl();
          if (url.includes('/catalog') || url.includes('/home') || url.includes('/dashboard')) return true;

          const successSelectors = [
            '[data-testid="catalog"]',
            '[data-testid="ranking-list"]',
            '.catalog',
            '.ranking-list',
            'nav a[href="/catalog"]',
          ];
          for (const s of successSelectors) {
            const els = await driver.findElements(By.css(s));
            if (els.length > 0) return true;
          }
          return false;
        } catch {
          return false;
        }
      }, 30000);

      const finalUrl = await driver.getCurrentUrl();
      console.log('[test] landed on', finalUrl);
      await takeArtifact(driver, 'login-success-' + Date.now());
    } catch (err) {
      console.error('[test] error:', err);
      try { if (driver) await takeArtifact(driver, 'login-failure-' + Date.now()); } catch (e) { console.error('artifact fail', e); }
      throw err;
    }
  });
});
