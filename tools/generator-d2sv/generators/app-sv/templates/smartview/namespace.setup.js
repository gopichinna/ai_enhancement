const fs = require('fs-extra'),
  node_modules_location = '../../../<%= relativeWorkspacePath %>/node_modules',
  libLocaton = '../../../<%= relativeWorkspacePath %>/lib';

ensureDirectoryLink(node_modules_location, 'node_modules');  
ensureDirectoryLink(libLocaton, 'lib');

function ensureDirectoryLink(source, target) {
  console.debug(`Ensuring sym-link ${source} => ${target}`);
  fs.ensureSymlink(source, target, 'junction');
}
