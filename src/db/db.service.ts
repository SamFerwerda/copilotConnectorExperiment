/** This file contains a fake DB service for testing purposes only, ideally i am switching this
 * for something like redis or cosmosdb in the future
 * */
import { Injectable } from '@nestjs/common';

@Injectable()
export class DBService {
    private db: Record<string, any> = {};

    get(key: string): any {
        return this.db[key];
    }
    
    set(key: string, value: any): void {
        this.db[key] = value;
    }
}