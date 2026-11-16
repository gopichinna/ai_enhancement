const fs = require('fs-extra'),
  node_modules_location = '../../../../../node_modules',
  libLocaton = '../../../../../lib';

ensureDirectoryLink(node_modules_location, 'node_modules');  
ensureDirectoryLink(libLocaton, 'lib');

function ensureDirectoryLink(source, target) {
  console.debug(`Ensuring sym-link ${source} => ${target}`);
  fs.ensureSymlink(source, target, 'junction');
}
