import {type Component, createEffect, createSignal, untrack} from "solid-js";
import {Dynamic} from "solid-js/web";

export default function LazyPage<P extends Record<string, any>>(props: {
    active: boolean;
    component: Component<P & { visible: boolean }>;
    componentProps: P;
}) {
    const [shouldRender, setShouldRender] = createSignal(false);

    createEffect(() => {
        if (props.active && !untrack(shouldRender)) {
            setShouldRender(true);
        }
    });

    return <>
        {shouldRender() &&
            <Dynamic component={props.component} {...props.componentProps} visible={props.active}/>
        }
    </>;
}