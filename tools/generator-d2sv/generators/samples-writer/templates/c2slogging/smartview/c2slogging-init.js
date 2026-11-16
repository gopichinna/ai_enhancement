(function(){
  const {
    bootHold,
    handleError, // Call with string describing an error, for a uniform error handling during startup
    require,
    addBundleIndex, // Call to load a self bundle index.
    addExtension, // Call to load an extension configuration file.
    config
  } = sv,
    getQueryParamValue = function (paramName) {
      const result = new RegExp('\\b' + paramName + '(?!:)(?:=([^&]*))?', 'i').exec(location.search);
      return result && result[1] ? result[1].toUpperCase() : null;
    },
    logLevel = getQueryParamValue('loglevel'),
    batchSize = Number.parseInt(getQueryParamValue('logbatch'));

  require.config({
    config: {
      'nuc/utils/log': {
        level: logLevel || 'WARN',
        server: {
          url: config.connection.url + '/clientlog',
          headers: {
            'content-type': 'application/vnd.emc.documentum+json'
          },
          batchSize: ((Number.isInteger(batchSize) && batchSize > 0) ? batchSize : 20)
        }
      }
    }
  });

  addExtension('c2slogging/c2slogging-extensions.json');
  addBundleIndex(`${config.otherBundlesLocation}/c2slogging/bundles/c2slogging-index.js`);

  const promise = bootHold();
  require(['nuc/lib/log4javascript'], function(log4j){
    const JsonLayout = log4j.JsonLayout;

    function WrappedJsonLayout() {
      JsonLayout.apply(this, arguments);

      this.batchHeader = "{\"logs\": [";
      this.batchFooter = "]}";
    }

    WrappedJsonLayout.prototype = new JsonLayout();

    log4j.JsonLayout = WrappedJsonLayout;

    promise.resolve();
  });
})();
