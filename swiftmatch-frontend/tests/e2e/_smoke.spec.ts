import { Builder } from "selenium-webdriver";
import "chromedriver";

describe("smoke", function () {
  this.timeout(60000);
  it("open front and print url", async () => {
    console.log("[smoke] FRONT_URL:", process.env.FRONT_URL);
    const driver = await new Builder().forBrowser("chrome").build();
    try {
      await driver.get(process.env.FRONT_URL || "https://swift-match-frontend.vercel.app");
      console.log("[smoke] currentUrl:", await driver.getCurrentUrl());
    } finally {
      await driver.quit();
      console.log("[smoke] driver.quit done");
    }
  });
});
