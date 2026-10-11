import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import './Cartas.css'
import { FloatingPetals } from '../components/FloatingPetals.jsx'
import { Fundido } from '../components/Fundido.jsx'
import { useSorteo } from '../components/useSorteo.js'
import { useTextoQueQuepa } from '../components/useTextoQueQuepa.js'
import cartasData from '../data/cartas.json'

export function Cartas() {
  const [abierta, setAbierta] = useState(false)
  const [indice, setIndice] = useState(null)
  const [revelada, setRevelada] = useState(false)

  // sorteo con memoria: no repite lo reciente y prefiere lo que no ha visto
  const sortear = useSorteo('cartas', cartasData.length)

  // la letra se encoge sola hasta que el mensaje quepa; si ni así, scroll
  const ajusteRef = useTextoQueQuepa()

  const sacarCarta = () => {
    setIndice(sortear())
    setRevelada(false) // cada confesión nueva empieza tapada otra vez
    setAbierta(true)
  }

  const cerrar = () => setAbierta(false)

  useEffect(() => {
    document.body.style.overflow = abierta ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [abierta])

  useEffect(() => {
    if (!abierta) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') cerrar()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [abierta])

  const carta = indice !== null ? cartasData[indice] : null

  return (
    <section className="cartas" data-screen-label="08 Cartas a la luz de la vela">
      <FloatingPetals />
      <p className="cartas-eyebrow">sala siete</p>
        <h2 className="cartas-title">Top confesiones sobre dany</h2>
      <p className="cartas-intro">
        Tenía la idea de que te enteraras de cosas así bien crazy pero o nos conoces bien o no sabemos que decir.
      </p>

      <button className="cartas-btn" onClick={sacarCarta}>
        Sacar una confesión
      </button>

      {abierta &&
        carta &&
        createPortal(
          // portal a document.body: ver el comentario en Palabras.jsx,
          // mismo problema (cada sección arma su propio stacking context
          // por position:relative + z-index:0) y misma solución.
          <>
            <div className="cartas-backdrop" onClick={cerrar} />

            <div className="cartas-panel" role="dialog" aria-modal="true">
              <button className="cartas-close" onClick={cerrar} aria-label="Cerrar">
                ✕
              </button>

              {/* caja con scroll: mismo motivo que en Palabras.jsx */}
              <div className="cartas-scroll" ref={ajusteRef}>
                {/* mismo fundido que en Palabras: al sacar otra confesión, la
                    anterior se desenfoca y se va, y la nueva entra enfocándose.
                    Mientras no hay cambio de confesión el contenido se pinta en
                    vivo, así que el click para revelarla sigue igual de siempre */}
                <Fundido llave={indice}>
                  <p className="cartas-de">Confesión de {carta.autor}</p>

                  {/* botón, no <p>, para que el click y el teclado (Enter/Espacio)
                      funcionen gratis sin escribir un manejador aparte */}
                  <button
                    type="button"
                    className={`cartas-mensaje${revelada ? ' cartas-mensaje--revelada' : ''}`}
                    onClick={() => setRevelada(true)}
                    disabled={revelada}
                  >
                    {carta.mensaje}
                  </button>

                  {!revelada && <p className="cartas-pista">(dale click para leerla)</p>}
                </Fundido>

                <button className="cartas-otra" onClick={sacarCarta}>
                  Otra confesión
                </button>
              </div>
            </div>
          </>,
          document.body
        )}
    </section>
  )
}
