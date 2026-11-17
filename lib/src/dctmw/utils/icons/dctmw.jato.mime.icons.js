/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import CsuiJatoMimeIcons from "csui/themes/csui.jato.mime.icons";

import extMimeIcons from "dctm-ext!dctmw/utils/icons/dctmw.jato.mime.icons";

const DctmJatoMimeIcons = {
  ...CsuiJatoMimeIcons
};

extMimeIcons?.forEach(ext => {
  Object.entries(ext).filter(([ k, _ ]) => ![ "_srcModule", "_srcNS" ].includes(k)).forEach(([ k, v ]) => {
    !DctmJatoMimeIcons[k] && (DctmJatoMimeIcons[k] = v);
  });
});

export default DctmJatoMimeIcons;