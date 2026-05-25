import { promises as fs } from "fs";
import * as path from "path";

export type DatabaseCollections = "configs" | "texts" | "bans" | "notrack";

export interface ConfigDocument {
    guildId: string;
    enabled?: boolean;
    channelId?: string;
    webhook?: string | null;
    textsLimit?: number;
    collectPercentage?: number;
    sendingPercentage?: number;
    replyPercentage?: number;
}

export interface TextsDocument {
    guildId: string;
    list: string[];
    expiresAt: number;
}

export interface BansDocument {
    guildId: string;
    reason: string;
}

export interface NoTrackDocument {
    userId: string;
}

export interface DatabaseFileSchema {
    configs: Record<string, ConfigDocument>;
    texts: Record<string, TextsDocument>;
    bans: Record<string, BansDocument>;
    notrack: Record<string, NoTrackDocument>;
}

const DEFAULT_DATABASE: DatabaseFileSchema = {
    configs: {},
    texts: {},
    bans: {},
    notrack: {}
};

const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "database.json");

function queryMatchesValue(value: any, queryValue: any): boolean {
    if (queryValue && typeof queryValue === "object" && !Array.isArray(queryValue)) {
        if (queryValue.$lte !== undefined) {
            return value <= queryValue.$lte;
        }

        if (queryValue.$regex !== undefined) {
            const flags = typeof queryValue.$options === "string" ? queryValue.$options : "";
            const regex = new RegExp(queryValue.$regex, flags);
            return typeof value === "string" && regex.test(value);
        }

        if (queryValue.$ne !== undefined) {
            return value !== queryValue.$ne;
        }

        return JSON.stringify(value) === JSON.stringify(queryValue);
    }

    return value === queryValue;
}

function getNestedValue(document: any, key: string): any {
    return key.split(".").reduce((current, property) => {
        if (current == null) return undefined;
        return current[property];
    }, document);
}

function applyProjection(document: any, projection?: string | string[]): any {
    if (!projection) {
        return document;
    }

    const fields = Array.isArray(projection)
        ? projection
        : projection.split(" ").filter(Boolean);

    const result: any = {};
    for (const field of fields) {
        if (field in document) {
            result[field] = document[field];
        }
    }

    return result;
}

function getKeyFromDocument(collection: DatabaseCollections, document: any): string | undefined {
    if (collection === "notrack") {
        return document.userId;
    }

    return document.guildId;
}

function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
}

export default class FileDatabase {
    private static dbPath = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : DEFAULT_DB_PATH;

    public static async connect(pathOverride?: string): Promise<void> {
        if (pathOverride) {
            this.dbPath = path.resolve(pathOverride);
        }

        await this.ensureFile();
    }

    private static async ensureFile(): Promise<void> {
        const directory = path.dirname(this.dbPath);
        await fs.mkdir(directory, { recursive: true });

        try {
            await fs.access(this.dbPath);
        } catch {
            await fs.writeFile(this.dbPath, JSON.stringify(DEFAULT_DATABASE, null, 2), "utf8");
        }
    }

    private static async readDatabase(): Promise<DatabaseFileSchema> {
        await this.ensureFile();
        const content = await fs.readFile(this.dbPath, "utf8");
        try {
            const parsed = JSON.parse(content);
            return {
                configs: parsed.configs ?? {},
                texts: parsed.texts ?? {},
                bans: parsed.bans ?? {},
                notrack: parsed.notrack ?? {}
            };
        } catch {
            return clone(DEFAULT_DATABASE);
        }
    }

    private static async writeDatabase(data: DatabaseFileSchema): Promise<void> {
        await fs.writeFile(this.dbPath, JSON.stringify(data, null, 2), "utf8");
    }

    private static findMatches(collection: Record<string, any>, query: any): Array<[string, any]> {
        return Object.entries(collection).filter(([_, document]) => {
            for (const [key, value] of Object.entries(query)) {
                const documentValue = getNestedValue(document, key);
                if (!queryMatchesValue(documentValue, value)) {
                    return false;
                }
            }
            return true;
        });
    }

    private static createDocument(collection: DatabaseCollections, query: any, update?: any): any {
        const document = { ...query, ...update };
        const key = getKeyFromDocument(collection, document);
        if (key) {
            return document;
        }

        return { ...query, ...update };
    }

