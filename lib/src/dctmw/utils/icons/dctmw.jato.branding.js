/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import extBrandingIcons from "dctm-ext!dctmw/utils/icons/dctmw.jato.branding";

const DctmwJatoStatusIcons = {};

extBrandingIcons?.forEach(ext => {
  Object.entries(ext).filter(([ k, _ ]) => ![ "_srcModule", "_srcNS" ].includes(k)).forEach(([ k, v ]) => {
    !DctmwJatoStatusIcons[k] && (DctmwJatoStatusIcons[k] = v);
  });
});

export default DctmwJatoStatusIcons;