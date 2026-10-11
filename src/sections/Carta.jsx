import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './Carta.css'
import { HojasCarta, calcularLineas, variablesPapel } from '../components/HojasCarta.jsx'
import { FloatingPetals } from '../components/FloatingPetals.jsx'
import { parrafos, firma } from '../data/carta.js'

// Ojo: esto vive en el navegador, o sea que quien sepa abrir las
// herramientas de desarrollador puede encontrarlo. Para un regalo está
// perfecto (es un candado simbólico, no una caja fuerte).
const CONTRASENA = '8154'

// debe coincidir con la duración de la animación en Carta.css
const DURACION_ARRUGA = 1700

export function Carta() {
  // cerrada -> clave -> desarrugando -> carta
  const [fase, setFase] = useState('cerrada')
  const [clave, setClave] = useState('')
  const [error, setError] = useState(false)
  const [flash, setFlash] = useState(false)
  const [desbloqueada, setDesbloqueada] = useState(false)
  const [lineas, setLineas] = useState(14)

  const inputRef = useRef(null)
  const temporizadores = useRef([])

  const limpiarTemporizadores = () => {
    temporizadores.current.forEach(clearTimeout)
    temporizadores.current = []
  }

  useEffect(() => limpiarTemporizadores, [])

  const abrir = () => {
    // una vez que acertó la clave, ya no se la volvemos a pedir en la
    // misma visita (ni repetimos la animación). Si prefieres que pida
    // clave siempre, borra este if y el estado `desbloqueada`.
    if (desbloqueada) {
      setFase('carta')
      return
    }
    setClave('')
    setError(false)
    setFase('clave')
  }

  const cerrar = () => {
    limpiarTemporizadores()
    setFlash(false)
    setFase('cerrada')
  }

  const enviar = (e) => {
    e.preventDefault()

    if (clave.trim() !== CONTRASENA) {
      setError(true)
      setClave('')
      return
    }

    setError(false)
    setDesbloqueada(true)
    // la hoja arrugada se desdobla al mismo tamaño exacto que tendrá la
    // hoja de verdad -> el cambio no se nota
    setLineas(calcularLineas())
    setFase('desarrugando')

    // el flash entra tantito antes de que termine el desarrugado y tapa
    // la costura entre la animación y la carta real
    temporizadores.current.push(
      setTimeout(() => setFlash(true), DURACION_ARRUGA - 280)
    )
    temporizadores.current.push(
      setTimeout(() => setFase('carta'), DURACION_ARRUGA)
    )
    temporizadores.current.push(
      setTimeout(() => setFlash(false), DURACION_ARRUGA + 430)
    )
  }

  const bloqueada = fase !== 'cerrada'

  useEffect(() => {
    document.body.style.overflow = bloqueada ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [bloqueada])

  useEffect(() => {
    if (!bloqueada) return
    const onKeyDown = (e) => {
      // durante la animación no dejamos cerrar, para que no quede a medias
      if (e.key === 'Escape' && fase !== 'desarrugando') cerrar()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [bloqueada, fase])

  useEffect(() => {
    if (fase === 'clave' && inputRef.current) inputRef.current.focus()
  }, [fase])

  return (
    <section className="carta-seccion" data-screen-label="09 La carta">
      <FloatingPetals />
      <p className="carta-eyebrow">sala ocho</p>
      <h2 className="carta-title">La carta</h2>
      <p className="carta-intro">
        Hola te hice una carta, leela cuando gustes pero te agradecería que no fuera en público pq por algo le puse candado, la contraseña te la dije hace no mucho, fueron 4 numeros que te dije que guardaras porque te dije que los ibas a necesitar.
      </p>

      <button className="carta-btn" onClick={abrir}>
        {desbloqueada ? 'Volver a leer la carta' : 'Leer la carta'}
      </button>

      {bloqueada &&
        createPortal(
          // portal a document.body: mismo motivo que en Palabras.jsx y
          // Cartas.jsx -> esta sección también arma su propio stacking
          // context (position:relative + z-index:0). Como "sala siete" es
          // la última del recorrido no había ninguna sección hermana
          // después para taparla y por eso no se notaba, pero el bug
          // latente era el mismo, así que la dejamos igual de blindada.
          <>
            <div
              className="carta-backdrop"
              onClick={fase === 'desarrugando' ? undefined : cerrar}
            />

            {fase === 'clave' && (
              <div className="carta-clave" role="dialog" aria-modal="true">
                <form onSubmit={enviar}>
                  <p className="carta-clave-titulo">Esta carta tiene candado</p>
                  <p className="carta-clave-texto">Escribe los cuatro números.</p>

                  <input
                    ref={inputRef}
                    className={`carta-clave-input${error ? ' carta-clave-input--error' : ''}`}
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={4}
                    value={clave}
                    onChange={(e) => {
                      setClave(e.target.value)
                      setError(false)
                    }}
                    aria-label="Contraseña"
                  />

                  {error && <p className="carta-clave-error">Esa no es. Intenta otra vez.</p>}

                  <div className="carta-clave-botones">
                    <button type="button" className="carta-clave-cancelar" onClick={cerrar}>
                      Cancelar
                    </button>
                    <button type="submit" className="carta-clave-abrir">
                      Abrir
                    </button>
                  </div>
                </form>
              </div>
            )}

            {fase === 'desarrugando' && (
              <div className="carta-escena" style={variablesPapel(lineas)}>
                <div className="carta-bola">
                  <span className="carta-arrugas" />
                </div>
              </div>
            )}

            {fase === 'carta' && (
              <div className="carta-lectura">
                <button className="carta-cerrar" onClick={cerrar} aria-label="Cerrar">
                  ✕
                </button>
                <HojasCarta parrafos={parrafos} firma={firma} />
              </div>
            )}

            {flash && <div className="carta-flash" />}
          </>,
          document.body
        )}
    </section>
  )
}
