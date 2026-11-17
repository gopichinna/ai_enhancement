const fs = require('fs-extra'),
  path = require('path'),
  node_modules_location = '../../../../../node_modules',
  libLocaton = '../../../../../lib';

ensureDirectoryLink(node_modules_location, 'node_modules');  
ensureDirectoryLink(libLocaton, 'lib');

function ensureDirectoryLink(source, target) {
  console.debug(`Ensuring sym-link ${source} => ${target}`);
  try {
    try {
      const stat = fs.lstatSync(target);
      if (stat.isSymbolicLink()) {
        return; // Already a valid link
      }
      // If it exists as a normal file or directory, remove so junction can be created
      fs.removeSync(target);
    } catch (e) {
      // Does not exist yet, proceed
    }

    const resolvedSource = path.resolve(__dirname, source);
    fs.ensureSymlinkSync(resolvedSource, target, 'junction');
  } catch (err) {
    if (err.code !== 'EEXIST') {
      console.warn(`Notice for ${target}: ${err.message}`);
    }
  }
}

