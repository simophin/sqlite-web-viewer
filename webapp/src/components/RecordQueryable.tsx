import type { ConditionalQuery } from "../api.ts";

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

type ColumnMeta = {
    "primaryKeyPriority": number;
} | {
    "label": string;
    "value": string;
}

export interface RecordQueryable {
    mainQuery: (params: MainQueryParams) => ConditionalQuery;
    countQuery?: (params: CountQueryParams) => ConditionalQuery;
    columnMetaQuery?: {
        query: ConditionalQuery,
        parser: (rows: any[][]) => { [column: string]: ColumnMeta[] },
    };
    canFilter: boolean;
    canSort: boolean;
    canPaginate: boolean;
}



export function tableRecordQueryable(
    tableName: string,
): RecordQueryable {
    return {
        mainQuery: ({ sorting, pagination, filter }): ConditionalQuery => {
            let sql = `SELECT * FROM ${tableName}`;

            if (filter) {
                sql += ` WHERE ${filter}`;
            }

            if (sorting) {
                sql += ' ORDER BY ' +
                    sorting.map(({ name, desc }) =>
                        `${name}${desc ? 'DESC' : ''}`)
                        .join(', ');
            }

            if (pagination) {
                sql += ` LIMIT ${pagination.offset}, ${pagination.limit}`;
            }

            return { sql, params: [] };
        },

        countQuery: ({ sorting, filter }): ConditionalQuery => {
            let sql = `SELECT COUNT(*) FROM ${tableName}`;

            if (filter) {
                sql += ` WHERE ${filter}`;
            }

            if (sorting) {
                sql += ' ORDER BY ' +
                    sorting.map(({ name, desc }) =>
                        `${name}${desc ? 'DESC' : ''}`)
                        .join(', ');
            }

            return { sql, params: [] };
        },

        columnMetaQuery: {
            query: {
                sql:
                    "SELECT name, type, `notnull`, dflt_value, pk, (hidden == 2) AS is_generated FROM pragma_table_xinfo(?)",
                params: [tableName],
                conditions: {
                    "<3.26.0": {
                        sql:
                            "SELECT name, type, `notnull`, dflt_value, pk, 0 AS is_generated FROM pragma_table_info(?)",
                        params: [tableName],
                    },
                },
            },
            parser: (rows: any[][]) => {
                return rows.reduce((acc, [name, t, notnull, dflt_value, pk, is_generated]) => {
                    const primaryKeyMetas: ColumnMeta[] = [];

                    if (pk > 0) {
                        primaryKeyMetas.push({ label: "Primary key", value: "Yes" });
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
        mainQuery: (_params): ConditionalQuery => {
            return { sql, params: [] }
        },

        canFilter: false,
        canPaginate: false,
        canSort: false
    }
}