import {type Accessor, createSignal, onCleanup} from 'solid-js';

export function useDarkTheme(): [Accessor<boolean>, (dark: boolean) => void]{
    const htmlElement = document.documentElement;

    // Create a signal to hold the theme state
    const [isDark, setIsDark] = createSignal(
        htmlElement.getAttribute("data-theme") === 'dark'
    );

    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                setIsDark(htmlElement.getAttribute('data-theme') === 'dark');
            }
        }
    });

    observer.observe(htmlElement, {attributes: true});
    // Clean up the listener when the component is unmounted
    onCleanup(() => {
        observer.disconnect();
    });

    return [
        isDark,
        (isDark: boolean) => {
            htmlElement.setAttribute("data-theme", isDark ? 'dark' : 'light');
            setIsDark(isDark);
        }
    ];
}