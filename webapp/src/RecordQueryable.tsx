import type { Query } from "./api.ts";

export type Sorting = { name: string; desc?: boolean }[];
export type Pagination = {
    offset: number;
    limit: number;
}

type MainQueryParams = {
    sorting?: Sorting;
    pagination?: Pagination;
    filter?: string;
}

type CountQueryParams = {
    sorting?: Sorting;
    filter?: string;
}

export type ColumnMeta = {
    "primaryKeyPriority": number;
} | {
    "label": string;
    "value": string;
}

export interface RecordQueryable {
    mainQuery: (params: MainQueryParams) => Query;
    countQuery?: (params: CountQueryParams) => Query;
    columnMetaQuery?: {
        query: Query,
        parser: (rows: any[][]) => { [column: string]: ColumnMeta[] },
    };
    canFilter: boolean;
    canSort: boolean;
    canPaginate: boolean;
}

export type DbVersion = {
    major: number;
    minor: number;
    patch: number;
}

export function tableRecordQueryable(
    tableName: string,
    dbVersion: DbVersion,
): RecordQueryable {
    return {
        mainQuery: ({ sorting, pagination, filter }): Query => {
            let sql = `SELECT * FROM ${tableName}`;

            if (filter) {
                sql += ` WHERE ${filter}`;
            }

            if (sorting && sorting.length > 0) {
                sql += ' ORDER BY ' +
                    sorting.map(({ name, desc }) =>
                        `${name}${desc ? ' DESC' : ''}`)
                        .join(', ');
            }

            if (pagination) {
                sql += ` LIMIT ${pagination.offset}, ${pagination.limit}`;
            }

            return { sql, params: [] };
        },

        countQuery: ({ sorting, filter }): Query => {
            let sql = `SELECT COUNT(*) FROM ${tableName}`;

            if (filter) {
                sql += ` WHERE ${filter}`;
            }

            if (sorting && sorting.length > 0) {
                sql += ' ORDER BY ' +
                    sorting.map(({ name, desc }) =>
                        `${name}${desc ? ' DESC' : ''}`)
                        .join(', ');
            }

            return { sql, params: [] };
        },

        columnMetaQuery: {
            query: {
                sql:
                    (dbVersion.major >= 3 && dbVersion.minor >= 26)
                        ? "SELECT name, type, `notnull`, dflt_value, pk, (hidden == 2) AS is_generated FROM pragma_table_xinfo(?)"
                        : "SELECT name, type, `notnull`, dflt_value, pk, 0 AS is_generated FROM pragma_table_info(?)",
                params: [tableName],
            },
            parser: (rows: any[][]) => {
                return rows.reduce((acc, [name, t, notnull, dflt_value, pk, is_generated]) => {
                    const primaryKeyMetas: ColumnMeta[] = [];

                    if (pk > 0) {
                        primaryKeyMetas.push({ primaryKeyPriority: pk });
                    }

                    return {
                        ...acc,
                        [name]: [
                            ...primaryKeyMetas,
                            ...[
                                { label: "Data type", value: t.toString() },
                                { label: "Not null", value: notnull ? "Yes" : "No" },
                                { label: "Default value", value: dflt_value ? dflt_value.toString() : "None" },
                                { label: "Generated column", value: is_generated ? "Yes" : "No" }
                            ]
                        ]
                    };
                }, {});
            }
        },

        canFilter: true,
        canSort: true,
        canPaginate: true,
    }
}

export function rawSqlQueryable(sql: string): RecordQueryable {
    return {
        mainQuery: (params): Query => {
            let s = `WITH _my_table AS (${sql}) SELECT * FROM _my_table`;

            if (params.pagination) {
                s += ` LIMIT ${params.pagination.offset}, ${params.pagination.limit}`;
            }

            return { 
                sql: s,
                params: [] 
            }
        },

        countQuery: (_params): Query => {
            let s = `WITH _my_table AS (${sql}) SELECT COUNT(*) FROM _my_table`;

            return {
                sql: s,
                params: []
            }
        },

        canFilter: false,
        canPaginate: true,
        canSort: false
    }
}