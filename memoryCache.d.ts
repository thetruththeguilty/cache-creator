import { ICache } from './index';
export declare class MemoryStorage {
    dict: any;
    queue: any[];
    maxCount: number;
    constructor(maxCount?: number);
    getItem(key: string): any;
    setItem(key: string, value: any): any;
}
export declare function createMemoryCache<TValue>(maxCount: number, nextLevel?: ICache<TValue>): ICache<TValue>;
export declare let memoryCache: ICache<unknown>;
