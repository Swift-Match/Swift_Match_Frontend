import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

export async function buildDriver(headless = true) {
  const options = new chrome.Options();
  if (headless) {
    options.addArguments('--headless=new', '--no-sandbox', '--disable-dev-shm-usage');
  } else {
    options.windowSize({ width: 1400, height: 900 });
  }
  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();
  return driver;
}
