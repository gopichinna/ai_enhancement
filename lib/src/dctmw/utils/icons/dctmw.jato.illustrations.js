/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import SmartJatoIllustrations from "smart/themes/jato.icons/smart.jato.illustrations";

import CsuiJatoIllustrations from "csui/themes/csui.jato.mime.illustrations";

import extIllustrations from "dctm-ext!dctmw/utils/icons/dctmw.jato.illustrations";

const DctmwJatoIllustrations = {
  ...CsuiJatoIllustrations,
  ...SmartJatoIllustrations
};

extIllustrations?.forEach(ext => {
  Object.entries(ext).filter(([ k, _ ]) => ![ "_srcModule", "_srcNS" ].includes(k)).forEach(([ k, v ]) => {
    !DctmwJatoIllustrations[k] && (DctmwJatoIllustrations[k] = v);
  });
});

export default DctmwJatoIllustrations;