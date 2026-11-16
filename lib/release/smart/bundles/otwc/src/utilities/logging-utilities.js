/* eslint no-console: ["error", { allow: ["debug", "log", "info", "warn", "error"] }] */

const WC_LOGGING_ENABLED = false;

// To identify the source of the log message, the log message should contain the source
// of the message e.g. web component and function name.
// The browser console shows as source just this js-file.
// Example: Console.log('otcMenu: _showButton: The button state is now hidden.');
const Console = {
  log(...args) {
    if (WC_LOGGING_ENABLED) {
      console.log(...args);
    }
  },
  debug(...args) {
    if (WC_LOGGING_ENABLED) {
      console.debug(...args);
    }
  },
  info(...args) {
    if (WC_LOGGING_ENABLED) {
      console.info(...args);
    }
  },
  warn(...args) {
  },
  error(...args) {
    if (WC_LOGGING_ENABLED) {
      console.error(...args);
    }
  },
};

export { Console };
//# sourceMappingURL=logging-utilities.js.map
