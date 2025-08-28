import './PaginationBar.css';
import { FaSolidAngleLeft, FaSolidAngleRight, FaSolidRotateRight } from "solid-icons/fa";
import type { Pagination } from "../RecordQueryable.tsx";
import { Show } from 'solid-js';

export function PaginationBar(props: {
    pagination?: Pagination,
    setPagination?: (pagination: Pagination) => void,
    totalItemCount?: number,
    onRefresh: () => void,
    refreshing: boolean
}) {
    const hasPreviousPage = () => {
        return props.pagination && props.pagination.offset > 0;
    };

    const hasNextPage = () => {
        return props.pagination &&
            props.totalItemCount &&
            props.pagination.offset + props.pagination.limit < (props.totalItemCount || 0);
    };

    const rangeLabel = () => {
        if (props.pagination && props.totalItemCount) {
            const start = props.pagination.offset + 1;
            const end = Math.min(props.pagination.offset + props.pagination.limit, props.totalItemCount);
            return <label>{start}-{end} of {props.totalItemCount}</label>;
        }
    };

    return <div class="flex pagination-bar items-center gap-1">
        <Show when={!props.refreshing}>
            <span role="button">
                <FaSolidRotateRight
                    aria-label="Refresh"
                    onclick={props.onRefresh} />

            </span>
        </Show>
        <Show when={props.refreshing}>
            <span class="loading loading-dots loading-xs m-1"></span>
        </Show>

        <span aria-disabled={!hasPreviousPage()} role="button">
            <FaSolidAngleLeft
                onclick={() => {
                    if (hasPreviousPage()) {
                        props.setPagination!({
                            ...props.pagination!,
                            offset: Math.max(0, props.pagination!.offset - props.pagination!.limit)
                        });
                    }
                }} />
        </span>

        {rangeLabel()}

        <span role="button">
            <FaSolidAngleRight
                aria-label="Next Page"
                onclick={() => {
                    if (hasNextPage()) {
                        props.setPagination!({
                            ...props.pagination!,
                            offset: Math.min(props.totalItemCount || 0, props.pagination!.offset + props.pagination!.limit)
                        });
                    }
                }} />
        </span>
    </div>
}