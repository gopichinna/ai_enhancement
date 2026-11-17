/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['module', 'require', 'nuc/lib/underscore', 'nuc/lib/underscore.string'], function (module, require, _) {
  'use strict';

  let config = module.config();
  _.defaults(config, {
    console: true,
    consoleRe: false,
    level: 'WARN',
    timing: false,
    deprecated: false,
    page: false,
    performanceTimeStamp: false,
    moduleNameStamp: false,
    server: false,
    window: false,
    modules: {}
  });

  const thresholds = {
    ERROR: 4,
    WARN: 3,
    INFO: 2,
    DEBUG: 1,
    ALL: 1
  };

  const methods = {
    ERR: 'error',
    WRN: 'warn',
    INF: 'info',
    DBG: 'debug'
  };

  const noop = () => {};

  const consoleEnabled = typeof console !== 'undefined' && config.console;
  const loggerEnabled = config.window || config.page || config.server || config.consoleRe;
  const enabled = consoleEnabled || loggerEnabled;
  const modules = [];
  let bufferedEntries = [];
  let logger, appender;

  // const thresholdKey = Symbol('threshold');
  // const timingKey = Symbol('timing');
  // const deprecatedKey = Symbol('deprecated');

  function log(target) {
    if (!(this instanceof log)) {
      return new log(target);
    }
    this._target = target;
    initializeModule(this, true);
    modules.push(this);
  }

  const prototype = {
    _threshold: null,
    timing: null,
    deprecated: null,

    get enabled() {
      return enabled;
    },

    can(level) {
      return enabled && this._threshold <= getThreshold(level);
    },

    set({ level, timing, deprecated, modules } = {}) {
      _.extend(config, { level, timing, deprecated });
      _.extend(config.modules, modules);
      initilalize();
    },

    reset({ level, timing, deprecated, modules } = {}) {
      _.extend(
        config,
        {
          level: 'WARN',
          timing: false,
          deprecated: false,
          modules: {}
        },
        {
          level,
          timing,
          deprecated,
          modules
        }
      );
      initilalize(true);
    },

    reload() {
      config = module.config();
      initilalize(true);
    },

    debug() {
      return tryLog.call(this, thresholds.DEBUG, 'DBG', 'debug', arguments);
    },

    info() {
      return tryLog.call(this, thresholds.INFO, 'INF', 'info', arguments);
    },

    warn() {
      return tryLog.call(this, thresholds.WARN, 'WRN', 'warn', arguments);
    },

    error() {
      return tryLog.call(this, thresholds.ERROR, 'ERR', 'error', arguments);
    },

    time(group) {
      if (this.timing) {
        console.time(getGroupName.call(this, group));
      }
    },

    timeEnd(group) {
      if (this.timing) {
        console.timeEnd(getGroupName.call(this, group));
      }
    },

    deprecate() {
      if (enabled && this.deprecated) {
        var message = `DEPRECATED: ${formatMessage.apply(this, arguments)}`;
        return doLog.call(this, 'WRN', 'warn', message);
      }
      return noop;
    },

    getObjectName(object) {
      return object != null
        ? Object.getPrototypeOf(object).constructor.name
        : object === undefined
        ? 'undefined'
        : object === null
        ? 'null'
        : '';
    },

    getStackTrace(frameCountToSkip) {
      let stack;
      try {
        throw new Error();
      } catch (error) {
        stack = error.stack;
      }
      if (stack) {
        let lines = stack.split('\n');
        if (lines && lines.length > 0) {
          if (!lines[0].match(/\.js/)) {
            lines = lines.slice(1);
          }
          stack = lines.slice(frameCountToSkip === 0 ? 0 : frameCountToSkip || 1).join('\n');
        }
      } else {
        stack = 'at unknown place (no stack trace available)';
      }
      return stack;
    }
  };

  _.extend(log, prototype);
  _.extend(log.prototype, prototype);

  function tryLog(level, prefix, method, args) {
    if (enabled && this._threshold <= level) {
      const message = formatMessage.apply(this, args);
      return doLog(prefix, method, message);
    }
    return noop;
  }

  function doLog(prefix, method, message) {
    if (loggerEnabled) {
      if (logger) {
        if (bufferedEntries) {
          for (let i = 0, l = bufferedEntries.length; i < l; ++i) {
            const entry = bufferedEntries[i];
            logger[methods[entry[0]]](entry[1]);
          }
          bufferedEntries = null;
        }
        logger[methods[prefix]](message);
      } else {
        bufferedEntries.push([prefix, message]);
      }
    }
    if (consoleEnabled) return console[method].bind(console, message);
  }

  function initilalize(reset) {
    log._threshold = log.prototype._threshold = getThreshold(config.level);
    log.timing = log.prototype.timing = config.timing;
    log.deprecated = log.prototype.deprecated = config.deprecated;
    for (const module of modules) {
      initializeModule(module, reset);
    }
  }

  function initializeModule(module, reset) {
    const { _target: target } = module;
    if (reset) {
      delete module._threshold;
      delete module.timing;
      delete module.deprecated;
    }
    for (const pattern in config.modules) {
      if (matchModule(pattern, target)) {
        const { level, timing, deprecated } = config.modules[pattern];
        if (level) {
          module._threshold = getThreshold(level);
        }
        if (timing !== undefined) {
          module.timing = timing;
        }
        if (deprecated !== undefined) {
          module.deprecated = deprecated;
        }
      }
    }
  }

  function matchModule(pattern, target) {
    // Handle alone wildcards separately; they are handled depending on their
    // combination with slash (module path separator) below
    if (pattern === '**') {
      pattern = '.*';
    } else if (pattern === '*') {
      pattern = '[^/]*';
    } else {
      pattern = pattern.replace(/^\*(?!\*)/g, '#'); // '*some...'
      pattern = pattern.replace(/([^*])\*$/g, '$1#'); // '...some*'
      pattern = pattern.replace(/\/\*(?!\*)/g, '/#'); // '.../*some'
      pattern = pattern.replace(/([^*])\*\//g, '$1#/'); // 'some*/...'
      pattern = pattern.replace(/\/\*\*/g, '(?:/.*)?'); // '.../**'
      pattern = pattern.replace(/\*\*\//g, '(?:.*/)?'); // '**/...'
      // If we put the pattern with asterisks at once there, following
      // replacements would process it again and it would be too complicated
      // to avoid it; for example, JavaScript knows no look-behind assertions
      pattern = pattern.replace(/#/g, '[^/]*'); // '[^/]+' -> '[^/]*'
    }
    pattern = `^${pattern}$`;
    return new RegExp(pattern).test(target);
  }

  function getThreshold(level) {
    const threshold = thresholds[(level || 'WARN').toUpperCase()];
    if (!threshold) {
      throw new Error(`invalid log level: "${level}".`);
    }
    return threshold;
  }

  function formatMessage(message) {
    if (message !== undefined) {
      if (typeof message === 'string') {
        message = _.str.sformat.apply(this, arguments);
      } else {
        message = message !== null ? message.toString() : 'null';
      }
      if (config.performanceTimeStamp) {
        message = getTimePerformanceStamp() + message;
      }
      if (config.moduleNameStamp && this._target) {
        message += ` (${this._target})`;
      }
    } else {
      message = '';
    }
    return message;
  }

  function getTimePerformanceStamp() {
    const seconds = ((window.performance.now() / 1000) % 10).toFixed(3);
    return `[${seconds}] `;
  }

  function getGroupName(group) {
    if (this._target) {
      group = _.str.sformat('[{0}] {1}', this._target, group);
    }
    return group;
  }

  function initializeLogger(log4javascript, ConsoleReAppender) {
    log4javascript.setDocumentReady();
    logger = log4javascript.getLogger();

    //~ if (config.console) {
    //~ var appender = new log4javascript.BrowserConsoleAppender();
    //~ appender.setLayout(new log4javascript.PatternLayout(
    //~ '%d{HH:mm:ss.SSS} %-5p - %m{1}%n'));
    //~ logger.addAppender(appender);
    //~ }

    if (config.window) {
      appender = new log4javascript.PopUpAppender();
      appender.setNewestMessageAtTop(false);
      appender.setScrollToLatestMessage(true);
      //~ appender.setShowHideButton(true);
      //~ appender.setShowCloseButton(true);
      appender.setLayout(new log4javascript.PatternLayout('%d{HH:mm:ss.SSS} %-5p - %m{1}'));
      logger.addAppender(appender);
    }
    if (config.page) {
      //~ var placeholderID = config.placeholder || 'csui_log';
      //~ var placeholder = $(placeholderID);
      //~ if (placeholder.length == 0)
      //~ placeholder = $('<div id='' + placeholder + ''></div>')
      //~ .appendTo($(document.body));
      appender = new log4javascript.InPageAppender(config.placeholder);
      appender.setNewestMessageAtTop(false);
      appender.setScrollToLatestMessage(true);
      appender.setShowHideButton(true);
      appender.setShowCommandLine(true);
      appender.setLayout(new log4javascript.PatternLayout('%d{HH:mm:ss.SSS} %-5p - %m{1}'));
      logger.addAppender(appender);
    }
    if (config.consoleRe) {
      appender = new ConsoleReAppender();
      appender.setLayout(new log4javascript.PatternLayout('%d{HH:mm:ss.SSS} %-5p - %m{1}'));
      logger.addAppender(appender);
    }
    if (config.server) {
      appender = new log4javascript.AjaxAppender(config.server.url);
      appender.setLayout(new log4javascript.JsonLayout());
      appender.setTimed(config.server.timed !== false);
      appender.setTimerInterval(config.server.timerInterval || 500);
      appender.setBatchSize(config.server.batchSize || 10);
      appender.setWaitForResponse(false);
      appender.setSendAllOnUnload(true);
      const headers = _.extend(
        {
          'content-type': 'application/json'
        },
        config.server.headers
      );
      _.each(_.keys(headers), function (name) {
        appender.addHeader(name, headers[name]);
      });
      logger.addAppender(appender);
    }

    logger.setLevel(log4javascript.Level.DEBUG);
  }

  initilalize();

  if (loggerEnabled) {
    // log4javascript is a big dependency, which is loaded on demand, because
    // it is used only seldom and only by some products.
    // The problem with loading it on demand is that the loggers may not be
    // available synchronously in the module, which depends on the log.
    // During the loading time, log entries may be printed only on the console.
    const logDeps = ['nuc/lib/log4javascript'];
    if (config.consoleRe) {
      logDeps.push('nuc/utils/log/console.re.appender');
    }
    if (
      logDeps.every(function (moduleName) {
        return require.defined(moduleName);
      })
    ) {
      initializeLogger(
        require('nuc/lib/log4javascript'),
        config.consoleRe && require('nuc/utils/log/console.re.appender')
      );
    } else {
      require(logDeps, initializeLogger);
    }
  }

  return log;
});
