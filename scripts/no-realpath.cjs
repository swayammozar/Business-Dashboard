const fs = require("fs");

const realpathSync = fs.realpathSync.bind(fs);
const realpathNative = fs.realpathSync.native?.bind(fs);
const realpathAsync = fs.promises?.realpath?.bind(fs.promises);

function shouldBypass(error, path) {
  return error?.code === "EPERM" && String(path).toLowerCase().startsWith("c:\\users\\swaya");
}

function fallback(path) {
  return String(path);
}

fs.realpathSync = (path, options) => {
  try {
    return realpathSync(path, options);
  } catch (error) {
    if (shouldBypass(error, path)) return fallback(path);
    throw error;
  }
};

fs.realpathSync.native = (path, options) => {
  try {
    return realpathNative ? realpathNative(path, options) : realpathSync(path, options);
  } catch (error) {
    if (shouldBypass(error, path)) return fallback(path);
    throw error;
  }
};

if (realpathAsync) {
  fs.promises.realpath = async (path, options) => {
    try {
      return await realpathAsync(path, options);
    } catch (error) {
      if (shouldBypass(error, path)) return fallback(path);
      throw error;
    }
  };
}
