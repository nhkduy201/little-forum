let os = require("os");
function getUploadPath(path) {
  let pf = os.platform();
  if(pf == 'win32') {
    return path.split("\\").slice(1).join("/");
  }
  else if(pf == 'linux') {
    return path.split("/").slice(1).join("/");
  }
}
module.exports.getUploadPath = getUploadPath;