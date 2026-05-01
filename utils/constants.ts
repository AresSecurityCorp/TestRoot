
//export const RUN_DEV = true;
export const RUN_DEV = false;
const LOGIN_URL = 'https://cb2-release2.aresseccorp.com/login';
const DEV_LOGIN_URL = 'https://cb2-dev2.aresseccorp.com/login';

export const adminUsername = 'orgadmin@aressecuritycorp.com';
export const devUsername = 'jpoerschke@aressecuritycorp.com';
export const joeUsername = 'joe.poerschke@gmail.com';
export const joeAresUsername = 'jpoerschke@aressecuritycorp.com';

export const adminPwd = '0rg@dminRelease';
export const devPwd = '0rg@dminDev';
export const joePwd = '0rg@dminRelease';
export const joeAresPwd = '0rg@dminRelease3';

const relDBConfig = {
  host: '192.168.64.94',
  port: 28015,
  user: 'admin',
  password: 'xP7Kj2-JjciO'
};
const devDBConfig = {
  host: '192.168.64.93',
  port: 28015,
  user: 'admin',
  password: 'Z87DBK7xI!n9'
};

export function getLoginUrl() {
    return RUN_DEV ? DEV_LOGIN_URL : LOGIN_URL;
}

export function getUsername() {
    return RUN_DEV ? devUsername : adminUsername;
}   

export function getPassword() {
    return RUN_DEV ? devPwd : adminPwd;
}   
export function getDBConfig() {
    return RUN_DEV ? devDBConfig : relDBConfig;
}   

