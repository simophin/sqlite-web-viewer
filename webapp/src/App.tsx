import {createSignal} from 'solid-js'
import './App.css'
import TableListPanel from './components/TableListPanel'
import MainPanel from './components/MainPanel'

function App() {
    const [selected, setSelected] = createSignal<string | null>(null);
    const [leftPanelWidth, setLeftPanelWidth] = createSignal(250);

    return (
        <div class="flex h-screen w-screen">

            <div style={{width: leftPanelWidth() + 'px'}} class="shrink-0">
                <TableListPanel selected={selected()} setSelected={setSelected}/>
            </div>

            <div
                class="w-2 cursor-col-resize"
                onMouseDown={(e) => {
                    const startX = e.clientX;
                    const startWidth = leftPanelWidth();

                    const onMouseMove = (moveEvent: MouseEvent) => {
                        const newWidth = startWidth + (moveEvent.clientX - startX);
                        setLeftPanelWidth(Math.max(100, newWidth)); // Minimum width of 100px
                    };

                    const onMouseUp = () => {
                        document.removeEventListener('mousemove', onMouseMove);
                        document.removeEventListener('mouseup', onMouseUp);
                    };

                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                }}
            >
                <div class="bg-gray-400 w-0.5 h-full" />
            </div>

            <div class="grow h-full overflow-x-hidden">
                <MainPanel selected={selected()}/>
            </div>
        </div>
    )
}

export default App
