export declare class MemoryStorage {
    dict: any;
    queue: any[];
    maxCount: number;
    constructor(maxCount?: number);
    getItem(key: string): any;
    setItem(key: string, value: any): any;
}
export declare function createMemoryCache(maxCount: number): import(".").ICache<any>;
export declare let memoryCache: import(".").ICache<any>;
