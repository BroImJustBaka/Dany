import { useEffect, useMemo, useRef } from 'react'
import './MemoryDump.css'
import { FloatingPetals } from '../components/FloatingPetals.jsx'
import memoriasData from '../data/memorias.json'

// import.meta.glob deja que Vite empaquete las fotos y nos dé la URL final
// procesada; sin esto, un <img src="./imgs/foto.jpg"> puesto a mano en el
// JSON no resuelve a nada porque esa carpeta no es pública.
const imageModules = import.meta.glob('../data/imgs/*.{jpg,jpeg,png,webp}', { eager: true })
const imagesByFilename = Object.fromEntries(
  Object.entries(imageModules).map(([path, mod]) => [path.split('/').pop(), mod.default])
)

function resolveRuta(ruta) {
  const filename = ruta.split('/').pop()
  return imagesByFilename[filename] ?? ruta
}

// Rotación entre -6 y 6 grados, para que ninguna polaroid quede perfectamente
// derecha -> se ve como si alguien las hubiera ido pegando a mano.
function randomRotation() {
  return (Math.random() * 12 - 6).toFixed(1)
}

function Polaroid({ ruta, alt, nota }) {
  // useMemo para que la rotación se calcule una sola vez por tarjeta,
  // igual que hicimos con el border-radius random de <Card />.
  const rotate = useMemo(() => randomRotation(), [])

  return (
    <figure className="memoria-item" style={{ '--rot': `${rotate}deg` }}>
      <div className="memoria-photo">
        <img src={resolveRuta(ruta)} alt={alt ?? ''} loading="lazy" />
      </div>
      {nota && <figcaption className="memoria-nota">{nota}</figcaption>}
    </figure>
  )
}

export function MemoryDump() {
  const trackRef = useRef(null)

  useEffect(() => {
    const el = trackRef.current
    if (!el) return

    // el mouse normal solo manda scroll vertical (deltaY). Si el gesto es
    // más vertical que horizontal, lo redirigimos al scrollLeft del
    // carrusel -> así "scrolleas" y las fotos avanzan de lado.
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        el.scrollLeft += e.deltaY
        e.preventDefault()
      }
    }

    // { passive: false } es necesario para que preventDefault funcione;
    // por eso esto va con addEventListener y no con onWheel de React.
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  return (
    <section className="memoria" data-screen-label="05 Memory dump">
      <FloatingPetals />
      <p className="memoria-eyebrow">sala cuatro</p>
      <h2 className="memoria-title">Memory dump</h2>
      <p className="memoria-intro">
        Recórrelas con el scroll, de lado a lado. Pasa el cursor (o el dedo) encima para enfocar cada una.
        <br/>
        By: Dana & Santiago pq para pedirle fotos a tooodo el mundo no acababa jamás pero sobre todo con mucho amor
      </p>

      <div className="memoria-track" ref={trackRef}>
        {memoriasData.map((foto, i) => (
          <Polaroid key={i} {...foto} />
        ))}
      </div>
    </section>
  )
}
