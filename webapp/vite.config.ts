import {defineConfig} from 'vite'
import solid from 'vite-plugin-solid'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    // Relative base so the built bundle works under any mount prefix
    // (e.g. /, /__db/orders/). Asset URLs resolve against the document URL.
    base: './',
    plugins: [
        solid(),
        tailwindcss(),
    ],
})
