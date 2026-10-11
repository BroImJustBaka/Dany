import { Hero } from './sections/Hero.jsx'
import { Manual } from './sections/Manual.jsx'
import { Palabras } from './sections/Palabras.jsx'
import { Anecdotas } from './sections/Anecdotas.jsx'
import { MemoryDump } from './sections/MemoryDump.jsx'
import { Bocetos } from './sections/Bocetos.jsx'
import { Soundtrack } from './sections/Soundtrack.jsx'
import { Cartas } from './sections/Cartas.jsx'
import { Carta } from './sections/Carta.jsx'

export function App() {
  return (
    <>
      <Hero />
      <Manual />
      <Palabras />
      <Anecdotas />
      <MemoryDump />
      <Bocetos />
      <Soundtrack />
      <Cartas />
      <Carta />
    </>
  )
}
