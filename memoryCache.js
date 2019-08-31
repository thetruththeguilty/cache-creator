"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("./index"));
class MemoryStorage {
    constructor(maxCount = 200) {
        this.dict = {};
        this.queue = [];
        this.maxCount = maxCount;
    }
    getItem(key) { return this.dict[key]; }
    setItem(key, value) {
        if (this.queue.length > this.maxCount) {
            let deleteKey = this.queue.shift();
            delete this.dict[deleteKey];
        }
        this.dict[key] = value;
        return value;
    }
}
exports.MemoryStorage = MemoryStorage;
function createMemoryCache(maxCount, nextLevel) {
    return index_1.default(new MemoryStorage(maxCount), {
        getter: (storage, key) => __awaiter(this, void 0, void 0, function* () { return storage.getItem(key); }),
        setter: (storage, key, value) => __awaiter(this, void 0, void 0, function* () { return storage.setItem(key, value); }),
        nextLevel: nextLevel,
    });
}
exports.createMemoryCache = createMemoryCache;
exports.memoryCache = createMemoryCache(500);
