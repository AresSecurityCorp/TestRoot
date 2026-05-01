//import { test, expect, type Page, type Locator } from '@playwright/test';
import { test, expect, type Page, type Locator, Browser, BrowserContext } from '@playwright/test';
// @ts-ignore
import { getComparator } from 'playwright-core/lib/utils';
import fs from 'fs/promises';

import { RUN_DEV , getDBConfig, getLoginUrl , getPassword, getUsername } from '../utils/constants.js';
import {AdminApprover } from '../utils/approve.js';


//test.use({ storageState: 'playwright/.auth.json' });
test.beforeEach('logging in to Avert', async ({ page }) => {
  console.log(`Running ${test.info().title}`);
  await AdminApprover.Initialize(await page.context().browser());
  await logInToAvert(page);
  // await page.goto('https://my.start.url/');
});
test.afterEach(async () => {
  await AdminApprover.ClosePage();
});

console.log('TestSettings.spec.ts loaded');
const notificationTestTags = [ /^Access Management/, /^Advanced Reporting/ ] ;
notificationTestTags.forEach( (notificationTag) => {
  console.log('creating test for notification tag ' + notificationTag.toString());
  test('TestSettingsAllowNotification_' + notificationTag.toString(), async ({ page }) => {
    await TestAllowNotification(page, notificationTag);
  });
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

test('TestSettingsModifyCellPhone', async ({ page }) => {
  await TestModifyPhone(page, 'CELL PHONE' );
});

test('TestSettingsModifyOfficePhone', async ({ page }) => {
  await TestModifyPhone(page, 'OFFICE PHONE' );
});

async function TestAllowNotification(page : Page, notificationName : RegExp) {
  const regexStartsWithNotifications = /^Notifications/;
  console.log("waitForTimeout ");
  await page.waitForTimeout(1000);
  console.log("about to EnsureInSettingAss");
  await EnsureInSettingsApp(page);
  //console.log("timeout been waited for");
  const notificationsItem = await page.getByRole('listitem').filter({ hasText: regexStartsWithNotifications });
  await expect(notificationsItem).toBeVisible();
  
  const allListItem = await notificationsItem.getByRole('listitem').all();
  console.log('allListItem count ' + await allListItem.length);
  const targetListItem = await notificationsItem.getByRole('listitem').filter({ hasText: notificationName });
  console.log('targetListItem count ' + await targetListItem.count());
  await targetListItem.click();
  const allowNotifications = await targetListItem.getByRole('checkbox');
  await expect(allowNotifications).toBeVisible();
  const isChecked = await allowNotifications.isChecked();
  //await allowNotifications.isChecked() ? await allowNotifications.uncheck() : await allowNotifications.check();
  await(isChecked ? allowNotifications.uncheck() :  allowNotifications.check());
  console.log('toggled allow notification to ' + !isChecked);
  await page.waitForTimeout(500);
  await executeSaveActions(page);
  await page.waitForTimeout(500);
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

test('TestSettingsNotificationType', async ({ page }) => {

    const regexStartsWithNotifications = /^Notifications/;
  console.log("waitForTimeout ");
  await page.waitForTimeout(1000);
  console.log("about to EnsureInSettingAss");
  await EnsureInSettingsApp(page);
  //console.log("timeout been waited for");
  const notificationsItem = await page.getByRole('listitem').filter({ hasText: regexStartsWithNotifications });
  await expect(notificationsItem).toBeVisible();

  const targetListItem = await notificationsItem.getByRole('listitem').filter({ hasText: /^Access Management/});
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
});

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
  await expect(targetPhone).toContainText(newPhoneNumber);

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

async function getNewCoordSys(coordCombo : Locator) : Promise<string> {
  const curCoords = await coordCombo.textContent();
  let retCS = (curCoords == 'Degrees, Decimal Minutes' ?  'Degrees, Minutes, Seconds' :'Degrees, Decimal Minutes');
  return retCS;
}

async function getNewPhoneNumber() : Promise<string> {
  return '(212) 456 - 9000';
  const today = new Date();
  console.log(' minute=' + today.getMinutes().toString().padStart(2, '0') + ' second=' + today.getSeconds().toString().padStart(2, '0'));
  return '(212) 456 - '  + today.getMinutes().toString().padStart(2, '0') + today.getSeconds().toString().padStart(2, '0');
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
  await page.waitForTimeout(1000);
  if((await page.url()).indexOf('settings-app') == -1) {
    await page.getByRole('button', { name: 'Apps Menu' }).click();
    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page.getByRole('paragraph').filter({ hasText: 'My Account Settings' })).toBeVisible();
  }
};
