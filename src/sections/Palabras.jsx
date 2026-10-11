import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import './Palabras.css'
import { FloatingPetals } from '../components/FloatingPetals.jsx'
import { Fundido } from '../components/Fundido.jsx'
import { useSorteo } from '../components/useSorteo.js'
import { useTextoQueQuepa } from '../components/useTextoQueQuepa.js'
import palabrasData from '../data/palabras.json'

export function Palabras() {
  const [abierta, setAbierta] = useState(false)
  const [indice, setIndice] = useState(null)

  // sorteo con memoria: no repite lo reciente y prefiere lo que no ha visto
  const sortear = useSorteo('palabras', palabrasData.length)

  // la letra se encoge sola hasta que el mensaje quepa; si ni así, scroll
  const ajusteRef = useTextoQueQuepa()

  const sacarMensaje = () => {
    setIndice(sortear())
    setAbierta(true)
  }

  const cerrar = () => setAbierta(false)

  // mientras el mensaje está abierto, la página de atrás no hace scroll
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

  const mensaje = indice !== null ? palabrasData[indice] : null

  return (
    <section className="palabras" data-screen-label="03 Palabras que abrazan">
      <FloatingPetals />
      <p className="palabras-eyebrow">sala dos</p>
      <h2 className="palabras-title">Palabras que abrazan</h2>
      <p className="palabras-intro">
        Me preguntaba "¿Cómo puedo retenerte aquí lo más posible?" van a salir varios mensajes en desorden y no vas a saber cuando ya hayas visto todos los mensajes porque siempre podría aparecer uno nuevo que no has visto
      </p>

      <button className="palabras-btn" onClick={sacarMensaje}>
        Sacar un mensaje
      </button>

      {abierta &&
        mensaje &&
        createPortal(
          <>
            {/* portal a document.body a propósito: cada <section> tiene
                position:relative + z-index:0, o sea que cada una arma su
                propio stacking context. Sin el portal, el z-index:101 del
                panel solo gana DENTRO de esa sección -> cualquier sección
                hermana que venga después en el DOM (Memory dump, Bocetos...)
                se sigue dibujando encima y tapa el modal salvo en el
                pedacito donde la sección de esta sala queda visible. Al
                montar el modal directo en <body> se sale de ese stacking
                context y sí cubre toda la pantalla. */}
            <div className="palabras-backdrop" onClick={cerrar} />

            <div className="palabras-panel" role="dialog" aria-modal="true">
              <button className="palabras-close" onClick={cerrar} aria-label="Cerrar">
                ✕
              </button>

              {/* el cerrar queda fuera de esta caja para que no se vaya con
                  el scroll cuando el mensaje es larguísimo */}
              <div className="palabras-scroll" ref={ajusteRef}>
                {/* el puntito queda FUERA del fundido a propósito: al no
                    desmontarse nunca, su color viaja solito del anterior al
                    nuevo con el transition de Palabras.css, en lugar de
                    cambiar de golpe */}
                <div className="palabras-dot" style={{ background: mensaje.color }} />

                {/* la llave es el índice: cada "Otro mensaje" trae uno
                    distinto -> el texto se desenfoca, cambia y vuelve a
                    enfocarse ya con la palabra nueva */}
                <Fundido llave={indice}>
                  <p className="palabras-mensaje">{mensaje.mensaje}</p>
                  <p className="palabras-autor">— {mensaje.autor}</p>
                </Fundido>

                <button className="palabras-otra" onClick={sacarMensaje}>
                  Otro mensaje
                </button>
              </div>
            </div>
          </>,
          document.body
        )}
    </section>
  )
}
