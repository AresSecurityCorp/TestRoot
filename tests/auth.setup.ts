import {test as setup, expect} from '@playwright/test';
import path from 'path';

import { RUN_DEV , getDBConfig, getLoginUrl , getAdminPassword, getUsername, joePwd, joeUsername, joeAresUsername, joeAresPwd , adminPwd, devPwd, adminUsername, devUsername } from '../utils/constants.js';

//import { RUN_DEV , adminPwd, devPwd, adminUsername, devUsername, getDBConfig, getLoginUrl , getPassword, getUsername, joePwd, joeUsername, joeAresUsername, joeAresPwd } from '../utils/constants.js';


//const authFile = path.join(__dirname, '../playwright/.auth/user.json');
const devAuthFile = path.join(__dirname, '../playwright/.auth/user.json');
const adminAuthFile = path.join(__dirname, '../playwright/.auth/admin.json');


setup('authentication', async ({ page }) => {
  // const targetURL = USE_CB2 ? cb2_LOGIN_URL : LOGIN_URL;
  // const targetPwd = USE_CB2 ? cb2pwd : password;
  const targetURL = getLoginUrl();
  const targetPwd = getAdminPassword();
  
  await page.goto(targetURL);
  await expect(page).toHaveURL(/\/login$/);

  const usernameField = page.getByRole('textbox', { name: 'Username or Email Address' });
  const passwordField = page.getByRole('textbox', { name: 'Password' });
  const loginButton = page.getByRole('button', { name: 'Login' });

  await expect(usernameField).toBeVisible();
  await expect(passwordField).toBeVisible();
  await expect(loginButton).toBeVisible();

  await usernameField.fill(joeAresUsername);
  await passwordField.fill(joeAresPwd);
  // await usernameField.fill(joeUsername);
  // await passwordField.fill(joePwd);
  await loginButton.click();
  let exRet = await expect(page).not.toHaveURL(/\/login$/);

  await page.context().storageState({ path: devAuthFile });
});

setup('authentication admin', async ({ page }) => {
  // const targetURL = USE_CB2 ? cb2_LOGIN_URL : LOGIN_URL;
  // const targetPwd = USE_CB2 ? cb2pwd : password;
  const targetURL = getLoginUrl();
  
  await page.goto(targetURL);
  await expect(page).toHaveURL(/\/login$/);

  const usernameField = page.getByRole('textbox', { name: 'Username or Email Address' });
  const passwordField = page.getByRole('textbox', { name: 'Password' });
  const loginButton = page.getByRole('button', { name: 'Login' });

  await expect(usernameField).toBeVisible();
  await expect(passwordField).toBeVisible();
  await expect(loginButton).toBeVisible();

  await usernameField.fill(adminUsername);
  await passwordField.fill(getAdminPassword());
  await loginButton.click();
  let exRet = await expect(page).not.toHaveURL(/\/login$/, { timeout: 10000 });

  await page.context().storageState({ path: adminAuthFile });
});