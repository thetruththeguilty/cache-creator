"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var Hour = 3600;
var Day = 24 * Hour;
/**
 *
 * TODO: use ts
 * TODO: refactor save with ttl
 * TODO: add some test
 * TODO: cleanUp override options
 *
 * save(key, value, ttl)
 * load(key, ttl)
 * cleanUp(ttl)
 *
 * applyWith(name, func, ttl, params)
 * wrapperWithCall(name, func, ttl)
 * @param {*} storage
 * @param {*} opts
 */
function createCache(storage, opts) {
    var getter = opts.getter, setter = opts.setter;
    if (!getter || !setter) {
        throw new Error('create Cache must off getter and setter');
    }
    var timeDivider = opts.timeDivider || 1000;
    function save(key, value, ttl) {
        if (ttl === void 0) { ttl = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var currentTimestamp;
            return __generator(this, function (_a) {
                currentTimestamp = Date.now() / timeDivider | 0;
                return [2 /*return*/, setter(storage, key, { value: value, timestamp: currentTimestamp })];
            });
        });
    }
    function load(key, ttl) {
        if (ttl === void 0) { ttl = Day; }
        return __awaiter(this, void 0, void 0, function () {
            var currentTimestamp, box, timestamp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        currentTimestamp = Date.now() / timeDivider | 0;
                        return [4 /*yield*/, getter(storage, key)];
                    case 1:
                        box = _a.sent();
                        if (box) {
                            timestamp = box.timestamp || 0;
                            if (currentTimestamp - timestamp < ttl) {
                                return [2 /*return*/, box.value];
                            }
                        }
                        return [2 /*return*/, undefined];
                }
            });
        });
    }
    // callWith('fetchName', fetchName, 3000, [id, token])
    function applyWith(name, func, ttl, params) {
        return __awaiter(this, void 0, void 0, function () {
            var key, box, currentTimestamp, timestamp, value;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = JSON.stringify([name, params]);
                        return [4 /*yield*/, getter(storage, key)];
                    case 1:
                        box = _a.sent();
                        currentTimestamp = Date.now() / timeDivider | 0;
                        // call with cache
                        if (box) {
                            timestamp = box.timestamp || 0;
                            if (currentTimestamp - timestamp < ttl) {
                                // console.log('cache hit', box)
                                return [2 /*return*/, box.value];
                            }
                            // else {
                            //   console.log('cache is expired', box)
                            // }
                        }
                        return [4 /*yield*/, func.apply(null, params)
                            // do not to await setter
                        ];
                    case 2:
                        value = _a.sent();
                        // do not to await setter
                        setter(storage, key, { value: value, timestamp: currentTimestamp });
                        return [2 /*return*/, value];
                }
            });
        });
    }
    // let fetchNameWithCache = wrapperWith('fetchName', fetchName, 3000)
    // fetchNameWithCache(id, token)
    function wrapperWithCall(name, func, ttl) {
        return function () {
            var params = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                params[_i] = arguments[_i];
            }
            return applyWith(name, func, ttl, params);
        };
    }
    /**
     * cleanUp, use function from options or use iterater and delete
     * @param {number} ttl time to live
     */
    var cleanUp = opts.cleanUp || (function (ttl) {
        if (ttl === void 0) { ttl = Day; }
        return __awaiter(this, void 0, void 0, function () {
            var remover, iterater;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!opts.iterater || !opts.remover) {
                            console.warn('create cache do not offer iterater and remover function');
                            return [2 /*return*/, false];
                        }
                        else {
                            remover = opts.remover;
                            iterater = opts.iterater;
                        }
                        return [4 /*yield*/, iterater(storage, function (v, k) {
                                if (!v || !v.value || !v.timestamp) {
                                    // remove when iterater may cause error in some storage
                                    remover(storage, k);
                                }
                                else {
                                    var currentTimestamp = Date.now() / timeDivider | 0;
                                    if (currentTimestamp - v.timestamp > ttl) {
                                        remover(storage, k);
                                    }
                                }
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    });
    return {
        applyWith: applyWith, wrapperWithCall: wrapperWithCall, cleanUp: cleanUp, save: save, load: load,
    };
}
exports.createCache = createCache;
exports.default = createCache;
