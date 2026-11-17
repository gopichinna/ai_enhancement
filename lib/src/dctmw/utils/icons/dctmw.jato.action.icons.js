/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import SmartJatoActionIcons from "smart/themes/jato.icons/smart.jato.action.icons";

import CsuiJatoActionIcons from "csui/themes/csui.jato.action.icons";

import extActionIcons from "dctm-ext!dctmw/utils/icons/dctmw.jato.action.icons";

const DctmwJatoActionIcons = {
  ...CsuiJatoActionIcons,
  ...SmartJatoActionIcons
};

extActionIcons?.forEach(ext => {
  Object.entries(ext).filter(([ k, _ ]) => ![ "_srcModule", "_srcNS" ].includes(k)).forEach(([ k, v ]) => {
    !DctmwJatoActionIcons[k] && (DctmwJatoActionIcons[k] = v);
  });
});

export default DctmwJatoActionIcons;