    private static applyUpdate(document: any, update: any, arrayFilters?: any[]): void {
        if (!update || typeof update !== "object") {
            Object.assign(document, update);
            return;
        }

        if (update.$set) {
            for (const [pathKey, value] of Object.entries(update.$set)) {
                if (pathKey.includes(".$[")) {
                    const [arrayPath, placeholder] = pathKey.split(".$[");
                    const arrayKey = arrayPath;
                    const filterValue = arrayFilters?.[0]?.element;
                    const array = getNestedValue(document, arrayKey);

                    if (Array.isArray(array) && filterValue !== undefined) {
                        for (let index = 0; index < array.length; index++) {
                            if (array[index] === filterValue) {
                                array[index] = value;
                            }
                        }
                    }
                } else {
                    const pathParts = pathKey.split(".");
                    let target = document;
                    for (let i = 0; i < pathParts.length - 1; i++) {
                        if (!target[pathParts[i]]) {
                            target[pathParts[i]] = {};
                        }
                        target = target[pathParts[i]];
                    }
                    target[pathParts[pathParts.length - 1]] = value;
                }
            }
        }

        if (update.$push) {
            for (const [key, value] of Object.entries(update.$push)) {
                const array = getNestedValue(document, key) || [];
                if (!Array.isArray(array)) {
                    continue;
                }

                const valueAny = value as any;
                if (valueAny && typeof valueAny === "object" && Array.isArray(valueAny.$each)) {
                    const items = valueAny.$each;
                    array.push(...items);
                    if (typeof valueAny.$slice === "number") {
                        const slice = Math.abs(valueAny.$slice);
                        if (slice < array.length) {
                            document[key] = array.slice(-slice);
                        }
                    }
                } else {
                    array.push(value);
                }

                document[key] = array;
            }
        }

        if (update.$pop) {
            for (const [key, value] of Object.entries(update.$pop)) {
                const array = getNestedValue(document, key);
                if (!Array.isArray(array)) {
                    continue;
                }

                if (value === -1) {
                    array.shift();
                } else if (value === 1) {
                    array.pop();
                }

                document[key] = array;
            }
        }

        if (update.$pull) {
            for (const [key, value] of Object.entries(update.$pull)) {
                const array = getNestedValue(document, key);
                if (!Array.isArray(array)) {
                    continue;
                }

                const valueAny = value as any;
                if (valueAny && typeof valueAny === "object" && valueAny.$regex !== undefined) {
                    const flags = typeof valueAny.$options === "string" ? valueAny.$options : "";
                    const regex = new RegExp(valueAny.$regex, flags);
                    document[key] = array.filter((item) => typeof item === "string" ? !regex.test(item) : item !== value);
                } else {
                    document[key] = array.filter((item) => item !== value);
                }
            }
        }
    }

    public static findOne(collection: DatabaseCollections, query: any, projection?: string | string[]) {
        return {
            exec: async () => {
                const database = await this.readDatabase();
                const items = this.findMatches(database[collection], query);

                if (!items.length) {
                    return null;
                }

                const [, document] = items[0];
                return applyProjection(clone(document), projection);
            }
        };
    }

    public static find(collection: DatabaseCollections, query: any) {
        return {
            exec: async () => {
                const database = await this.readDatabase();
                const items = this.findMatches(database[collection], query);
                return items.map(([, document]) => clone(document));
            }
        };
    }

    public static exists(collection: DatabaseCollections, query: any) {
        return {
            exec: async () => {
                const database = await this.readDatabase();
                const items = this.findMatches(database[collection], query);
                return items.length > 0;
            }
        };
    }

    public static async create(collection: DatabaseCollections, document: any) {
        const database = await this.readDatabase();
        const key = getKeyFromDocument(collection, document) ?? String(Date.now());
        database[collection][key] = { ...document, guildId: document.guildId ?? undefined };
        await this.writeDatabase(database);
        return clone(database[collection][key]);
    }

    public static deleteOne(collection: DatabaseCollections, query: any) {
        return {
            exec: async () => {
                const database = await this.readDatabase();
                const match = this.findMatches(database[collection], query)[0];

                if (!match) {
                    return { deletedCount: 0 };
                }

                const [key] = match;
                delete database[collection][key];
                await this.writeDatabase(database);
                return { deletedCount: 1 };
            }
        };
    }

    public static deleteMany(collection: DatabaseCollections, query: any) {
        return {
            exec: async () => {
                const database = await this.readDatabase();
                const matches = this.findMatches(database[collection], query);

                for (const [key] of matches) {
                    delete database[collection][key];
                }

                await this.writeDatabase(database);
                return { deletedCount: matches.length };
            }
        };
    }

    public static updateOne(collection: DatabaseCollections, query: any, update: any, options: any = {}) {
        return {
            exec: async () => {
                const database = await this.readDatabase();
                const matches = this.findMatches(database[collection], query);
                let document: any;
                let existingKey: string | undefined;

                if (matches.length) {
                    [existingKey, document] = matches[0];
                }

                if (!document && options.upsert) {
                    document = this.createDocument(collection, query, {});
                    existingKey = getKeyFromDocument(collection, document);
                    if (!existingKey) {
                        existingKey = String(Date.now());
                    }
                    database[collection][existingKey] = document;
                }

                if (!document) {
                    return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
                }

                this.applyUpdate(document, update, options.arrayFilters);
                if (existingKey) {
                    database[collection][existingKey] = document;
                }

                await this.writeDatabase(database);
                return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
            }
        };
    }

    public static findOneAndUpdate(collection: DatabaseCollections, query: any, update: any, options: any = {}) {
        return {
            exec: async () => {
                const database = await this.readDatabase();
                const matches = this.findMatches(database[collection], query);
                let document: any;
                let existingKey: string | undefined;

                if (matches.length) {
                    [existingKey, document] = matches[0];
                }

                if (!document && options.upsert) {
                    document = this.createDocument(collection, query, {});
                    existingKey = getKeyFromDocument(collection, document) || String(Date.now());
                    database[collection][existingKey] = document;
                }

                if (!document) {
                    return null;
                }

                const original = clone(document);
                this.applyUpdate(document, update, options.arrayFilters);
                if (existingKey) {
                    database[collection][existingKey] = document;
                }

                await this.writeDatabase(database);
                return options.new ? clone(document) : original;
            }
        };
    }
}
