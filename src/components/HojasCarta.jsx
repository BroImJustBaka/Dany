import { useLayoutEffect, useEffect, useRef, useState } from 'react'
import './HojasCarta.css'

// Medidas de la hoja. Viven en JS (no en el CSS) porque el algoritmo de
// paginación necesita los mismos números que usa el diseño: si estuvieran
// duplicados en los dos lados, cualquier cambio desalinearía el texto de
// las rayas. El CSS los recibe como variables desde aquí.
export const PAPEL = {
  alturaLinea: 34, // alto de cada renglón == separación entre rayas
  paddingArriba: 56,
  paddingAbajo: 44,
  margenIzq: 78, // el margen ancho de la izquierda (donde va la raya roja)
  margenDer: 46,
  tamanoTexto: 24,
  desfaseRaya: 6, // sube/baja la raya respecto al texto
}

// Cuántos renglones caben en una hoja con el alto de pantalla actual.
// La hoja siempre mide un múltiplo exacto de alturaLinea -> nunca queda
// un renglón cortado a la mitad.
export function calcularLineas() {
  const disponible =
    window.innerHeight * 0.8 - PAPEL.paddingArriba - PAPEL.paddingAbajo - 40
  return Math.max(6, Math.floor(disponible / PAPEL.alturaLinea))
}

export function variablesPapel(lineas) {
  return {
    '--altura-linea': `${PAPEL.alturaLinea}px`,
    '--padding-arriba': `${PAPEL.paddingArriba}px`,
    '--padding-abajo': `${PAPEL.paddingAbajo}px`,
    '--margen-izq': `${PAPEL.margenIzq}px`,
    '--margen-der': `${PAPEL.margenDer}px`,
    '--tamano-texto': `${PAPEL.tamanoTexto}px`,
    '--desfase-raya': `${PAPEL.desfaseRaya}px`,
    '--lineas': lineas,
  }
}

// Busca, por búsqueda binaria, cuánto texto cabe en los renglones
// disponibles. Binaria y no palabra por palabra porque cada medición
// toca el DOM: son ~10 mediciones en vez de cientos.
// Siempre devuelve algo en `cabe` (mientras haya texto), así el reparto
// nunca se queda atorado en un bucle.
function buscarCorte(texto, renglonesDisponibles, medir) {
  const palabras = texto.split(/\s+/).filter(Boolean)
  let lo = 1
  let hi = palabras.length
  let mejor = 0

  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (medir(palabras.slice(0, mid).join(' ')) <= renglonesDisponibles) {
      mejor = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }

  if (mejor > 0) {
    return {
      cabe: palabras.slice(0, mejor).join(' '),
      resto: palabras.slice(mejor).join(' '),
    }
  }

  // Ni una palabra completa cabe (ej. alguien pegó un link larguísimo):
  // partimos la palabra por letras, igual con búsqueda binaria.
  const palabra = palabras[0] ?? ''
  let clo = 1
  let chi = palabra.length
  let cMejor = 0

  while (clo <= chi) {
    const cMid = (clo + chi) >> 1
    if (medir(palabra.slice(0, cMid)) <= renglonesDisponibles) {
      cMejor = cMid
      clo = cMid + 1
    } else {
      chi = cMid - 1
    }
  }

  if (cMejor === 0) cMejor = 1 // garantiza avance

  return {
    cabe: palabra.slice(0, cMejor),
    resto: [palabra.slice(cMejor), palabras.slice(1).join(' ')]
      .filter(Boolean)
      .join(' '),
  }
}

