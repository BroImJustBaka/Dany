import './Manual.css'
import { Card } from '../components/Card.jsx'
import { FloatingPetals } from '../components/FloatingPetals.jsx'
import manualData from '../data/manual.json'

// a partir de cuántos caracteres una tarjeta se considera "larga". Con
// menos de esto el mensaje cabe cómodo en 1 columna; de aquí para
// arriba se ve apachurrado, así que mejor le damos 2 columnas -> eso
// solo, sin tocar nada más, hace que el grid se reacomode: si no le
// alcanza el espacio en el renglón actual, la tarjeta salta entera al
// siguiente (ver comentario de grid-auto-flow: dense en Manual.css).
const LARGO_UMBRAL = 220

export function Manual() {
  return (
    <section id="manual" className="manual" data-screen-label="02 Manual de uso">
      <FloatingPetals />
      <p className="manual-eyebrow">sala uno</p>
      <h2 className="manual-title">Manual de uso de Daniela</h2>

      <div className="manual-grid">
        {manualData.map((item, i) => (
          <Card key={i} {...item} ancha={item.mensaje.trim().length > LARGO_UMBRAL} />
        ))}
      </div>
    </section>
  )
}
