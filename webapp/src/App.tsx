

import { createSignal } from 'solid-js'
import './App.css'
import TableListPanel from './components/TableListPanel'
import MainPanel from './components/MainPanel'
import DataViewerPanel from './components/DataViewerPanel'

function App() {
  const [selected, setSelected] = createSignal<string | null>(null)

  return (
    <div class="app-container">
      <TableListPanel selected={selected()} setSelected={setSelected} />
      <MainPanel selected={selected()} />
      <DataViewerPanel />
    </div>
  )
}

export default App
