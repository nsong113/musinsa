import { Page, Locator } from "@playwright/test";

//공통

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goTo(path: string) {
    await this.page.goto(path);
  }

  async goToMain() {
    await this.page.goto("/");
  }
}
