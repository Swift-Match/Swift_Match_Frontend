import fs from 'fs';
import path from 'path';
import { WebDriver } from 'selenium-webdriver';

export async function saveScreenshot(driver: WebDriver, name = 'failed') {
  try {
    const data = await driver.takeScreenshot();
    const dir = path.resolve(process.cwd(), 'tests/e2e/screenshots');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filename = path.join(dir, `${Date.now()}-${name}.png`);
    fs.writeFileSync(filename, data, 'base64');
    console.log('[e2e] screenshot saved:', filename);
  } catch (err) {
    console.error('[e2e] screenshot failed', err);
  }
}
