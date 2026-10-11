import './Soundtrack.css'
import { FloatingPetals } from '../components/FloatingPetals.jsx'

// El reproductor OFICIAL de Spotify, embebido -> ellos sí pueden mostrar
// tu playlist con audio real, sin que nuestra app necesite ningún
// permiso especial de la API (eso es lo que nos estuvo dando guerra).
//
// Para usar otra playlist, solo cambia este ID por el de la URL:
// https://open.spotify.com/playlist/ESTE_ID
const PLAYLIST_ID = '1SUYTwVIfNPqoeAVUZk0YO'

export function Soundtrack() {
  return (
    <section className="soundtrack" data-screen-label="07 Soundtrack">
      <FloatingPetals />
      <p className="soundtrack-eyebrow">sala seis</p>
      <h2 className="soundtrack-title">La banda sonora</h2>
      <p className="soundtrack-intro">
        oh mira agarré las canciones de tu playlist y la puse en tu página para que
        las escuches aquí porque soy bien pro y puedo y la vdd no escuchamos ni de
        cerca la misma música pero se me hizo bonito, yo tenía en mente otra cosa completamente diferente pero esto es lo que me dejó hacer spotify
      </p>

      <div className="soundtrack-embed">
        <iframe
          title="Playlist de Spotify"
          src={`https://open.spotify.com/embed/playlist/${PLAYLIST_ID}?utm_source=generator&theme=0`}
          width="100%"
          height="352"
          style={{ border: 0 }}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
      </div>
    </section>
  )
}
