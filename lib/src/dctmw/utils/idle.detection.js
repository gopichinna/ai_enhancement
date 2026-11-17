/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import module from "module";

import $ from "nuc/lib/jquery";

import _ from "nuc/lib/underscore";

import logger from "nuc/utils/log";

const {
  tickIntervalMS = 1e4,
  maxNotification,
  eventName
} = module.config();

const DOM_EVENTS = [ "mousedown", "mousemove", "scroll", "keydown", "touchstart" ];

const MAX_CONTINUOUS_NOTIFICATION_LIMIT = _.isNumber(maxNotification) && !_.isNaN(maxNotification) && maxNotification > 0 ? maxNotification : 10;

const PAGE_IDLING_EVENT_NAME = _.isString(eventName) && !_.isEmpty(eventName) ? eventName : "pageidle";

const log = logger(module.id);

let running, timeoutId, notificationCounter = 0, defaultNotificationTarget;

const xhrQ = [];

$(document).ajaxSend(function(e, xhr) {
  xhrQ.push(xhr);
});

$(document).ajaxComplete(function(e, xhr) {
  const i = $.inArray(xhr, xhrQ);
  if (i > -1) {
    xhrQ.splice(i, 1);
  }
});

function hasPendingAjax() {
  return xhrQ.some(xhr => xhr.readyState !== 4);
}

function startTimer() {
  if (!timeoutId) {
    timeoutId = setTimeout(onTimeout, tickIntervalMS);
  }
}

function stopTimer() {
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
}

function resetTimer() {
  stopTimer();
  startTimer();
}

function restartTimer() {
  notificationCounter = 0;
  resetTimer();
}

function onTimeout() {
  if (hasPendingAjax()) {
    resetTimer();
    return;
  }
  notificationCounter++;
  setTimeout(notifyIdle, 0);
  if (notificationCounter < MAX_CONTINUOUS_NOTIFICATION_LIMIT) {
    resetTimer();
  } else {
    stopTimer();
  }
}

function notifyIdle() {
  const event = $.Event(PAGE_IDLING_EVENT_NAME, {
    bubbles: true,
    cancellable: true
  });
  $(document.activeElement ?? defaultNotificationTarget).trigger(event);
}

function startIdleDetector(mutationTargetEl = document.body) {
  if (running) {
    log.warn("Already running!") && console.warn(log.last);
    return;
  }
  if (!_.isNumber(tickIntervalMS) || _.isNaN(tickIntervalMS) || tickIntervalMS <= 0) {
    log.warn(`Idle check is effectively disabled with tick interval = ${tickIntervalMS}`) && console.warn(log.last);
    return;
  }
  log.info(`Starting idle detection with tick: ${tickIntervalMS}ms, limit: ${MAX_CONTINUOUS_NOTIFICATION_LIMIT}`) && console.log(log.last);
  defaultNotificationTarget = mutationTargetEl;
  if (document && _.isFunction(document.addEventListener)) {
    DOM_EVENTS.forEach(eName => {
      document.addEventListener(eName, restartTimer, true);
    });
  }
  new MutationObserver(() => {
    restartTimer();
  }).observe(mutationTargetEl, {
    childList: true,
    subtree: true
  });
  running = true;
  startTimer();
}

export default startIdleDetector;