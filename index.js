"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Hour = 3600;
const Day = 24 * Hour;
/**
 *
 * TODO: opts: key generator,
 * in case of some storage do not support some charactor in key string
 *
 * TODO: refacto this with a plugin style
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
    let { getter, setter } = opts;
    if (!getter || !setter) {
        throw new Error('create Cache must off getter and setter');
    }
    let timeDivider = opts.timeDivider || 1000;
    let nextLevel = opts.nextLevel;
    function save(key, value, ttl = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            let currentTimestamp = Date.now() / timeDivider | 0;
            // set to next level as a copy
            if (nextLevel) {
                nextLevel.save(key, value, ttl);
            }
            return setter(storage, key, { value, timestamp: currentTimestamp }, ttl);
        });
    }
    function load(key, ttl = Day) {
        return __awaiter(this, void 0, void 0, function* () {
            let currentTimestamp = Date.now() / timeDivider | 0;
            let box = yield getter(storage, key);
            if (box) { // get the box
                let timestamp = box.timestamp || 0;
                if (currentTimestamp - timestamp < ttl) { // in time
                    return box.value;
                }
                else if (opts.onTimeout) {
                    opts.onTimeout(storage, key, box);
                }
            }
            else if (nextLevel) { // cache miss, not timeout
                let ret = yield nextLevel.load(key, ttl);
                if (ret) {
                    save(key, ret, ttl);
                    return ret;
                }
            }
            return undefined;
        });
    }
    // callWith('fetchName', fetchName, 3000, [id, token])
    function applyWith(name, func, ttl, params) {
        return __awaiter(this, void 0, void 0, function* () {
            let key = JSON.stringify([name, params]);
            let box = yield getter(storage, key);
            let currentTimestamp = Date.now() / timeDivider | 0;
            // call with cache
            if (box) {
                let timestamp = box.timestamp || 0;
                if (currentTimestamp - timestamp < ttl) {
                    // console.log('cache hit', box)
                    return box.value;
                }
                // else {
                //   console.log('cache is expired', box)
                // }
            }
            let value = yield func.apply(null, params);
            // do not to await setter
            setter(storage, key, { value, timestamp: currentTimestamp });
            return value;
        });
    }
    // let fetchNameWithCache = wrapperWith('fetchName', fetchName, 3000)
    // fetchNameWithCache(id, token)
    function wrapperWithCall(name, func, ttl) {
        return function (...params) {
            return applyWith(name, func, ttl, params);
        };
    }
    /**
     * cleanUp, use function from options or use iterater and delete
     * @param {number} ttl time to live
     */
    let cleanUp = opts.overrideCleanUp || (function (ttl = Day) {
        return __awaiter(this, void 0, void 0, function* () {
            let remover;
            let iterater;
            if (!opts.iterater || !opts.remover) {
                console.warn('create cache do not offer iterater and remover function, and this cleanup is skipped');
                return false;
            }
            else {
                remover = opts.remover;
                iterater = opts.iterater;
            }
            yield iterater(storage, (v, k) => {
                // remove when iterater may cause error in some storage
                if (!v || !v.value || !v.timestamp) {
                    remover(storage, k);
                }
                else {
                    let currentTimestamp = Date.now() / timeDivider | 0;
                    if (currentTimestamp - v.timestamp > ttl) {
                        remover(storage, k);
                    }
                }
            });
            return true;
        });
    });
    return {
        applyWith, wrapperWithCall, cleanUp, save, load, of: wrapperWithCall,
        timeDivider: function () {
            return timeDivider;
        }
    };
}
exports.createCache = createCache;
exports.default = createCache;
