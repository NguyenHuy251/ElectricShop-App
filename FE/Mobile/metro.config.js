const { getDefaultConfig } = require('expo/metro-config');
const fs = require('node:fs');
const path = require('node:path');

// Windows can report OneDrive placeholder files as symlinks in readdir,
// although lstat identifies them as regular files. Metro needs the latter.
if (process.platform === 'win32') {
  const originalReaddirSync = fs.readdirSync;
  fs.readdirSync = function (directory, options) {
    const entries = originalReaddirSync.apply(this, arguments);
    if (options && options.withFileTypes) {
      for (const entry of entries) {
        if (!entry.isSymbolicLink()) continue;
        try {
          const stat = fs.lstatSync(path.join(String(directory), String(entry.name)));
          if (!stat.isSymbolicLink()) {
            entry.isSymbolicLink = () => false;
            entry.isFile = () => stat.isFile();
            entry.isDirectory = () => stat.isDirectory();
          }
        } catch {}
      }
    }
    return entries;
  };
  const originalReaddir = fs.readdir;
  fs.readdir = function (directory, options, callback) {
    if (!options || typeof options !== 'object' || !options.withFileTypes || typeof callback !== 'function') {
      return originalReaddir.apply(this, arguments);
    }
    return originalReaddir.call(this, directory, options, (error, entries) => {
      if (!error) {
        for (const entry of entries) {
          if (!entry.isSymbolicLink()) continue;
          try {
            const stat = fs.lstatSync(path.join(String(directory), String(entry.name)));
            if (!stat.isSymbolicLink()) {
              entry.isSymbolicLink = () => false;
              entry.isFile = () => stat.isFile();
              entry.isDirectory = () => stat.isDirectory();
            }
          } catch { /* Let Metro handle files removed during the scan. */ }
        }
      }
      callback(error, entries);
    });
  };
}

module.exports = getDefaultConfig(__dirname);
