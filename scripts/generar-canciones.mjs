// ─────────────────────────────────────────────────────────────────────
//  Jala unas canciones de tu playlist de Spotify y las guarda en
//  src/data/canciones.json.
//
//  Esto se corre UNA VEZ, en tu compu, cuando quieras (re)generar el
//  JSON. El sitio ya publicado nunca vuelve a hablarle a Spotify -> tu
//  Client Secret nunca viaja a ningún lado más que a este script.
//
//  Uso (desde la raíz del proyecto):
//    node scripts/generar-canciones.mjs <client_id> <client_secret> <playlist_id> [cantidad]
//
//  Ejemplo:
//    node scripts/generar-canciones.mjs e9c478ee... dae9b315... 1SUYTwVIfNPqoeAVUZk0YO 6
//
//  El client_secret queda en tu historial de la terminal -- si te
//  preocupa, bórralo después con: history -d $(history 1) (bash) o
//  simplemente no compartas tu historial.
// ─────────────────────────────────────────────────────────────────────

import { writeFile } from 'node:fs/promises'

const [, , clientId, clientSecret, playlistId, cantidadArg] = process.argv
const cantidad = Number(cantidadArg) || 6

if (!clientId || !clientSecret || !playlistId) {
  console.error(
    'Uso: node scripts/generar-canciones.mjs <client_id> <client_secret> <playlist_id> [cantidad]'
  )
  process.exit(1)
}

async function pedirToken() {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) {
    throw new Error(`No se pudo autenticar con Spotify (${res.status}): ${await res.text()}`)
  }
  const data = await res.json()
  return data.access_token
}

function formatearDuracion(ms) {
  const totalSeg = Math.round(ms / 1000)
  const min = Math.floor(totalSeg / 60)
  const seg = String(totalSeg % 60).padStart(2, '0')
  return `${min}:${seg}`
}

async function main() {
  const token = await pedirToken()

  const res = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) {
    throw new Error(`No se pudo leer la playlist (${res.status}): ${await res.text()}`)
  }
  const data = await res.json()

  const todas = data.items.map((item) => item.track).filter(Boolean)

  // las que sí traen preview de 30s van primero -> para que el player
  // de verdad pueda sonar. Spotify no siempre da preview_url (depende
  // de licencias/mercado), así que priorizamos las que sí tienen.
  const canciones = [...todas]
    .sort((a, b) => (b.preview_url ? 1 : 0) - (a.preview_url ? 1 : 0))
    .slice(0, cantidad)
    .map((track) => ({
      titulo: track.name,
      artista: track.artists.map((a) => a.name).join(', '),
      duracion: formatearDuracion(track.duration_ms),
      preview_url: track.preview_url,
      spotify_url: track.external_urls?.spotify ?? null,
      portada: track.album?.images?.[1]?.url ?? track.album?.images?.[0]?.url ?? null,
    }))

  const sinPreview = canciones.filter((c) => !c.preview_url).length
  if (sinPreview > 0) {
    console.warn(
      `⚠ ${sinPreview} de ${canciones.length} canciones no trajeron preview de 30s. ` +
        `En el player esas se ven pero no van a poder sonar (Spotify no siempre lo da).`
    )
  }

  const destino = new URL('../src/data/canciones.json', import.meta.url)
  await writeFile(destino, JSON.stringify(canciones, null, 2) + '\n')

  console.log(`✅ Listo: ${canciones.length} canciones guardadas en src/data/canciones.json`)
}

main().catch((err) => {
  console.error('❌', err.message)
  process.exit(1)
})