export function HojasCarta({ parrafos, firma }) {
  const medidorRef = useRef(null)
  const [lineas, setLineas] = useState(() =>
    typeof window === 'undefined' ? 14 : calcularLineas()
  )
  const [paginas, setPaginas] = useState([])
  const [fuentesListas, setFuentesListas] = useState(false)

  // La paginación depende de medir texto renderizado. Si medimos antes de
  // que cargue Caveat, el navegador mide con la tipografía de respaldo y
  // los cortes quedan mal -> esperamos a que las fuentes estén listas.
  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts) {
      setFuentesListas(true)
      return
    }
    let vivo = true
    document.fonts.ready.then(() => {
      if (vivo) setFuentesListas(true)
    })
    return () => {
      vivo = false
    }
  }, [])

  useEffect(() => {
    const alCambiarTamano = () => setLineas(calcularLineas())
    window.addEventListener('resize', alCambiarTamano)
    return () => window.removeEventListener('resize', alCambiarTamano)
  }, [])

  // useLayoutEffect y no useEffect: así el reparto en hojas ocurre antes
  // de que el navegador pinte, y nunca se alcanza a ver el texto sin
  // paginar.
  useLayoutEffect(() => {
    const nodo = medidorRef.current
    if (!nodo) return

    // la firma se pinta más grande que el cuerpo, así que se mide con su
    // propia clase; si no, una firma larga mediría de menos y se saldría
    const medir = (texto, tipo) => {
      nodo.className = tipo === 'firma' ? 'hoja-p hoja-p--firma' : 'hoja-p'
      nodo.textContent = texto || ' '
      return Math.max(1, Math.round(nodo.offsetHeight / PAPEL.alturaLinea))
    }

    const bloques = [
      ...parrafos.map((texto) => ({ texto, tipo: 'p' })),
      ...(firma ? [{ texto: firma, tipo: 'firma' }] : []),
    ]

    const hojas = []
    let actual = []
    let usadas = 0

    const cerrarHoja = () => {
      hojas.push(actual)
      actual = []
      usadas = 0
    }

    for (const bloque of bloques) {
      let texto = bloque.texto
      let esInicioDelBloque = true
      const medirBloque = (t) => medir(t, bloque.tipo)

      while (texto.length > 0) {
        // un renglón en blanco entre párrafos, pero solo si ya hay algo
        // en la hoja y estamos empezando el párrafo (no en una
        // continuación que viene de la hoja anterior)
        const separador = actual.length > 0 && esInicioDelBloque ? 1 : 0
        const disponibles = lineas - usadas - separador

        if (disponibles <= 0) {
          cerrarHoja()
          continue
        }

        const necesarias = medirBloque(texto)

        if (necesarias <= disponibles) {
          actual.push({ texto, tipo: bloque.tipo, separado: separador === 1 })
          usadas += separador + necesarias
          texto = ''
          continue
        }

        // no cabe completo: si queda muy poquito espacio, mejor que
        // arranque limpio en la siguiente hoja
        if (disponibles < 2 && actual.length > 0) {
          cerrarHoja()
          continue
        }

        const corte = buscarCorte(texto, disponibles, medirBloque)

        if (!corte.cabe) {
          cerrarHoja()
          continue
        }

        actual.push({
          texto: corte.cabe,
          tipo: bloque.tipo,
          separado: separador === 1,
        })
        texto = corte.resto
        esInicioDelBloque = false
        cerrarHoja()
      }
    }

    if (actual.length > 0) hojas.push(actual)
    setPaginas(hojas)
  }, [parrafos, firma, lineas, fuentesListas])

  const estilos = variablesPapel(lineas)

  return (
    <div className="hojas" style={estilos}>
      {/* hoja invisible que solo sirve para medir: mismo ancho, misma
          tipografía y mismo interlineado que las hojas de verdad */}
      <div className="hoja hoja--medidor" aria-hidden="true">
        <div className="hoja-cuerpo">
          <p className="hoja-p" ref={medidorRef} />
        </div>
      </div>

      {paginas.map((bloquesDeLaHoja, i) => (
        <article className="hoja" key={i}>
          <div className="hoja-cuerpo">
            {bloquesDeLaHoja.map((bloque, j) => (
              <p
                key={j}
                className={[
                  'hoja-p',
                  bloque.tipo === 'firma' ? 'hoja-p--firma' : '',
                  bloque.separado ? 'hoja-p--sep' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {bloque.texto}
              </p>
            ))}
          </div>
          {paginas.length > 1 && (
            <span className="hoja-num">
              {i + 1} / {paginas.length}
            </span>
          )}
        </article>
      ))}
    </div>
  )
}
