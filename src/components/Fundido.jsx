import { useEffect, useRef, useState } from 'react'
import './Fundido.css'

// Cross-fade genérico. Envuelves cualquier contenido y le pasas una
// `llave` (el índice del mensaje, de la confesión, lo que sea): cada vez
// que esa llave cambia, hace la secuencia
//
//    borroso + se desvanece  ->  (cambia el contenido)  ->  se enfoca
//
// El truco es que el cambio de contenido ocurre A LA MITAD, cuando todo
// está borroso y transparente: nadie alcanza a ver el corte, se siente
// como un solo desvanecido continuo.
//
// Importante: NO toca la lógica de quien lo usa. No guarda mensajes, no
// decide cuál sigue, no intercepta clicks -> solo mira la llave y anima.
// Mientras no hay transición pinta `children` en vivo, así que cosas
// como "revelar" la confesión siguen funcionando igual que siempre.
//
// Props:
//   llave     -> cuando cambia, dispara la animación
//   duracion  -> milisegundos del ciclo completo (mitad sale, mitad entra)
//   className -> clases extra para el contenedor
export function Fundido({ llave, duracion = 520, className = '', children }) {
  // 'quieto' = sin animación | 'saliendo' = el viejo se va | 'entrando' = el nuevo llega
  const [fase, setFase] = useState('quieto')
  // copia del contenido viejo: solo existe mientras dura la salida
  const [congelado, setCongelado] = useState(null)

  const llaveRef = useRef(llave)
  // lo último que de verdad se pintó en pantalla (para poder congelarlo)
  const enPantalla = useRef(children)

  // Detectamos el cambio DURANTE el render (el patrón de React para
  // derivar estado de props). Si esperáramos a un useEffect, el frame
  // intermedio ya habría pintado el mensaje nuevo de golpe y se vería
  // el parpadeo que justamente queremos evitar.
  if (llave !== llaveRef.current) {
    llaveRef.current = llave
    setCongelado(enPantalla.current)
    setFase('saliendo')
  }

  useEffect(() => {
    // mientras sale, lo que se ve es `congelado`, no `children` -> no
    // sobreescribimos la referencia o perderíamos el nodo que se está
    // desvaneciendo si vuelven a picarle al botón a media animación
    if (fase !== 'saliendo') enPantalla.current = children
  })

  useEffect(() => {
    if (fase !== 'saliendo') return
    const mitad = setTimeout(() => {
      setCongelado(null) // soltamos el contenido nuevo, ya con todo borroso
      setFase('entrando')
    }, duracion / 2)
    return () => clearTimeout(mitad)
  }, [fase, congelado, duracion])

  useEffect(() => {
    if (fase !== 'entrando') return
    const fin = setTimeout(() => setFase('quieto'), duracion / 2)
    return () => clearTimeout(fin)
  }, [fase, duracion])

  return (
    <div
      className={`fundido fundido--${fase}${className ? ` ${className}` : ''}`}
      // la duración vive en JS y se la pasamos al CSS por variable, así
      // no hay forma de que se desincronicen los dos lados
      style={{ '--fundido-mitad': `${duracion / 2}ms` }}
    >
      {fase === 'saliendo' ? congelado : children}
    </div>
  )
}
