import './FloatingPetals.css'

// posiciones/tamaños fijos pero variados, para que las 6 no se vean
// idénticas ni alineadas -> cada instancia de <FloatingPetals /> (una
// por sala) las dibuja igual, pero cada sala las recorta a su propio
// tamaño así que en la práctica no se repiten visualmente.
const PETALS = [
  { top: '8%', left: '10%', size: 22, color: 'var(--clr-terracotta-light)', opacity: 0.55, duration: 9, delay: 0 },
  { top: '20%', left: '84%', size: 15, color: 'var(--clr-sand)', opacity: 0.5, duration: 11, delay: 1.4 },
  { top: '46%', left: '5%', size: 26, color: 'var(--clr-terracotta)', opacity: 0.4, duration: 13, delay: 3.1 },
  { top: '62%', left: '92%', size: 17, color: 'var(--clr-cream)', opacity: 0.35, duration: 10, delay: 2 },
  { top: '80%', left: '22%', size: 20, color: 'var(--clr-terracotta-light)', opacity: 0.45, duration: 12, delay: 4.5 },
  { top: '90%', left: '70%', size: 24, color: 'var(--clr-sand)', opacity: 0.5, duration: 14, delay: 0.8 },
]

export function FloatingPetals() {
  return (
    <div className="petals" aria-hidden="true">
      {PETALS.map((p, i) => (
        <span
          key={i}
          className="petal"
          style={{
            top: p.top,
            left: p.left,
            width: `${p.size}px`,
            height: `${Math.round(p.size * 0.72)}px`,
            background: p.color,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
