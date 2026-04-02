const { appConfig } = require("../config");

function normalizeIp(ipValue) {
  if (!ipValue) {
    return "";
  }

  if (ipValue.startsWith("::ffff:")) {
    return ipValue.slice(7);
  }

  return ipValue;
}

function isLoopbackAddress(ipValue) {
  const ip = normalizeIp(ipValue);
  return ip === "127.0.0.1" || ip === "::1" || ip === "localhost";
}

function requireExtensionAccess(req, res, next) {
  const configuredToken = appConfig.extensionSharedToken;
  const providedToken = String(req.header("x-extension-token") || "").trim();

  if (configuredToken) {
    if (providedToken !== configuredToken) {
      return res.status(401).json({
        success: false,
        message: "Token da extensão inválido"
      });
    }

    return next();
  }

  if (!isLoopbackAddress(req.ip) && !isLoopbackAddress(req.socket?.remoteAddress)) {
    return res.status(403).json({
      success: false,
      message: "Acesso de extensão permitido apenas localmente"
    });
  }

  return next();
}

module.exports = {
  requireExtensionAccess
};
