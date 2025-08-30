import {FaSolidMoon, FaSolidSun} from "solid-icons/fa";
import {useDarkTheme} from "./useDarkTheme.ts";

export default function DarkModeSwitch() {
    const [isDark, setDark] = useDarkTheme();

    return <label class="swap swap-rotate">
        <input type="checkbox" checked={isDark()} onChange={() => setDark(!isDark())} />

        <FaSolidSun class="swap-off h-4 w-4 fill-current" />
        <FaSolidMoon class="swap-on h-4 w-4 fill-current" />
    </label>
}