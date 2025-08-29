import type {DbVersion} from "./RecordQueryable.tsx";
import {executeSQL} from "./api.ts";

let cache: Promise<DbVersion> | undefined;

export async function getDbVersion(): Promise<DbVersion> {
    try {
        if (cache) return await cache;
    } catch (error) {
        cache = undefined;
        throw error;
    }

    cache = executeSQL({queries: [{sql: "SELECT sqlite_version()", params: []}]})
        .then(res => {
            const versionString = res.results[0].rows[0][0] as string;
            const [major, minor, patch] = versionString.split('.').map(s => parseInt(s, 10));
            return {major, minor, patch};
        })

    return cache;
}