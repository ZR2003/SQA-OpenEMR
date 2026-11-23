// OpenEMR UI adapter. OpenEMR screens and labels can vary by version/configuration.
// If a locator does not match your authorized test instance, update it here only.
const { expect } = require('@playwright/test');
const cfg = require('./config');

async function login(page) {
  await page.goto('./');
  const user = page.locator('input[name="authUser"]').first();
  const pass = page.locator('input[name="clearPass"]').first();
  await user.waitFor({ state: 'visible' });
  await user.fill(cfg.username);
  await pass.fill(cfg.password);
  const submit = page.locator('button[type="submit"], input[type="submit"]').first();
  await submit.click();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).not.toContainText(/invalid username|incorrect password|login failed/i);
  await expect(page).not.toHaveTitle(/OpenEMR Login/i);
}

async function clickMenu(page, names) {
  const topName = names[0];

  // Direct route for Appointment Scheduling & Status
  if (/calendar/i.test(topName) && names.some(n => /appointment|schedule/i.test(n))) {
    await page.goto('interface/main/calendar/add_edit_event.php');
    await page.waitForLoadState('networkidle').catch(() => {});
    return;
  }

  // If currently on a popup or standalone screen, return to main dashboard
  if (page.url().includes('add_edit_event') || page.url().includes('demographics.php')) {
    await page.goto(cfg.baseUrl || './');
    await page.waitForLoadState('networkidle').catch(() => {});
    if (page.url().includes('login')) {
      await login(page);
    }
  }

  // 1. Try to open the top-level menu category first if present
  const topMenu = page.locator(`button, [role="button"], a, .menuLabel, .nav-link`)
    .filter({ hasText: new RegExp(`^\\s*${topName}\\s*$|^\\s*${topName}`, 'i') }).first();

  if (await topMenu.count() && await topMenu.isVisible().catch(() => false)) {
    await topMenu.click();
    await page.waitForTimeout(500);

    // Look for the submenu items in the order they were provided (e.g. 'New/Search', then 'Patients')
    let subFound = false;
    for (let i = 1; i < names.length; i++) {
      const subName = names[i];
      const sub = page.locator(`.dropdown-menu.show a:visible, .dropdown-menu.show button:visible, .dropdown-menu.show li:visible, a:visible, button:visible`)
        .filter({ hasText: new RegExp(subName, 'i') }).first();
      if (await sub.count() && await sub.isVisible().catch(() => false)) {
        await sub.click();
        await page.waitForLoadState('networkidle').catch(() => {});
        subFound = true;
        return;
      }
    }

    // If top-level was Calendar or a direct view without dropdown sub-menus, clicking topMenu itself navigated to the view
    if (!subFound && /calendar/i.test(topName)) {
      await page.waitForLoadState('networkidle').catch(() => {});
      return;
    }
  }

  // 2. Direct match anywhere
  for (const name of names) {
    const direct = page.locator(`a:visible, button:visible, [role="button"]:visible, [role="link"]:visible, .nav-link:visible`)
      .filter({ hasText: new RegExp(`^\\s*${name}\\s*$`, 'i') }).first();
    if (await direct.count()) {
      await direct.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      return;
    }
  }

  // 3. Partial match anywhere
  for (const name of names) {
    const partial = page.getByRole('link', { name: new RegExp(name, 'i') })
      .or(page.getByRole('button', { name: new RegExp(name, 'i') }))
      .or(page.locator(`text=${name}:visible`)).first();
    if (await partial.count()) {
      await partial.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      return;
    }
  }

  throw new Error(`Could not find navigation link: ${names.join(' / ')}. Update src/ui.js for this OpenEMR version.`);
}

async function findField(page, candidates, timeoutMs = 15000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    const scopes = [page, ...page.frames()];
    for (const scope of scopes) {
      for (const c of candidates) {
        try {
          const byName = scope.locator(`input[type="text"][name="${c}"], input:not([type="checkbox"]):not([type="radio"])[name="${c}"], [name="${c}"]`).first();
          if (await byName.count() && await byName.isVisible().catch(() => false)) return byName;

          const byId = scope.locator(`input[type="text"]#${c}, input:not([type="checkbox"]):not([type="radio"])#${c}, #${c}`).first();
          if (await byId.count() && await byId.isVisible().catch(() => false)) return byId;

          const byPlaceholder = scope.locator(`input[placeholder*="${c}" i], textarea[placeholder*="${c}" i]`).first();
          if (await byPlaceholder.count() && await byPlaceholder.isVisible().catch(() => false)) return byPlaceholder;

          const byLabel = scope.getByLabel(new RegExp(c, 'i')).first();
          if (await byLabel.count() && await byLabel.isVisible().catch(() => false)) {
            const type = await byLabel.getAttribute('type');
            if (type !== 'checkbox' && type !== 'radio') return byLabel;
          }
        } catch (e) {}
      }
    }
    await page.waitForTimeout(500);
  }
  throw new Error(`Field not found: ${candidates.join(', ')}. Update src/ui.js.`);
}

async function save(page, timeoutMs = 10000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    const scopes = [...page.frames().reverse(), page];
    for (const scope of scopes) {
      try {
        const b = scope.getByRole('button', { name: /save|submit|add|create|update/i }).first();
        if (await b.count() && await b.isVisible().catch(() => false)) {
          await b.click();
          await page.waitForLoadState('networkidle').catch(() => {});
          return;
        }
        const actionLink = scope.locator('a, strong, span').filter({ hasText: /update list|save|submit/i }).first();
        if (await actionLink.count() && await actionLink.isVisible().catch(() => false)) {
          await actionLink.click();
          await page.waitForLoadState('networkidle').catch(() => {});
          return;
        }
        const i = scope.locator('input[type="submit"], input[type="button"][value*="Save" i], input[type="button"][value*="Update" i], button[type="submit"], input[value*="Save" i], input[value*="Submit" i]').first();
        if (await i.count() && await i.isVisible().catch(() => false)) {
          await i.click();
          await page.waitForLoadState('networkidle').catch(() => {});
          return;
        }
      } catch (e) {}
    }
    await page.waitForTimeout(500);
  }
  throw new Error('Save/submit control not found. Update src/ui.js.');
}

async function assertVisibleText(page, pattern, timeoutMs = 10000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    const pageMatches = await page.locator('body').filter({ hasText: pattern }).count().catch(() => 0);
    if (pageMatches > 0) return;

    for (const frame of page.frames()) {
      try {
        const frameMatches = await frame.locator('body').filter({ hasText: pattern }).count().catch(() => 0);
        if (frameMatches > 0) return;
      } catch (e) {}
    }
    await page.waitForTimeout(500);
  }
  await expect(page.locator('body')).toContainText(pattern);
}

module.exports = { login, clickMenu, findField, save, assertVisibleText };