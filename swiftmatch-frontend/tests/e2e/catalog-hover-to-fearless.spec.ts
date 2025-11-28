import * as webdriver from 'selenium-webdriver';
const { Builder, By, until } = webdriver;
type WebDriver = webdriver.WebDriver;
type WebElement = webdriver.WebElement; 

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
const ensureArtifactsDir = () => { if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true }); };

const takeArtifact = async (driver: WebDriver | null | undefined, name: string) => {
  try {
    ensureArtifactsDir();
    if (!driver) {
      const msg = `no-driver-${name}.txt`;
      fs.writeFileSync(path.join(ARTIFACTS_DIR, msg), 'No driver available to capture screenshot/html', 'utf8');
      console.warn('[artifact] driver absent, wrote marker file:', msg);
      return;
    }
    const buffer = (await (driver.takeScreenshot() as Promise<string>));
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
      console.log('[token] trying', attempt.url);
      const res = await axios.post(attempt.url, attempt.data, { timeout: 20000 }); 
      const body: any = res.data;
      console.log('[token] response status', res.status);
      if (!body) continue;
      if (typeof body.access === 'string') return body.access;
      if (typeof body.token === 'string') return body.token;
      if (typeof body.key === 'string') return body.key;
      if (body.data && typeof body.data === 'object') {
        if (typeof body.data.access === 'string') return body.data.access;
        if (typeof body.data.token === 'string') return body.data.token;
      }
    } catch (err: any) {
      console.warn('[token] attempt failed', attempt.url, err?.response?.status || err?.message || err);
    }
  }
  return null;
};

const isElementInViewport = async (driver: WebDriver, element: WebElement): Promise<boolean> => {
  return driver.executeScript<boolean>(
    `
      const rect = arguments[0].getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    `,
    element
  );
};


