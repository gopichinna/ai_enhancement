/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import csuiNodeSprites from "csui/utils/nodesprites";

import extSpriteRules from "dctm-ext!dctmw/utils/node.icon.sprites";

if (extSpriteRules) {
  csuiNodeSprites.add(_.flatten(extSpriteRules, true));
}

export default csuiNodeSprites;