import { useRef } from 'react'

// Sorteo "con memoria" para las salas que sacan mensajes al azar
// (Palabras, Anécdotas, Cartas). La idea es que se sienta random pero
// sin repetirse a cada rato:
//
// 1. Enfriamiento: lo que salió hace poquito no puede volver a salir
//    hasta que pasen unos cuantos mensajes. El tamaño de esa ventana
//    crece con el número de items (la mitad, hasta 5 como máximo), así
//    funciona igual con 3 mensajes que con 100: nunca deja todo bloqueado.
// 2. Preferencia por lo nuevo: los que nunca ha visto pesan más (x3) que
//    los ya vistos, así van saliendo los nuevos más seguido pero de vez
//    en cuando se cuela uno repetido. Cuando ya los vio todos, todos
//    pesan igual y queda puro azar (con el enfriamiento).
//
// Lo que ya vio y el historial reciente se guardan en localStorage por
// sala: si recarga la página no le vuelven a salir los mismos de entrada.
// Los items se identifican por su posición en el JSON, así que los
// mensajes nuevos conviene agregarlos AL FINAL del arreglo.

const ENFRIAMIENTO_MAX = 5
const PESO_NUEVO = 3

function leer(clave) {
  try {
    const guardado = JSON.parse(localStorage.getItem(clave))
    if (guardado && Array.isArray(guardado.recientes) && Array.isArray(guardado.vistos)) {
      return guardado
    }
  } catch {
    // sin localStorage (modo incógnito, bloqueado...) -> se empieza de cero
  }
  return { recientes: [], vistos: [] }
}

function guardar(clave, estado) {
  try {
    localStorage.setItem(clave, JSON.stringify(estado))
  } catch {
    // si no se puede guardar, el sorteo sigue funcionando en memoria
  }
}

function sortear(estado, length) {
  if (length <= 1) return 0

  const enfriamiento = Math.min(ENFRIAMIENTO_MAX, Math.floor(length / 2))
  // filtra índices viejos por si el JSON se hizo más corto
  const recientes = estado.recientes.filter((i) => i < length).slice(-enfriamiento)
  const vistos = new Set(estado.vistos.filter((i) => i < length))

  const candidatos = []
  let total = 0
  for (let i = 0; i < length; i++) {
    if (recientes.includes(i)) continue
    const peso = vistos.has(i) ? 1 : PESO_NUEVO
    candidatos.push([i, peso])
    total += peso
  }

  let r = Math.random() * total
  for (const [i, peso] of candidatos) {
    r -= peso
    if (r < 0) return i
  }
  return candidatos[candidatos.length - 1][0]
}

// Devuelve una función que saca el siguiente índice. Hay que llamarla
// en el manejador del click (no dentro de un setState(fn), porque en
// StrictMode React corre esos updaters 2 veces y se registraría doble).
export function useSorteo(clave, length) {
  const estadoRef = useRef(null)
  const storageKey = `sorteo:${clave}`

  return () => {
    if (!estadoRef.current) estadoRef.current = leer(storageKey)
    const estado = estadoRef.current

    const i = sortear(estado, length)

    estado.recientes = [...estado.recientes.filter((x) => x !== i), i].slice(-ENFRIAMIENTO_MAX)
    if (!estado.vistos.includes(i)) estado.vistos = [...estado.vistos, i]
    guardar(storageKey, estado)

    return i
  }
}
