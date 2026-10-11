import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import './Anecdotas.css'
import { FloatingPetals } from '../components/FloatingPetals.jsx'
import { Fundido } from '../components/Fundido.jsx'
import { useSorteo } from '../components/useSorteo.js'
import { useTextoQueQuepa } from '../components/useTextoQueQuepa.js'
import anecdotasData from '../data/anecdotas.json'
// foto de la polaroid de hasta arriba del montoncito. Importada (en vez
// de ruta en /public) para que Vite la empaquete y nunca quede rota
import portada from '../assets/anecdotas-portada.jpg'

// Inclinación de la foto según la anécdota: sale del índice (no de
// Math.random) para que la misma anécdota siempre caiga igual de chueca
// y el cambio entre una y otra se vea como un giro, no un brinco.
function inclinacion(i) {
  return (((i * 37) % 9) - 4) * 0.9 // entre -3.6° y 3.6°
}

export function Anecdotas() {
  const [abierta, setAbierta] = useState(false)
  const [indice, setIndice] = useState(null)

  // sorteo con memoria: no repite lo reciente y prefiere lo que no ha visto
  const sortear = useSorteo('anecdotas', anecdotasData.length)

  // la letra se encoge sola hasta que el mensaje quepa; si ni así, scroll
  const ajusteRef = useTextoQueQuepa()

  const sacarAnecdota = () => {
    setIndice(sortear())
    setAbierta(true)
  }

  const cerrar = () => setAbierta(false)

  // mientras la anécdota está abierta, la página de atrás no hace scroll
  useEffect(() => {
    document.body.style.overflow = abierta ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [abierta])

  // Escape también cierra
  useEffect(() => {
    if (!abierta) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') cerrar()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [abierta])

  const anecdota = indice !== null ? anecdotasData[indice] : null

  return (
    <section className="anecdotas" data-screen-label="04 Anécdotas">
      <FloatingPetals />

      {/* a diferencia de las otras salas (texto arriba, botón abajo), aquí
          va en dos columnas: el texto a la izquierda y el "montoncito" de
          fotos a la derecha, que es el botón en sí */}
      <div className="anecdotas-layout">
        <div className="anecdotas-texto">
          <p className="anecdotas-eyebrow">sala tres</p>
          <h2 className="anecdotas-title">Anécdotas</h2>
          <p className="anecdotas-intro">
            Btw corazón los titulos los escribí yo pq tenía q ponerle titulos a las tarjetas so no le reclames a nadie por el titulo de la tarjeta fui sho, perdona el contenido sarcastico, me quedaba sin ideas
          </p>
        </div>

        <button
          type="button"
          className="anecdotas-mazo"
          onClick={sacarAnecdota}
          aria-label="Sacar una anécdota"
        >
          <span className="anecdotas-mazo-foto anecdotas-mazo-foto--3" aria-hidden="true" />
          <span className="anecdotas-mazo-foto anecdotas-mazo-foto--2" aria-hidden="true" />
          <span
            className="anecdotas-mazo-foto anecdotas-mazo-foto--1"
            style={{ '--portada': `url(${portada})` }}
          >
            <span className="anecdotas-mazo-cinta" aria-hidden="true" />
            <span className="anecdotas-mazo-label">Sacar una anécdota</span>
            <span className="anecdotas-mazo-pista">(toca el montoncito)</span>
          </span>
        </button>
      </div>

      {abierta &&
        anecdota &&
        createPortal(
          // portal a document.body: mismo motivo que en Palabras.jsx (cada
          // sección arma su propio stacking context por position:relative +
          // z-index:0, sin esto el modal quedaría tapado por las salas de abajo)
          <>
            <div className="anecdotas-backdrop" onClick={cerrar} />

            <div className="anecdotas-panel" role="dialog" aria-modal="true">
              {/* barra de arriba: contador a la izquierda, cerrar a la derecha */}
              <div className="anecdotas-barra">
                <p className="anecdotas-contador">
                </p>
                <button className="anecdotas-close" onClick={cerrar} aria-label="Cerrar">
                  ✕
                </button>
              </div>

              {/* la foto (papel + cinta) NO se desmonta entre anécdotas: así la
                  cinta cambia de color y la foto gira de su ángulo al nuevo con
                  transiciones de CSS, mientras lo de adentro se funde */}
              {/* solo el renglón de en medio hace scroll: las barras de
                  arriba (cerrar) y abajo (otra anécdota) siempre a la vista */}
              <div className="anecdotas-scroll" ref={ajusteRef}>
                <article
                  className="anecdotas-foto"
                  style={{ '--rot': `${inclinacion(indice)}deg` }}
                >
                  <span
                    className="anecdotas-cinta"
                    style={{ background: anecdota.color }}
                    aria-hidden="true"
                  />

                  <Fundido llave={indice}>
                    {anecdota.fecha && <p className="anecdotas-fecha">{anecdota.fecha}</p>}
                    <h3 className="anecdotas-titulo">{anecdota.titulo}</h3>
                    <p className="anecdotas-relato">{anecdota.texto}</p>
                    {anecdota.autor && <p className="anecdotas-autor">— {anecdota.autor}</p>}
                  </Fundido>
                </article>
              </div>

              {/* barra de abajo: pista a la izquierda, siguiente a la derecha
                  (las otras salas centran el botón debajo del mensaje) */}
              <div className="anecdotas-acciones">
                <p className="anecdotas-esc">esc para volver</p>
                <button className="anecdotas-otra" onClick={sacarAnecdota}>
                  Otra anécdota <span aria-hidden="true">↻</span>
                </button>
              </div>
            </div>
          </>,
          document.body
        )}
    </section>
  )
}
