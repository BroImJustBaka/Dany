import { useCallback } from 'react'

// Hace que el mensaje de un modal quepa en la pantalla sin importar qué
// tan largo sea. Se le pone (como ref) al contenedor con scroll del
// modal, y él le va ajustando la variable CSS --escala (de 1 hacia
// abajo) hasta que ya no se desborde. El CSS multiplica el tamaño de
// letra por esa variable, con un piso mínimo para que nunca quede
// ilegible: si ni con la letra más chica cabe, ahí sí aparece el scroll.
//
// Se recalcula solo cuando cambia el mensaje (cambia el tamaño de lo de
// adentro) o cuando cambia el tamaño de la pantalla (girar el cel,
// redimensionar la ventana), gracias al ResizeObserver.

const ESCALA_MIN = 0.55
const PASOS = 7 // búsqueda binaria: 7 pasos dan ~0.4% de precisión

function ajustar(el) {
  // ¿termina lo de adentro antes del borde de abajo? Se mide con
  // offsetTop/offsetHeight (no scrollHeight) porque esos ignoran los
  // transform: así el scale del <Fundido /> o la inclinación de la foto
  // a media animación no engañan la medición. Funciona porque el
  // contenedor centra con márgenes auto y es el offsetParent de sus hijos.
  const pb = parseFloat(getComputedStyle(el).paddingBottom) || 0
  const cabe = () => {
    const ultimo = el.lastElementChild
    if (!ultimo) return true
    return ultimo.offsetTop + ultimo.offsetHeight + pb <= el.clientHeight + 1
  }

  el.style.setProperty('--escala', '1')
  if (cabe()) return

  let lo = ESCALA_MIN
  let hi = 1
  for (let i = 0; i < PASOS; i++) {
    const mid = (lo + hi) / 2
    el.style.setProperty('--escala', String(mid))
    if (cabe()) lo = mid
    else hi = mid
  }
  el.style.setProperty('--escala', String(lo))
}

export function useTextoQueQuepa() {
  return useCallback((el) => {
    if (!el) return

    // huella de "qué hay y en qué espacio": si no cambió, no se vuelve a
    // medir (si no, el propio ajuste dispararía el observer en bucle)
    let huella = ''
    const revisar = () => {
      const nueva = `${el.clientWidth}x${el.clientHeight}|${el.textContent}`
      if (nueva === huella) return
      huella = nueva
      ajustar(el)
    }

    const ro = new ResizeObserver(revisar)
    ro.observe(el)
    for (const hijo of el.children) ro.observe(hijo)
    // por si llega un mensaje nuevo que ocupa justo lo mismo que el
    // anterior (el ResizeObserver no se enteraría)
    const mo = new MutationObserver(revisar)
    mo.observe(el, { childList: true, subtree: true, characterData: true })
    revisar()

    // las fuentes a mano tardan en cargar y cambian el tamaño del texto
    document.fonts?.ready.then(() => {
      huella = ''
      revisar()
    })

    return () => {
      ro.disconnect()
      mo.disconnect()
    }
  }, [])
}
