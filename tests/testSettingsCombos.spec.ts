import { test, expect, type Page, type Locator, type Browser } from '@playwright/test';
import {RUN_DEV , getDBConfig, getLoginUrl , getPassword, getUsername } from '../utils/constants.js';
import {AdminApprover } from '../utils/approve.js';
// @ts-ignore
import { getComparator } from 'playwright-core/lib/utils';

// todo - add test to cancel out of edit

// test.beforeEach('logging in to Avert', async ({ page }) => {
//   await logInToAvert(page);
// });


class RadioHelper {
    radios : Locator[] = [];
    orgIndex : number = -1;
    testInedex : number = -1;
    radLocator : Locator | null = null;

    constructor() {}
    
    async populate(userPage : Page)  {
      const radioElement = '.MuiRadioGroup-root';

      const radLocator = await userPage.locator(radioElement);
      await expect(radLocator).toBeVisible();

      //console.log('radioLeader count=' + await radLocator.count() + ', text=' + await radLocator.textContent() );
      //const radioSel  = await radLocator.getAttribute('value');
      //console.log('selected value=' + radioSel);
      const radioInputs = await radLocator.locator('input').all();
      for(const radioInput of radioInputs) {
        this.radios.push(radioInput);
        const val = await radioInput.getAttribute('value');
        const isChecked = await radioInput.isChecked();
        console.log('radio input value=' + val + ', isChecked=' + isChecked);
      }
      if(radioInputs.length == 2 && this.radios[0] != null && this.radios[1] != null) {
        if(await this.radios[0].isChecked()) {
          console.log('radio 0 is org, 1 is test');
          this.orgIndex = 0;
          this.testInedex = 1;
        }
        else {
          console.log('radio 1 is org, 0 is test');
          this.orgIndex = 1;
          this.testInedex = 0;
        }
      }
      else console.log('unexpected radio input count=' + radioInputs.length);
      //console.log('radio input count=' + radioInputs.length);
    }
    async getTestRadio() : Promise<Locator> {
      if(this.testInedex == -1) console.log('test radio index is -1');
      if(this.radios[this.testInedex] == null) console.log('test radio is null');
      return this.radios[this.testInedex]!;
      
    }
    async getOrgRadio() : Promise<Locator> {
      if(this.orgIndex == -1) console.log('org radio index is -1');
      if(this.radios[this.orgIndex] == null) console.log('org radio is null');
      return this.radios[this.orgIndex]!;
    }

  }

class ComboHelper {
    options : string[] = [];
    selected : string | null | undefined = null;
    orgIndex : number = -1;
    testInedex : number = -1;
    ddLocator : Locator | null = null;
    
    constructor() {}
    
    async getComboDetails(myCombo : Locator, userPage : Page)  {
      this.selected = await myCombo.textContent();
      //console.log('getCOmboDeets selected=' + this.selected);
      await myCombo.click();
      this.ddLocator = await userPage.locator('.cb-select-field-list');
      const childLocs = await this.ddLocator.locator('li').all();
      for( const child of childLocs) {
        this.options.push(await child.textContent() ?? '');
      }
      //console.log(' selected len=' + this.selected?.length + ', sel=' + this.selected +'>>');
      //console.log(this.selected?.charCodeAt(0));
      const zeroLenSpaceReturnedWhenNoSelection = 8203;
      if(this.selected?.charCodeAt(0) == zeroLenSpaceReturnedWhenNoSelection) {
        this.selected = this.options[this.options.length - 1]; 
        this.orgIndex = await this.getOptionIndex(this.selected ?? '');
        this.testInedex = this.orgIndex;
      }
      this.testInedex = this.orgIndex = await this.getOptionIndex(this.selected ?? '');
      await userPage.keyboard.press('Escape');
    }
    async getOptionIndex(optionText : string) : Promise<number> {
      return this.options.findIndex(opt => opt == optionText);
    }
    async incrementOptionIndex() : Promise<number>   {
      if(this.selected == null) return -1;
      const selIndex = await this.getOptionIndex(this.selected);
      if(selIndex == -1) return -1;
      this.testInedex = (this.testInedex + 1 >= this.options.length ? 0 : this.testInedex + 1);
      return this.testInedex;
    }
    
    async getNextOption() : Promise<string | null> {
      const nextIndex = await this.incrementOptionIndex();
      if(nextIndex == -1) return null;
      return this.options[nextIndex] ?? null;
    }
    getOptionsList() : string[] {
      this.options.forEach(opt => console.log('option=' + opt));
      return this.options;
    }
}

test.beforeEach('logging in to Avert', async ({ page }) => {
  console.log(`Running ${test.info().title}`);
  await AdminApprover.Initialize(await page.context().browser());
  //const targetURL = getLoginUrl();
  //await page.goto(getLoginUrl());

  //await logInToAvert(page);
  // await page.goto('https://my.start.url/');
});
test.afterEach(async () => {
  await AdminApprover.ClosePage();
});


console.log('test-1.spec.ts loaded');
const comboTestTags = ['Coordinate System' , 'Scroll Bars', 'Ground Distance/Speed' ] ;
//const comboTestTags = ['Coordinate System' , 'Open In', 'Default App', 'Scroll Bars', 'User Locale', 'Ground Distance/Speed' ] ;
//const comboTestTags = [ 'Default App', 'Scroll Bars', 'User Locale', 'Ground Distance/Speed' ] ;
comboTestTags.forEach( (comboTag) => {
  console.log('creating test for combo tag ' + comboTag.toString());
  test('testSelect' + comboTag.toString(), async ({ browser }) => {
    await TestComboSelections(await OpenPage(browser),   comboTag.toString() );
  });
});

