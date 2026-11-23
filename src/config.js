require('dotenv').config();

const required = ['BASE_URL', 'OPENEMR_USERNAME', 'OPENEMR_PASSWORD'];
function missingConfig() {
  return required.filter(k => !process.env[k]);
}
function env(key, fallback = '') { return process.env[key] || fallback; }

module.exports = {
  missingConfig,
  baseUrl: env('BASE_URL'),
  username: env('OPENEMR_USERNAME'),
  password: env('OPENEMR_PASSWORD'),
  patient: {
    first: env('TEST_PATIENT_FIRST', 'Automation'),
    last: env('TEST_PATIENT_LAST', 'TestPatient'),
    dob: env('TEST_PATIENT_DOB', '1990-01-15'),
    gender: env('TEST_PATIENT_GENDER', 'Male'),
    search: env('TEST_SEARCH_TERM', 'Automation')
  },
  provider: env('TEST_PROVIDER'),
  appointmentDate: env('TEST_APPOINTMENT_DATE'),
  appointmentTime: env('TEST_APPOINTMENT_TIME'),
  billingAmount: env('TEST_BILLING_AMOUNT', '100')
};