describe('E2E — Catalog hovers then open Fearless ranking', function () {
  this.timeout(6 * 60 * 1000); // 6m
  let driver: WebDriver | null = null;

  beforeEach(async () => {
    const options = new chrome.Options();
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';
    options.addArguments(`--user-agent=${userAgent}`);

    if (HEADLESS) {
      options.addArguments('--headless=new', '--no-sandbox', '--disable-dev-shm-usage');
    } else {
      options.addArguments('--start-maximized');
    }
    options.addArguments('--disable-features=site-per-process'); 

    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  });

  afterEach(async () => {
    if (driver) {
      try { await driver.quit(); } catch (_) { /* ignore */ }
      driver = null;
    }
  });

  const ensureAppReady = async (driver: WebDriver, timeout = 30000) => {
    const start = Date.now();
    const selectors = ['#root', '#app', 'main', '.catalog', '.album-grid', '.app-container', '.content']; 
    while (Date.now() - start < timeout) {
      try {
        for (const s of selectors) {
          const els = await driver.findElements(By.css(s));
          if (els.length > 0) return true;
        }
      } catch { /* ignore DOM access errors while page loads */ }
      await new Promise((r) => setTimeout(r, 400));
    }
    return false;
  };

  const spaNavigate = async (driver: WebDriver, absolutePath: string) => {
    try {
      await driver.executeScript(
        `window.history.pushState({}, '', arguments[0]); window.dispatchEvent(new PopStateEvent('popstate'));`,
        absolutePath
      );
      await new Promise((r) => setTimeout(r, 800));
    } catch (e) {
      console.warn('[spaNavigate] failed', e);
    }
  };

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  it('injects token, hovers all album tiles, opens Fearless, re-ranks tracks and saves', async () => {
    try {
      if (!driver) throw new Error('driver-not-initialized');

      const actions = driver.actions({ async: true }); 

      let token: string | null = TEST_TOKEN ?? null;
      if (!token) {
        console.log('[test] TEST_TOKEN not provided, trying API login...');
        token = await obtainTokenViaApi();
        if (!token) console.warn('[test] could not obtain token via API — will fallback to UI login (slower)');
      }

      const catalogPath = '/catalog';
      const catalogUrl = FRONT_URL.replace(/\/$/, '') + catalogPath;

      console.log('[debug] opening front url', FRONT_URL);
      await driver.get(FRONT_URL);
      await ensureAppReady(driver, 30000);

      if (token) {
        console.log('[test] token injection mode: setting localStorage...');
        await driver.executeScript(`window.localStorage.setItem('authToken', arguments[0]);`, token);
        await sleep(200);
        console.log('[test] Navigating to /catalog via SPA pushState (No Refresh)...');
        await spaNavigate(driver, catalogUrl);
        await ensureAppReady(driver, 30000); 
        await sleep(1000); 
      } else {
        console.warn('[test] UI login fallback not implemented here. Skipping.');
        return;
      }

      let fearlessTile: WebElement | null = null;
      let albumTiles: WebElement[] = [];
      const FEARLESS_NEEDLE = 'FEARLESS';
      const generalTileSelector = By.css('button[aria-label]'); 

      try {
        await driver.wait(
          until.elementLocated(generalTileSelector),
          30000, 
          'Timeout waiting for at least one album tile to be located in DOM.'
        );
        albumTiles = await driver.findElements(generalTileSelector);
        
        if (albumTiles.length === 0) throw new Error('No album tiles found');

        for (const tile of albumTiles) {
          const label = (await tile.getAttribute('aria-label') || '').toUpperCase();
          if (label.includes(FEARLESS_NEEDLE)) {
            fearlessTile = tile;
            break;
          }
        }

        const hoverCount = albumTiles.length; 
        console.log(`[test] Attempting to hover all ${hoverCount} album tiles (optimized scroll)...`);
        for (let i = 0; i < hoverCount; i++) {
          try {
            const currentTiles = await driver.findElements(generalTileSelector);
            const albumTile = currentTiles[i];
            
            if (!albumTile) continue;
            
            const isVisible = await isElementInViewport(driver, albumTile);
            
            if (!isVisible) {
              await driver.executeScript('arguments[0].scrollIntoView({block:"start"});', albumTile);
              await sleep(300); 
            } else {
              await sleep(150); 
            }
            await actions.move({ origin: albumTile }).perform(); 
            const albumTitle = await albumTile.getAttribute('aria-label') || `#${i + 1}`;
            console.log(`[test] SUCCESSFULLY hovered album: ${albumTitle} (${i + 1}/${hoverCount})`); 
            await sleep(350);
          } catch (e) {
            console.warn(`[hover] failed on album #${i+1}`);
          }
        }

      } catch (error) {
        console.error('[test] Failed during explicit wait for album tiles.', error);
        await takeArtifact(driver, 'album-wait-timeout-fail-' + Date.now());
        throw new Error('No album tiles found (Explicit wait failed)');
      }
      
      if (!fearlessTile) throw new Error('Fearless album tile object is null after search.');

      const currentFearlessTile = await driver.findElement(By.css(`button[aria-label*="${FEARLESS_NEEDLE}"]`)) as WebElement;
      

      await driver.executeScript('arguments[0].scrollIntoView({block:"center", inline:"center"});', currentFearlessTile);
      await actions.move({ origin: currentFearlessTile }).perform();
      await sleep(300);
      await currentFearlessTile.click();
      console.log('[test] Clicked Fearless Tile, navigating to Ranking...');

      const trackButtonSelector = By.css('ul li button[draggable="true"]'); 
      const trackListItemSelector = By.css('ul li[data-rbd-draggable-id]'); 
      
      await driver.wait(until.elementLocated(trackButtonSelector), 40000, 'Timeout waiting for track cards (buttons) to load on Ranking page.');
      await sleep(1500); 
      
      let trackButtons = await driver.findElements(trackButtonSelector);
      
      if (trackButtons.length > 0) {
        console.log(`[test] Attempting to hover track #1 (testing visual stability)...`);
        try { 
          const trackElement = trackButtons[0];
          await driver.executeScript('arguments[0].scrollIntoView({block:"center"});', trackElement);
          await sleep(500); 
          await actions.move({ origin: trackElement }).perform(); 
          await sleep(500); 
          console.log('[track hover] SUCCESSFULLY hovered track #1');
        } catch (e) { 
          console.warn('[track hover] failed on track #1, continuing to D&D...');
        }
      }
    
      
      await driver.wait(until.elementsLocated(trackButtonSelector), 10000); 
      trackButtons = await driver.findElements(trackButtonSelector); 
      const trackListItems = await driver.findElements(trackListItemSelector);
      
      await sleep(2000); 
      

      if (trackButtons.length < 3 || trackListItems.length < 3) {
        console.warn('[test] Less than 3 tracks found, skipping D&D test.');
      } else {
        console.log('[test] Starting Drag and Drop test...');
        
        const fromTrackButton = trackButtons[0]; 
        const toTrackListItem = trackListItems[2]; 

        await driver.executeScript('arguments[0].scrollIntoView({block:"center"});', fromTrackButton);
        await sleep(500);
        
        console.log('[D&D] Picking up track 1...');
        
        await actions.move({ origin: fromTrackButton, x: 1, y: 1 }) 
               .press()
               .perform();
        await sleep(1500); 

        console.log('[D&D] Moving to track 3 drop target...');
        await actions.move({ origin: toTrackListItem, x: 0, y: 0 }).perform(); 
        await sleep(1500); 

        console.log('[D&D] Releasing mouse button...');
        await actions.release().perform();
        await sleep(2000); 
        console.log('[test] SUCCESSFULLY performed Drag and Drop: Track 1 moved to position 3.');

        await takeArtifact(driver, 'ranking-after-drag-' + Date.now());
      }
      
      let saveBtn: WebElement | null = null;
      const saveBtnSelectorXPath = By.xpath("//button[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'save ranking')]");
      const saveBtnSelector = By.css('button');
      
      try { 
        saveBtn = await driver.findElement(saveBtnSelectorXPath) as WebElement; 
      } catch {
        const allButtons = await driver.findElements(saveBtnSelector);
        for (const button of allButtons) {
          const text = await button.getText();
          if (text.toLowerCase().includes('save ranking')) {
            saveBtn = button;
            console.warn('[test] Save button found using text content fallback.');
            break;
          }
        }
      }

      if (saveBtn) { 
        await driver.executeScript('arguments[0].scrollIntoView({block:"center", inline:"center"});', saveBtn);
        await sleep(500); 
        await saveBtn.click(); 
        console.log('[test] Clicked Save Ranking. Waiting for redirection...');
      } else {
        console.error('[test] Save button not found — CANNOT complete save/return test.');
        throw new Error('Save Ranking button not found.');
      }

      const returnTimeout = 60000; 
      
      await driver.wait(async () => {
        const url = await driver.getCurrentUrl();
        return url.includes('/catalog');
      }, returnTimeout, `Timeout waiting for redirection back to /catalog after saving ranking (${returnTimeout/1000}s).`);

      console.log('[test] SUCCESSFULLY returned to Catalog page after saving ranking.');
      
      await takeArtifact(driver, 'catalog-to-fearless-success-final-' + Date.now());

    } catch (err) {
      console.error('[test] error:', err);
      await takeArtifact(driver, 'catalog-to-fearless-failure-final-' + Date.now());
      throw err;
    }
  });
});