import useLocalStorage from "./useLocalStorage";

export type LocalQueryHistory = {
    [name: string]: {
        history: [query: string, args: string[]];
    }
};

export function useLocalQueryHistory() {
    return useLocalStorage<LocalQueryHistory>('query_history', {});
}