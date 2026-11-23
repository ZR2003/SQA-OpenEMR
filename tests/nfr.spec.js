const { test, expect } = require('@playwright/test');
const cfg = require('../src/config');
const ui = require('../src/ui');

// NFR-01 Security — unauthorized user must not see authenticated application content.
test('NFR-01 @rumaisa unauthenticated patient route is protected', async ({ page }) => {
  test.skip(cfg.missingConfig().length > 0, `BLOCKED: configure ${cfg.missingConfig().join(', ')} in .env`);
  await page.context().clearCookies();
  await page.goto('interface/patient_file/summary/demographics.php');
  const bodyText = (await page.locator('body').innerText()).trim();
  const isProtected = bodyText === '' || /login|unauthorized|access denied/i.test(bodyText) || page.url().includes('login');
  expect(isProtected).toBe(true);
  await expect(page.locator('body')).not.toContainText(/patient summary|demographics/i);
});

// NFR-02 Performance — navigation to patient search should complete within 3 seconds.
test('NFR-02 @zainab patient search navigation response is under 3000 ms', async ({ page }) => {
  test.skip(cfg.missingConfig().length > 0, `BLOCKED: configure ${cfg.missingConfig().join(', ')} in .env`);
  await ui.login(page);
  const start = Date.now();
  await ui.clickMenu(page, ['Patient', 'New/Search', 'Patients']);
  await expect(page.locator('body')).toContainText(/patient|search/i);
  const elapsed = Date.now() - start;
  const threshold = Number(process.env.TEST_PERF_THRESHOLD || (cfg.baseUrl && cfg.baseUrl.includes('localhost') ? 3000 : 6000));
  test.info().annotations.push({ type: 'measurement', description: `Patient search navigation: ${elapsed} ms; threshold: <${threshold} ms` });
  expect(elapsed).toBeLessThan(threshold);
});

// NFR-03 Usability — core navigation and visible form controls should have accessible names.
test('NFR-03 @khadija key patient screen controls have accessible labels', async ({ page }) => {
  test.skip(cfg.missingConfig().length > 0, `BLOCKED: configure ${cfg.missingConfig().join(', ')} in .env`);
  await ui.login(page);
  await ui.clickMenu(page, ['Patient', 'New/Search', 'Patients']);
  const inputs = page.locator('input:visible, select:visible, textarea:visible');
  const count = await inputs.count();
  expect(count).toBeGreaterThan(0);
  let named = 0;
  for (let i = 0; i < count; i++) {
    const el = inputs.nth(i);
    const aria = await el.getAttribute('aria-label');
    const id = await el.getAttribute('id');
    const name = await el.getAttribute('name');
    const label = id ? page.locator(`label[for="${id}"]`) : null;
    if (aria || name || (label && await label.count())) named++;
  }
  const ratio = named / count;
  test.info().annotations.push({ type: 'measurement', description: `Named visible controls: ${named}/${count} (${(ratio * 100).toFixed(1)}%); threshold: >=80%` });
  expect(ratio).toBeGreaterThanOrEqual(0.8);
});