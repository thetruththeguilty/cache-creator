export declare class MemoryStorage {
    dict: any;
    queue: any[];
    maxCount: number;
    constructor(maxCount?: number);
    getItem(key: string): any;
    setItem(key: string, value: any): any;
}
export declare function createMemoryCache(maxCount: number): {
    applyWith: (name: string, func: Function, ttl: number, params: any[]) => Promise<any>;
    wrapperWithCall: (name: string, func: Function, ttl: number) => (...params: any[]) => Promise<any>;
    cleanUp: (ttl: number) => Promise<boolean>;
    save: (key: string, value: any, ttl?: number) => Promise<import(".").IValueWrapper<any>>;
    load: (key: string, ttl?: number) => Promise<any>;
};
export declare let memoryCache: {
    applyWith: (name: string, func: Function, ttl: number, params: any[]) => Promise<any>;
    wrapperWithCall: (name: string, func: Function, ttl: number) => (...params: any[]) => Promise<any>;
    cleanUp: (ttl: number) => Promise<boolean>;
    save: (key: string, value: any, ttl?: number) => Promise<import(".").IValueWrapper<any>>;
    load: (key: string, ttl?: number) => Promise<any>;
};
