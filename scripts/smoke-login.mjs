import 'dotenv/config';
import SparkMD5 from 'spark-md5';

const base = process.env.IOTEK_BASE_URL ?? 'https://11-app-mop.iotek.ai';
const email = process.env.ZMODO_TEST_EMAIL;
const pw = process.env.ZMODO_TEST_PASSWORD;

if (!email || !pw) { console.error('Set ZMODO_TEST_EMAIL and ZMODO_TEST_PASSWORD in .env'); process.exit(1); }

const form = (o) =>
  Object.entries(o)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

const post = async (path, params) =>
  (
    await fetch(base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form(params),
    })
  ).json();

const uuid = globalThis.crypto?.randomUUID?.() ?? `node-${Date.now()}`;

const loginRes = await post('/user/user_login', {
  email,
  password: SparkMD5.hash(pw),
  client: 1,
  client_uuid: uuid,
  client_version: '8.0.0',
  language: 'en',
  platform: 2,
  app_version: '8.0.0',
  offset_second: 0,
});

if (loginRes.result !== 'ok') {
  console.error('LOGIN FAIL', loginRes);
  process.exit(1);
}

const list = await post('/device/device_list', {
  token: loginRes.token,
  start: 0,
  count: 50,
});

console.log('LOGIN ok, devices:', Array.isArray(list.data) ? list.data.length : 'n/a');
process.exit(list.result === 'ok' ? 0 : 1);
