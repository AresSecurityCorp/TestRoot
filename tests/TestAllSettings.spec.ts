//import { test, expect, type Page, type Locator } from '@playwright/test';
import { test, expect, type Page, type Locator, Browser, BrowserContext } from '@playwright/test';
// @ts-ignore
import { getComparator } from 'playwright-core/lib/utils';
import fs from 'fs/promises';

import { RUN_DEV , getDBConfig, getLoginUrl , getAdminPassword, getUsername } from '../utils/constants.js';
import {AdminApprover } from '../utils/approve.js';



class RadioHelper {
    radios : Locator[] = [];
    orgIndex : number = -1;
    testInedex : number = -1;
    radLocator : Locator | null = null;

    constructor() {}
    
    async populate(userPage : Page)  {
      const radioElement = '.MuiRadioGroup-root';

      const radLocator = await userPage.locator(radioElement);
      //await expect(radLocator).toBeVisible();

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


//test.use({ storageState: 'playwright/.auth.json' });
test.beforeEach('logging in to Avert', async ({ page }) => {
  console.log(`Running ${test.info().title}`);
  await AdminApprover.Initialize(await page.context().browser());
  await logInToAvert(page);
});
test.afterEach(async () => {
  await AdminApprover.ClosePage();
});

console.log('TestSettings.spec.ts loaded');
CreateNotificationTests();
CreateComboTests();

function CreateNotificationTests() {
  const notificationTestTags = [ /^Access Management/, /^Advanced Reporting/ ] ;
  //const maxNotifications = 30; // set higher than max of 25 to allow future expansion
  const maxNotifications = 2; // set small to speed things up
  for( let notificationIdx = 0; notificationIdx < maxNotifications; notificationIdx++) {
    console.log('creating test for notification  ' + notificationIdx.toString());
    test('TestSettingsAllowNotification_' + notificationIdx.toString(), async ({ page }) => {
      await TestAllowNotificationIdx(page, notificationIdx);
    });
  }
}

function CreateComboTests() {
  const comboTestTags = ['Coordinate System' , 'Scroll Bars', 'Ground Distance/Speed' ] ;
  //const comboTestTags = ['Coordinate System' , 'Open In', 'Default App', 'Scroll Bars', 'User Locale', 'Ground Distance/Speed' ] ;
  //const comboTestTags = [ 'Default App', 'Scroll Bars', 'User Locale', 'Ground Distance/Speed' ] ;
  comboTestTags.forEach( (comboTag) => {
    console.log('creating test for combo tag ' + comboTag.toString());
    // test('testSelect' + comboTag.toString(), async ({ browser }) => {
    //   await TestComboSelections(await OpenPage(browser),   comboTag.toString() );
    // });
    test('testSettingsSelect' + comboTag.toString(), async ({ page }) => {
      await TestComboSelections(page,   comboTag.toString() );
    });
  });
}

test('TestSettingsModifyCellPhone', async ({ page }) => {
  await TestModifyPhone(page, 'CELL PHONE' );
});

test('TestSettingsModifyOfficePhone', async ({ page }) => {
  await TestModifyPhone(page, 'OFFICE PHONE' );
});

test('testSettingsTimeDisplay', async ({ page }) => {
  await TestTimeDisplay(page);
});

test('TestSettingsNotificationType', async ({ page }) => {
  await TestNotificationType(page);
});


// very flakey test.  Sometimes the ss icon file comes out slighly different, then it always sets to file1
// somewhat regularly the pic may not be fulley loaded.  Also occasionally shows a focus box of 
// sorts in the afterSS.  Test checks the user photo, picks a different one, then makes sure they don't match.
//  Test doesn't need different photo to save each time but they're nice so tester can see a change
// expects userPhoto1SS and userPhoto2SS to be in the project folder, they should be copies of 
// userPhotoBefore or userPhotAfter 

test('testUploadUserPhoto', async ({ page }) => {
  return;
  EnsureInSettingsApp(page);
  // if(page.url().indexOf('settings-app') != -1) {
  //   await page.getByRole('button', { name: 'Apps Menu' }).click();
  //   await page.getByRole('link', { name: 'Settings' }).click();
  //   await expect(page.getByRole('listitem').filter({ hasText: 'UNITS OF MEASURE' })).toBeVisible();
  // }
  const comparator = getComparator('image/png');
  const theZone = await page.locator('.dropzone-container');
  const theInput = await theZone.locator('input[type="file"]');
  const imgUser = await page.getByRole('listitem').filter({ hasText: 'PHOTO' }).getByRole('img');
    let beforeImage = null;
if(await imgUser.count()  >0 ) {
  console.log('no user photo found, using default for comparison');
  await expect(imgUser).toBeVisible();
  await page.waitForTimeout(1000);
  beforeImage = await imgUser.screenshot({ path: 'userPhotoBefore.png' });
 
} 
 const buffer = await fs.readFile('userPhoto1SS.png');
 let newUserPhoto = 'userPhoto1SS.png';
 if(beforeImage != null) 
    newUserPhoto = (comparator(buffer, beforeImage) ? 'userPhoto1SS.png' : 'userPhoto2SS.png');
  theInput.setInputFiles(newUserPhoto);
  
  await page.waitForTimeout(100);
  await page.getByRole('button', { name: 'SAVE CHANGES' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();

  await expect(imgUser).toBeVisible();
  await imgUser.focus();

  const afterImage = await imgUser.screenshot({ path: 'userPhotoAfter.png' });
  expect(comparator(beforeImage, afterImage)).not.toBeNull();
  //expect(afterImage).toMatchSnapshot('userPhoto1SS.png');
  //expect(comparator('userPhoto1SS.png', afterImage)).toBeNull();
  
  console.log('end of test'); 
});

async function TestTimeDisplay(myPage : Page) {
//  const radioElement = '.MuiRadioGroup-root';
  //const myPage = await OpenPage(browser);
  await myPage.waitForTimeout(1000);
  //console.log("about to EnsureInSettingAss");
  await EnsureInSettingsApp(myPage);

  const myHelper = new RadioHelper();
  await expect(myPage.locator('.MuiRadioGroup-root')).toBeVisible({ timeout: 10000 });
  await myHelper.populate(myPage);
  const testRadio = await myHelper.getTestRadio();
  const orgRadio = await myHelper.getOrgRadio();
  
  console.log('testSelectTimeDisplay, clicking test radio' + await testRadio.getAttribute('value'));
  await testRadio.click();
  await executeSaveActions(myPage);
  console.log('about to reload');
  await myPage.goto(myPage.url());

  //await myPage.reload({ waitUntil: 'domcontentloaded' }); // had issues with Save not appearing, hence this ugly

  await expect(testRadio).toBeChecked({ timeout: 10000 });
  console.log('testSelectTimeDisplay, clicking org radio' + await orgRadio.getAttribute('value'));
  await orgRadio.click();
  await myPage.waitForTimeout(1000);
  await executeSaveActions(myPage);
  //await myPage.reload({ waitUntil: 'domcontentloaded' }); // had issues with Save not appearing, hence this ugly
  await myPage.goto(myPage.url());
  await myPage.waitForTimeout(1000);
  await expect(orgRadio).toBeChecked();
}

async function TestAllowNotificationIdx(page : Page, notificationIdx: number) {
  const regexStartsWithNotifications = /^Notifications/;
  //console.log("waitForTimeout ");
  await page.waitForTimeout(1000);
  //console.log("about to EnsureInSettingAss");
  await EnsureInSettingsApp(page);
  //console.log("timeout been waited for");
  const notificationsItem = await page.getByRole('listitem').filter({ hasText: regexStartsWithNotifications });

  await expect(notificationsItem).toBeVisible( { timeout: 10_000 });
  
  const allListItem = await notificationsItem.getByRole('listitem').all();
  //console.log('allListItem count ' + await allListItem.length);
  if(notificationIdx >= allListItem.length) {
    console.log('Invalid notification index: ' + notificationIdx);
    return;
  }
  const targetListItem = allListItem[notificationIdx];
  console.log('Testing ' + await targetListItem.textContent());
  await targetListItem.click();
  const allowNotifications = await targetListItem.getByRole('checkbox');
  await expect(allowNotifications).toBeVisible();
  const isChecked = await allowNotifications.isChecked();
  //await allowNotifications.isChecked() ? await allowNotifications.uncheck() : await allowNotifications.check();
  await(isChecked ? allowNotifications.uncheck() :  allowNotifications.check());
  console.log('toggled allow notification to ' + !isChecked);
  await page.waitForTimeout(500);
  await executeSaveActions(page);
  await page.waitForTimeout(1500);
  await page.reload({ waitUntil: 'domcontentloaded' });

  await targetListItem.click();
  await expect(await allowNotifications.isChecked()).toBe(!isChecked) ;

  //isChecked ? await allowNotifications.check() : await allowNotifications.uncheck();
  await(isChecked ? allowNotifications.check() :  allowNotifications.uncheck());
  console.log('toggled allow notification back to ' + isChecked);
  await expect(await allowNotifications.isChecked()).toBe(isChecked) ;
  await page.waitForTimeout(500);
  await executeSaveActions(page); 
  // add code to save, check val, return to original and save 
  console.log('End of the allow notification test  ') ;
};

async function TestNotificationType(page : Page) {
    const regexStartsWithNotifications = /^Notifications/;
  console.log("waitForTimeout ");
  await page.waitForTimeout(1000);
  console.log("about to EnsureInSettingAss");
  await EnsureInSettingsApp(page);
  //console.log("timeout been waited for");
  const notificationsItem = await page.getByRole('listitem').filter({ hasText: regexStartsWithNotifications });
  await expect(notificationsItem).toBeVisible({ timeout: 10_000 });

  //const targetListItem = await notificationsItem.getByRole('listitem').filter({ hasText: /^Access Management/});
  const notificationsListItems = await notificationsItem.getByRole('listitem').all();
  await expect((await notificationsItem.getByRole('listitem').all()).length).toBeGreaterThan(0);
  const targetListItem = notificationsListItems[0];
  
  await targetListItem.click();
  const allowNotifications = await targetListItem.getByRole('checkbox');
  const isChecked = await allowNotifications.isChecked();
  await allowNotifications.check();

  const alarmChild = await getClickableElementByText(notificationsItem, 'Alarm');
  const bannerChild = await getClickableElementByText(notificationsItem, 'Banner');
  const noneChild = await getClickableElementByText(notificationsItem, 'None');
  const alarmChecked = (await alarmChild.getAttribute('style') != null);
  const bannerChecked = (await bannerChild.getAttribute('style') != null);
  const noneChecked = (await noneChild.getAttribute('style') != null);
  const newChhild = (!bannerChecked) ? bannerChild : alarmChild;
  await newChhild.click();
  await executeSaveActions(page);
  await page.waitForTimeout(500);
  await page.reload({ waitUntil: 'domcontentloaded' });

  await targetListItem.click();
  await expect(await newChhild.getAttribute('style') != null).toBeTruthy();
  if(alarmChecked)   await alarmChild.click();
  if(bannerChecked)  await bannerChild.click();
  if(noneChecked)    await noneChild.click();
  isChecked ? await allowNotifications.check() : await allowNotifications.uncheck();
  await executeSaveActions(page); 

  console.log('End of the select notification test  ') ;
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

async function getClickableElementByText(notificationsElm : Locator, targetText : string) : Promise<Locator> {
    const bannerElm = await notificationsElm.getByText(targetText, { exact: true });
    const bannerParent = await bannerElm.locator('..');
    const prevSibling = await bannerParent.locator('//preceding-sibling::*');
    const firstChild = await prevSibling.locator('*').first();
    return firstChild;
}

async function printTextAndType(elm : Locator, label : string) {
  const text = await elm.evaluate(el => el.textContent);
  const type = await elm.evaluate(el => el.tagName);
  console.log(label + ' element , type=' + type + ', text=' + text);
}

async function TestModifyPhone(page : Page, phoneName : string) {
  const pencilEditIcon = page.locator('#profile button');
  const targetPhone = page.getByRole('listitem').filter({ hasText: phoneName});

  EnsureInSettingsApp(page);

  await targetPhone.hover();
  await pencilEditIcon.click();
  //const newPhoneNumber = await getNewPhoneNumber();
  let newPhoneNumber = '(123) 456 - 7890';
  const phoneEdit = await page.getByRole('textbox');

  await phoneEdit.click();
  const oldEditPhone = await phoneEdit.inputValue();
  if(oldEditPhone == newPhoneNumber) newPhoneNumber = '(987) 654 - 3210';
  await phoneEdit.fill(newPhoneNumber);
  await page.waitForTimeout(1000);
  await executeSaveActions(page);

  await page.waitForTimeout(3000); // when running with approval it took two seconds for phone to switch back after the Third message box appeared
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(targetPhone).toContainText(newPhoneNumber, { timeout: 10000 });

  await targetPhone.hover();
  await pencilEditIcon.click();
  await page.getByRole('textbox').click();
  if(oldEditPhone!=null) await page.getByRole('textbox').fill(oldEditPhone);
  await page.waitForTimeout(1000);
  await executeSaveActions(page);

}

async function logInToAvert(page : Page) {
  //const targetURL = USE_CB2 ? cb2_LOGIN_URL : LOGIN_URL;
  const targetURL = getLoginUrl();
  await page.goto(targetURL);
}

async function executeSaveActions(page : Page) : Promise<void> {
  //await expect(page.getByRole('button', { name: 'SAVE CHANGES' })).toBeVisible();
  if(await (page.getByRole('button', { name: 'SAVE CHANGES' }).count()) > 0) {
    await page.getByRole('button', { name: 'SAVE CHANGES' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    return;
  }
  else if(await (page.getByRole('button', { name: 'REQUEST APPROVAL' }).count()) > 0) 
  {
    await page.getByRole('button', { name: 'REQUEST APPROVAL' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    await page.getByRole('button', { name: 'Done' }).click();
    await AdminApprover.AdminApproveRequest();
  }
  else 
    console.log('no save or request button found'); 
};

async function EnsureInSettingsApp(page : Page) {
  //await page.reload({ waitUntil: 'networkidle' });
  //await page.waitForURL(/settings-app/, { timeout: 100 });
  let exRet = await expect(page).not.toHaveURL(/\/login$/, { timeout: 10000 });
  await page.waitForTimeout(100);
  if((await page.url()).indexOf('settings-app') == -1) {
    await page.getByRole('button', { name: 'Apps Menu' }).click();
    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page.getByRole('paragraph').filter({ hasText: 'My Account Settings' })).toBeVisible();
  }
};
