import { useMemo, useState } from 'react'
import './Card.css'

// Genera un border-radius con 8 valores random -> la "mancha" orgánica.
// Rango 35–65% para que se note la forma sin que se vea como amiba.
function randomBlob() {
  const r = () => 35 + Math.round(Math.random() * 30)
  return `${r()}% ${r()}% ${r()}% ${r()}% / ${r()}% ${r()}% ${r()}% ${r()}%`
}

// Card genérica, reusable para el Manual (siempre abierta) y para los
// mensajes de "Palabras que abrazan" (se abren al hacer click).
//
// Props:
//   color       -> color del circulito/acento (string CSS, ej. 'var(--clr-sand)')
//   titulo      -> opcional. El Manual lo usa ("Su café"), los mensajes no.
//   mensaje     -> obligatorio. El texto de la tarjeta.
//   autor       -> opcional. Si viene, se muestra abajo a la izquierda ("— Camila").
//   expandible  -> false (default) = el mensaje siempre se ve, sin click.
//                  true = arranca cerrada y el click la abre/cierra.
//   ancha       -> false (default). true = ocupa 2 columnas en vez de 1
//                  dentro de un grid (usado por el Manual con mensajes
//                  largos). No hace nada si el padre no es un grid.
export function Card({
  color = 'var(--clr-terracotta-light)',
  titulo,
  mensaje,
  autor,
  expandible = false,
  ancha = false,
}) {
  const borderRadius = useMemo(() => randomBlob(), [])
  const [abierta, setAbierta] = useState(false)

  const mensajeVisible = !expandible || abierta

  return (
    <article
      className={`card${expandible ? ' card-clickable' : ''}${ancha ? ' card-ancha' : ''}`}
      style={{ borderRadius }}
      onClick={expandible ? () => setAbierta((v) => !v) : undefined}
    >
      <div className="card-dot" style={{ background: color }} />

      {titulo && <h3 className="card-title">{titulo}</h3>}

      {mensajeVisible && <p className="card-message">{mensaje}</p>}

      {autor && <p className="card-author">— {autor}</p>}
    </article>
  )
}
