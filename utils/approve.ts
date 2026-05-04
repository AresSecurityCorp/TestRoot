import { expect, type Page, Browser, BrowserContext } from '@playwright/test';
import {  getLoginUrl } from '../utils/constants.js';

export class AdminApprover {
  public static myPage : Page | null = null;
  public static myContext : BrowserContext;
  public static myBrowser : Browser | null = null;

  private constructor() { /* noop */ }

  public static async Initialize(browser : Browser | null): Promise<void> { this.myBrowser = browser; }
  public static async getBrowser() : Promise<Browser> {
    if(this.myBrowser == null) { throw new Error('AdminApprover not initialized with browser'); }
    return this.myBrowser;
  }

  public static async CreatePage(): Promise<void> {
    const useBrowser = await this.getBrowser();
    if(useBrowser != null) {
      this.myContext = await useBrowser.newContext({ storageState: 'playwright/.auth/admin.json' });
      this.myPage = await this.myContext.newPage();
      const targetURL = getLoginUrl();
      await this.myPage.goto(targetURL);
    }
  }
  public static async ClosePage(): Promise<void> {
    //console.log('AdminApprover.ClosePage called');
    if(this.myContext != null){
        //console.log('AdminApprover.ClosePage closing context');
        await this.myContext.close();
        this.myPage = null;
    }
  } 

  public static async AdminApproveRequest() {
    if(this.myPage == null) { await this.CreatePage(); }
    if(this.myPage != null) {
      await this.EnsureInSettingsApp(this.myPage);
      await this.myPage.reload({ waitUntil: 'domcontentloaded' });

      await this.myPage.getByRole('link', { name: 'Change Request Queue' }).click();
      await this.myPage.getByRole('link', { name: 'Review Changes' }).click();
      await this.myPage.getByRole('button', { name: 'Approve' }).first().click();
      await this.myPage.getByRole('button', { name: 'Yes, Approve' }).click();
      await this.myPage.reload({ waitUntil: 'domcontentloaded' });
    }
  }

    static async EnsureInSettingsApp(page : Page) {
    //await page.reload({ waitUntil: 'networkidle' });
    //await page.waitForURL(/settings-app/, { timeout: 100 });
    if(!await page.isClosed()) { 
        await page.waitForTimeout(1000);
        if((await page.url()).indexOf('settings-app') == -1) {
            await page.getByRole('button', { name: 'Apps Menu' }).click();
            await page.getByRole('link', { name: 'Settings' }).click();
            await expect(page.getByRole('paragraph').filter({ hasText: 'My Account Settings' })).toBeVisible();
        }
    }
    else console.log('EnsureInsettingsApp called but page is closed');
    };

}

