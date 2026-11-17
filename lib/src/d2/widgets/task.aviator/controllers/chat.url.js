/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import require from "require";

export default function getChatUrl(connector) {
  const url = connector.getConnectionUrl();
  if (require.defined("ot2cm/utils/ot2cm-utils")) {
    const ot2cmUtils = require("ot2cm/utils/ot2cm-utils");
    const subscriptionPath = ot2cmUtils.getSubscriptionPath();
    const origin = url.getOrigin();
    const baseUrl = subscriptionPath ? `${origin}/${subscriptionPath}` : origin;
    return `${baseUrl}/ai/v1/chat`;
  }
  return `${url.getCgiScript()}/api/v2/ai/chat`;
}