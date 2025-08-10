import type {ConditionalQuery} from "../api.ts";

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

export interface RecordQueryable {
    mainQuery: (params: MainQueryParams) => ConditionalQuery;
    countQuery?: (params: CountQueryParams) => ConditionalQuery;
    canFilter: boolean;
    canSort: boolean;
    canPaginate: boolean;
}

export function tableRecordQueryable(
    tableName: string,
): RecordQueryable {
    return {
        mainQuery: ({sorting, pagination, filter}): ConditionalQuery => {
            let sql = `SELECT * FROM ${tableName}`;

            if (filter) {
                sql += ` WHERE ${filter}`;
            }

            if (sorting) {
                sql += ' ORDER BY ' +
                    sorting.map(({name, desc}) =>
                        `${name}${desc ? 'DESC' : ''}`)
                        .join(', ');
            }

            if (pagination) {
                sql += ` LIMIT ${pagination.offset}, ${pagination.limit}`;
            }

            return {sql, params: []};
        },

        countQuery: ({sorting, filter}): ConditionalQuery => {
            let sql = `SELECT COUNT(*) FROM ${tableName}`;

            if (filter) {
                sql += ` WHERE ${filter}`;
            }

            if (sorting) {
                sql += ' ORDER BY ' +
                    sorting.map(({name, desc}) =>
                        `${name}${desc ? 'DESC' : ''}`)
                        .join(', ');
            }

            return {sql, params: []};
        },

        canFilter: true,
        canSort: true,
        canPaginate: true,
    }
}

export function rawSqlQueryable(sql: string): RecordQueryable {
    return {
        mainQuery: (_params): ConditionalQuery => {
            return {sql, params: []}
        },

        canFilter: false,
        canPaginate: false,
        canSort: false
    }
}