test('testSelectTimeDisplay', async ({ browser }) => {
//  const radioElement = '.MuiRadioGroup-root';
  const myPage = await OpenPage(browser);
  await EnsureInSettingsApp(myPage);

  const myHelper = new RadioHelper();
  await myHelper.populate(myPage);
  const testRadio = await myHelper.getTestRadio();
  const orgRadio = await myHelper.getOrgRadio();
  
  console.log('testSelectTimeDisplay, clicking test radio' + await testRadio.getAttribute('value'));
  await testRadio.click();
  await executeSaveActions(myPage);
  console.log('about to reload, url=' + myPage.url());
  await myPage.reload({ waitUntil: 'domcontentloaded' }); // had issues with Save not appearing, hence this ugly
  //await myPage.goto(myPage.url(), { waitUntil: 'domcontentloaded' }); // had issues with Save not appearing, hence this ugly
  //await myPage.reload({ waitUntil: 'domcontentloaded' }); // had issues with Save not appearing, hence this ugly
  await myPage.waitForTimeout(1000);
  await expect(testRadio).toBeChecked();
  console.log('testSelectTimeDisplay, clicking org radio' + await orgRadio.getAttribute('value'));
  await orgRadio.click();
  //await myPage.waitForTimeout(1000);
  await executeSaveActions(myPage);
  await myPage.reload({ waitUntil: 'domcontentloaded' }); // had issues with Save not appearing, hence this ugly
  await myPage.waitForTimeout(1000);
  await expect(orgRadio).toBeChecked();
   //await TestComboSelections(await OpenPage(browser),  'Open In' );
 });

 async function OpenPage(browser : Browser) : Promise<Page> {
  const userContext = await browser.newContext({ storageState: 'playwright/.auth/user.json' });
  const userPage = await userContext.newPage();
  await userPage.goto(getLoginUrl());
  return userPage;
 }

async function TestComboSelections(modPage : Page, comboName : string) {
  await EnsureInSettingsApp(modPage);

  const testCombo = await modPage.getByRole('combobox', { name: comboName });
  const myHelper = new ComboHelper();
  await myHelper.getComboDetails(testCombo, modPage);

  let nextOption : string | null = '';
  while(nextOption != myHelper.selected && nextOption != null) {
    await modPage.reload({ waitUntil: 'domcontentloaded' }); // had issues with Save not appearing, hence this ugly
    //await modPage.waitForTimeout(1000);
    nextOption = await myHelper.getNextOption();
    await testCombo.click();
    const PageOption = await  modPage.getByText(nextOption ?? '').all();
    if(myHelper.ddLocator != null) 
      await myHelper.ddLocator.getByText(nextOption ?? '').click();
    else
       console.log('ddLocator is null');
    
    await executeSaveActions(modPage);
    await modPage.waitForTimeout(1000);
    await modPage.reload({ waitUntil: 'domcontentloaded' }); // had issues with Save not appearing, hence this ugly 
    await modPage.waitForTimeout(1000);
    console.log('awaiting text=' + nextOption + ', testCombo text=' + await testCombo.textContent());
    await testCombo.textContent().then( text => console.log('combo text after reload=' + text));
    await expect(testCombo).toContainText(nextOption ?? '');
  }
  modPage.close();
};

async function executeSaveActions(page : Page) : Promise<void> {
  //await expect(page.getByRole('button', { name: 'SAVE CHANGES' })).toBeVisible();
  if(await (page.getByRole('button', { name: 'SAVE CHANGES' }).count()) > 0) {
    await page.getByRole('button', { name: 'SAVE CHANGES' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    return;
  }
  else if(await (page.getByRole('button', { name: 'REQUEST APPROVAL' }).count()) > 0) {
    await page.getByRole('button', { name: 'REQUEST APPROVAL' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    await page.getByRole('button', { name: 'Done' }).click();
    await AdminApprover.AdminApproveRequest();
    await page.waitForTimeout(1000);
    
    // if(adminPageGlobal != null) {
    //   await TestRequestApprove(adminPageGlobal, 'coarse approval' );
    // }
  }
  else 
    console.log('no save or request button found'); 
};

async function EnsureInSettingsApp(thePage : Page) {
  //await page.reload({ waitUntil: 'networkidle' });
  //await page.waitForURL(/settings-app/, { timeout: 100 });
  //await thePage.waitForTimeout(1000);
  let exRet = await expect(thePage).not.toHaveURL(/\/login$/, { timeout: 10000 });
  const myUrl = thePage.url();
  //console.log('current myUrl=' + myUrl + ', lastURL=' + lastURL);
  //const currentUrl = await page.evaluate(() => window.location.href);
  //return;
  if(thePage.url().indexOf('settings-app') == -1) {
    await thePage.getByRole('button', { name: 'Apps Menu' }).click();
    await thePage.getByRole('link', { name: 'Settings' }).click();
    await expect(thePage.getByRole('paragraph').filter({ hasText: 'My Account Settings' })).toBeVisible();
    //await expect(thePage.getByRole('listitem').filter({ hasText: 'UNITS OF MEASURE' })).toBeVisible();
  }
};
