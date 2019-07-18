export interface IValueWrapper<TValue> {
    /**
     * value, in the fromat you want
     */
    value: TValue;
    /**
     * timestamp, when the value is insert or update
     */
    timestamp: number;
}
export interface IOptions<TStorage, TValue> {
    /**
     * timestamp = currentTime / timeDivider
     */
    timeDivider?: number;
    /**
     * this option can override the combined cleanUp function
     */
    overrideCleanUp?: (ttl: number) => Promise<boolean>;
    getter: (storage: TStorage, key: string) => Promise<IValueWrapper<TValue>>;
    setter: (storage: TStorage, key: string, valueWrapper: IValueWrapper<TValue>, ttl?: number) => Promise<IValueWrapper<TValue>>;
    remover?: (storage: TStorage, key: string) => any;
    iterater?: (storage: TStorage, cb: (v: IValueWrapper<TValue>, key: string) => void) => void;
}
/**
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
