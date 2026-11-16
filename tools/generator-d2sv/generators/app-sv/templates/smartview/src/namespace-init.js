(function(){
  const {
    bootHold,
    handleError, // Call with string describing an error, for a uniform error handling during startup
    require,
    addBundleIndex, // Call to load a self bundle index.
    addExtension, // Call to load an extension configuration file.
    config
  } = sv;

  // CAUTION: keep usage of this file limited to configuration only.
  // Trying to load/use modules other than 'nuc/lib/underscore' & 'nuc/lib/jquery'
  // in this init script, may in turn pull other modules creating undesired side effects and may
  // endup interferring with overall application behavior.

  const promise = bootHold(); //Ask the framework to hold startup until this promise is settled.

  require.config({
    //TODO: RequireJS module configurations used by this plugin's source code.
  });

  addExtension('<%= namespace %>/<%= namespace %>-extensions.json');
  addBundleIndex(`${config.otherBundlesLocation}/<%= namespace %>/bundles/<%= namespace %>-index.js`);

  promise.resolve(); //Let the framework continue with startup.
})();
