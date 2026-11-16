'use strict';

module.exports = function (config) {
  const
    {setConfig, isDebugMode} = require('@dctm/dctm-web-core/test/karma.base.conf'),
    isDebug = isDebugMode(config),
    {dctmKarmaConf={}} = config;

  config.dctmKarmaConf = dctmKarmaConf;
  setConfig(config);
};
