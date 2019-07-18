export interface IValueWrapper<TValue> {
    /**
     * value, in the fromat you want
     */
    value: TValue;
    /**
     * timestamp, when the value is insert or update
     */
    timestamp: number;
    ttl?: number;
}
export interface IOptions<TStorage, TValue> {
    timeDivider?: number;
    getter: (storage: TStorage, key: string) => Promise<IValueWrapper<TValue>>;
    setter: (storage: TStorage, key: string, valueWrapper: IValueWrapper<TValue>) => Promise<IValueWrapper<TValue>>;
    remover?: (storage: TStorage, key: string) => any;
    iterater?: (storage: TStorage, cb: (v: IValueWrapper<TValue>, key: string) => void) => void;
    cleanUp?: (ttl: number) => Promise<boolean>;
}
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
export declare function createCache<TStorage, TValue>(storage: TStorage, opts: IOptions<TStorage, TValue>): {
    applyWith: (name: string, func: Function, ttl: number, params: any[]) => Promise<any>;
    wrapperWithCall: (name: string, func: Function, ttl: number) => (...params: any[]) => Promise<any>;
    cleanUp: (ttl: number) => Promise<boolean>;
    save: (key: string, value: TValue, ttl?: number) => Promise<IValueWrapper<TValue>>;
    load: (key: string, ttl?: number) => Promise<TValue | undefined>;
};
export default createCache;
