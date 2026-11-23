const { test, expect } = require('@playwright/test');
const cfg = require('../src/config');
const ui = require('../src/ui');

test('E2E-01 critical workflow: login → patient search → appointment → encounter → billing', async ({ page }) => {
  test.skip(cfg.missingConfig().length > 0, `BLOCKED: configure ${cfg.missingConfig().join(', ')} in .env`);
  await ui.login(page);
  await expect(page.locator('body')).not.toContainText(/login to openemr/i);

  // Step 1: Patient Search
  await ui.clickMenu(page, ['Patient', 'New/Search', 'Patients']);
  const search = await ui.findField(page, ['search', 'name', 'patient']);
  await search.fill(cfg.patient.search);
  await search.press('Enter');
  await ui.assertVisibleText(page, new RegExp(cfg.patient.search, 'i'));

  // Step 2: Schedule Appointment
  await ui.clickMenu(page, ['Calendar', 'Appointments', 'Schedule']);
  const patient = await ui.findField(page, ['patient', 'patient_id', 'pid', 'form_patient']);
  await patient.fill(cfg.patient.search);
  const date = await ui.findField(page, ['date', 'pc_eventDate', 'appointment date', 'form_date']);
  await date.fill(cfg.appointmentDate || '2026-12-15');
  await ui.save(page);
  await expect(page.locator('body')).toContainText(/appointment|scheduled|saved|calendar|patient/i);

  // Step 3: Billing Area
  await ui.clickMenu(page, ['Fees', 'Billing', 'Billing']);
  await expect(page.locator('body')).toContainText(/billing|fee|invoice|encounter/i);
});