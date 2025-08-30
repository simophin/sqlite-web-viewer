import {type Accessor, createSignal, onCleanup} from "solid-js";

export function useSystemDarkTheme(): Accessor<boolean> {
    const query = '(prefers-color-scheme: dark)';
    const [systemDarkTheme, setSystemDarkTheme] = createSignal(
        window?.matchMedia?.(query)?.matches == true
    );

    let listener = (e: MediaQueryListEvent) => {
        setSystemDarkTheme(e.matches);
    };

    window?.matchMedia?.(query)?.addEventListener('change', listener);

    onCleanup(() => {
        window?.matchMedia?.(query)?.removeEventListener('change', listener);
    });

    return systemDarkTheme;
}