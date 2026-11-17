/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import extEmoticons from "dctm-ext!dctmw/utils/icons/dctmw.jato.emoticons";

const DctmwJatoEmoticons = {};

extEmoticons?.forEach(ext => {
  Object.entries(ext).filter(([ k, _ ]) => ![ "_srcModule", "_srcNS" ].includes(k)).forEach(([ k, v ]) => {
    !DctmwJatoEmoticons[k] && (DctmwJatoEmoticons[k] = v);
  });
});

export default DctmwJatoEmoticons;