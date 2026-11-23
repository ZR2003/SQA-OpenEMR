# OpenEMR — SQA Assignment 02 Automation

## Group members
- Rumaisa Rafiq — 02-134231-056
- Zainab Rashid — 02-134231-037
- Khadija Tul Kubra — 02-134231-017

## Scope and traceability
Continues Assignment 01 (OpenEMR). Retains FR-01 to FR-05 and NFR-01 to NFR-03. Adds FR-06, Appointment Status Management, based on the appointment-status workflow already manually reviewed in Assignment 01.

| Requirement | Owner | Automated tests |
|---|---|---|
| FR-01 Login | Rumaisa Rafiq | TC-01, TC-02 |
| FR-02 Patient Registration | Rumaisa Rafiq | TC-03, TC-04 |
| FR-03 Patient Search | Zainab Rashid | TC-05, TC-06 |
| FR-04 Appointment Scheduling | Zainab Rashid | TC-07, TC-08 |
| FR-05 Billing | Khadija Tul Kubra | TC-09, TC-10 |
| FR-06 Appointment Status | Khadija Tul Kubra | TC-11, TC-12 |
| NFR-01 Security | Rumaisa Rafiq | NFR-01 |
| NFR-02 Performance | Zainab Rashid | NFR-02 |
| NFR-03 Usability | Khadija Tul Kubra | NFR-03 |
| Critical workflow | Shared | E2E-01 |

## Techniques
- Equivalence Partitioning (EP): valid/invalid credential groups, existing/no-match patient groups, valid/invalid status groups.
- Boundary Value Analysis (BVA): required patient-name fields at empty boundary; appointment required fields; invalid billing amount below the valid range.
- The negative appointment-status test verifies that only UI-provided values are selectable; it does not inject unsafe values into the application.

## Tools and environment
- Playwright Test + Chromium, Node.js.
- Target: local/authorized OpenEMR instance. Assignment 01 identified OpenEMR 8.4.1; verify the actual installed version before execution.
- Configure `.env` from `.env.example`. Use synthetic records only.

## Install and run (Windows PowerShell)
```powershell
npm install
npx playwright install chromium
Copy-Item .env.example .env
# Edit .env and enter your authorized test URL and test account details.
npm test
npm run smoke
npm run member:rumaisa
npm run member:zainab
npm run member:khadija
npm run report
```

## Important locator configuration
OpenEMR menu names, form labels and selectors vary with version, language, enabled modules and role permissions. Review `src/ui.js` and adapt locators to the actual test instance before running. The tests deliberately fail with a useful locator message rather than silently claiming success. TC-07 and E2E-01 also require a future `TEST_APPOINTMENT_DATE`.

## Test inventory and expected checks
| ID | Requirement | Owner | Input / technique | Expected result |
|---|---|---|---|---|
| TC-01 | FR-01 | Rumaisa | Valid account; EP positive; @smoke | Authenticated application page appears |
| TC-02 | FR-01 | Rumaisa | Invalid credentials; EP negative | Authentication denied |
| TC-03 | FR-02 | Rumaisa | Synthetic first/last name; EP positive | Patient record saved/confirmation shown |
| TC-04 | FR-02 | Rumaisa | Empty required names; BVA negative | Required-field validation appears |
| TC-05 | FR-03 | Zainab | Existing synthetic patient; EP positive; @smoke | Matching patient appears |
| TC-06 | FR-03 | Zainab | Unique no-match term; EP negative | No matching record is reported |
| TC-07 | FR-04 | Zainab | Future appointment date; EP positive | Appointment saved |
| TC-08 | FR-04 | Zainab | Missing required appointment fields; BVA negative | Form rejects incomplete appointment |
| TC-09 | FR-05 | Khadija | Authorized billing module; EP positive; @smoke | Billing area loads |
| TC-10 | FR-05 | Khadija | Amount -1; BVA negative | Invalid amount is rejected |
| TC-11 | FR-06 | Khadija | UI-supported status; EP positive | Status update is saved |
| TC-12 | FR-06 | Khadija | Inspect status options; EP negative partition | Only supported status options are exposed; no invalid value submitted |
| NFR-01 | NFR-01 | Rumaisa | Unauthenticated patient URL | Protected content is not exposed |
| NFR-02 | NFR-02 | Zainab | Patient search navigation; threshold <3000 ms | Measured navigation time below threshold |
| NFR-03 | NFR-03 | Khadija | Visible patient form controls; threshold >=80% named | At least 80% of visible controls have accessible names |
| E2E-01 | FR-01–FR-05 | Shared | Login → search → appointment → encounter → billing | Workflow completes and each major page is asserted |

## Smoke and regression
Smoke subset: TC-01, TC-05, TC-09 (three critical functional tests, one per member).
Regression procedure: document one small, reversible local change in the test environment (for example, a locally changed patient-form label or required-field configuration); run the directly affected test before and after reverting/applying the change. Save both Playwright JSON/HTML reports and screenshots. Do not change production or real patient records. Record the exact changed file/setting and the affected IDs in the report.
Defect procedure: record only defects reproduced in the authorized instance, with steps, expected/actual result, severity and screenshot/trace. Distinguish application defects from locator/script errors.

## Execution honesty
The included `reports/execution-status.txt` records the current state. The suite has not been executed because no runnable OpenEMR instance, credentials or test environment were supplied with the assignment PDFs. Therefore results are **Not Run/Blocked**, not invented pass/fail results. After configuring and executing the suite, replace this file with the original Playwright execution reports and update the PDF report with actual counts, timings and evidence.

## Application sources
- https://github.com/openemr/openemr
- https://www.open-emr.org/
- https://demo.openemr.io/openemr
- Assignment 01 source requirements and quality observations supplied by the group.
