/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  settings
} from "i18n";

const pluralRules = new Intl.PluralRules(settings.locale);

export function getPluralMessageForCardinal(messages, messagePrefix, number) {
  const pluralForm = pluralRules.select(number);
  const message = messages[`${messagePrefix}_${pluralForm}`];
  return message ?? messages[`${messagePrefix}_other`];
}