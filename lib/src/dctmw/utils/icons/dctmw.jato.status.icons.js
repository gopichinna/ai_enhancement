/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import SmartJatoStatusIcons from "smart/themes/jato.icons/smart.jato.status.icons";

import CsuiJatoStatusIcons from "csui/themes/csui.jato.status.icons";

import extStatusIcons from "dctm-ext!dctmw/utils/icons/dctmw.jato.status.icons";

const DctmwJatoStatusIcons = {
  ...CsuiJatoStatusIcons,
  ...SmartJatoStatusIcons
};

extStatusIcons?.forEach(ext => {
  Object.entries(ext).filter(([ k, _ ]) => ![ "_srcModule", "_srcNS" ].includes(k)).forEach(([ k, v ]) => {
    !DctmwJatoStatusIcons[k] && (DctmwJatoStatusIcons[k] = v);
  });
});

export default DctmwJatoStatusIcons;