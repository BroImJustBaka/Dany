import { useMemo } from 'react'
import './Bocetos.css'
import { FloatingPetals } from '../components/FloatingPetals.jsx'
import bocetosData from '../data/bocetos.json'

// Saca un año de la fecha para poder ordenar sin que tengas que llevar
// tú la cuenta. Acepta "2016", "verano 2019", "diciembre 2022"... busca
// los primeros 4 dígitos seguidos que encuentre. "hoy" (sin importar
// mayúsculas) siempre gana y queda al final, como el presente.
function fechaAOrden(fecha) {
  if (!fecha) return 0
  if (fecha.trim().toLowerCase() === 'hoy') return Infinity
  const anio = fecha.match(/\d{4}/)
  return anio ? Number(anio[0]) : 0
}

// Mismo truco de <Card />: border-radius orgánico random, calculado una
// sola vez por tarjeta con useMemo.
function randomBlob() {
  const r = () => 42 + Math.round(Math.random() * 16)
  return `${r()}% ${r()}% ${r()}% ${r()}% / ${r()}% ${r()}% ${r()}% ${r()}%`
}

function BocetoEntry({ fecha, autor, titulo, texto }) {
  const borderRadius = useMemo(() => randomBlob(), [])

  return (
    <article className="boceto-item" style={{ borderRadius }}>
      <p className="boceto-fecha">
        {fecha}
        {/* memorias colectivas -> con esto no se confunde de quién es cada una */}
        {autor && <span className="boceto-autor"> · {autor}</span>}
      </p>
      <h3 className="boceto-titulo">{titulo}</h3>
      <p className="boceto-texto">{texto}</p>
    </article>
  )
}

export function Bocetos() {
  // ordena una sola vez; si el JSON no cambia entre renders, no hay
  // razón para volver a correr el sort en cada uno.
  const ordenado = useMemo(
    () => [...bocetosData].sort((a, b) => fechaAOrden(a.fecha) - fechaAOrden(b.fecha)),
    []
  )

  return (
    <section className="bocetos" data-screen-label="06 Cuaderno de bocetos">
      <FloatingPetals />
      <p className="bocetos-eyebrow">sala cinco</p>
      <h2 className="bocetos-title">El cuaderno de bocetos</h2>

      <div className="bocetos-lista">
        {ordenado.map((item, i) => (
          <BocetoEntry key={i} {...item} />
        ))}
      </div>
    </section>
  )
}
