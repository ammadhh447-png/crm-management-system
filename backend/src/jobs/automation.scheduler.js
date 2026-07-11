const automationService = require('../modules/automation/services/automation.service');

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const INITIAL_DELAY_MS = 60 * 1000;

let intervalId = null;

const startAutomationScheduler = () => {
  const run = async () => {
    try {
      await automationService.runFollowUpAutomation();
    } catch (err) {
      console.error('[Automation] Scheduler error:', err.message);
    }
  };

  setTimeout(run, INITIAL_DELAY_MS);
  intervalId = setInterval(run, SIX_HOURS_MS);

  console.log('[Automation] Follow-up scheduler started (every 6 hours)');
};

const stopAutomationScheduler = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

module.exports = { startAutomationScheduler, stopAutomationScheduler };
