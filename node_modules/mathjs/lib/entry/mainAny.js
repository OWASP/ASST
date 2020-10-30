"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  config: true,
  IndexError: true,
  DimensionError: true,
  ArgumentsError: true,
  create: true,
  factory: true
};
Object.defineProperty(exports, "config", {
  enumerable: true,
  get: function get() {
    return _configReadonly.config;
  }
});
Object.defineProperty(exports, "IndexError", {
  enumerable: true,
  get: function get() {
    return _IndexError.IndexError;
  }
});
Object.defineProperty(exports, "DimensionError", {
  enumerable: true,
  get: function get() {
    return _DimensionError.DimensionError;
  }
});
Object.defineProperty(exports, "ArgumentsError", {
  enumerable: true,
  get: function get() {
    return _ArgumentsError.ArgumentsError;
  }
});
Object.defineProperty(exports, "create", {
  enumerable: true,
  get: function get() {
    return _create.create;
  }
});
Object.defineProperty(exports, "factory", {
  enumerable: true,
  get: function get() {
    return _factory.factory;
  }
});

var _configReadonly = require("./configReadonly");

var _pureFunctionsAny = require("./pureFunctionsAny.generated");

Object.keys(_pureFunctionsAny).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _pureFunctionsAny[key];
    }
  });
});

var _impureFunctionsAny = require("./impureFunctionsAny.generated");

Object.keys(_impureFunctionsAny).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _impureFunctionsAny[key];
    }
  });
});

var _typeChecks = require("./typeChecks");

Object.keys(_typeChecks).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _typeChecks[key];
    }
  });
});

var _IndexError = require("../error/IndexError");

var _DimensionError = require("../error/DimensionError");

var _ArgumentsError = require("../error/ArgumentsError");

var _dependenciesAny = require("./dependenciesAny.generated");

Object.keys(_dependenciesAny).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _dependenciesAny[key];
    }
  });
});

var _factoriesAny = require("../factoriesAny");

Object.keys(_factoriesAny).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _factoriesAny[key];
    }
  });
});

var _create = require("../core/create");

var _factory = require("../utils/factory");

var _deprecatedAny = require("./deprecatedAny");

Object.keys(_deprecatedAny).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _deprecatedAny[key];
    }
  });
});

exports['var'] = exports.deprecatedVar;
exports['typeof'] = exports.deprecatedTypeof;
exports['eval'] = exports.deprecatedEval;
exports['import'] = exports.deprecatedImport;
