// ─────────────────────────────────────────────────────────────────────
//  Jala unas canciones de tu playlist de Spotify y las guarda en
//  src/data/canciones.json. Se corre UNA VEZ, en tu compu.
//
//  ANTES DE CORRERLO:
//    1. En developer.spotify.com/dashboard -> tu app -> Settings ->
//       Redirect URIs, agrega (si no lo has hecho ya):
//         http://127.0.0.1:8888/callback
//    2. Guarda la playlist en tu librería de Spotify (el corazón /
//       "Guardar"), si no lo está ya.
//
//  Uso (desde la raíz del proyecto):
//    node scripts/generar-canciones-login.mjs <client_id> <playlist_id> [cantidad]
//
//  Nota técnica (por si algún día vuelve a tronar): el endpoint
//  GET /playlists/{id}/tracks está restringido para apps normales,
//  pero GET /playlists/{id} (metadata) SÍ funciona y ya trae las
//  canciones incluidas en tracks.items -> por eso este script pide
//  ese endpoint y no el de /tracks.
// ─────────────────────────────────────────────────────────────────────

import { createServer } from 'node:http'
import { randomBytes, createHash } from 'node:crypto'
import { writeFile } from 'node:fs/promises'

const [, , clientId, playlistId, cantidadArg] = process.argv
const cantidad = Number(cantidadArg) || 6
const PUERTO = 8888
const REDIRECT_URI = `http://127.0.0.1:${PUERTO}/callback`

if (!clientId || !playlistId) {
  console.error(
    'Uso: node scripts/generar-canciones-login.mjs <client_id> <playlist_id> [cantidad]'
  )
  process.exit(1)
}

function base64url(buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function formatearDuracion(ms) {
  const totalSeg = Math.round(ms / 1000)
  const min = Math.floor(totalSeg / 60)
  const seg = String(totalSeg % 60).padStart(2, '0')
  return `${min}:${seg}`
}

const codeVerifier = base64url(randomBytes(64))
const codeChallenge = base64url(createHash('sha256').update(codeVerifier).digest())
const state = base64url(randomBytes(16))

const authorizeUrl = new URL('https://accounts.spotify.com/authorize')
authorizeUrl.searchParams.set('client_id', clientId)
authorizeUrl.searchParams.set('response_type', 'code')
authorizeUrl.searchParams.set('redirect_uri', REDIRECT_URI)
authorizeUrl.searchParams.set('code_challenge_method', 'S256')
authorizeUrl.searchParams.set('code_challenge', codeChallenge)
authorizeUrl.searchParams.set('state', state)
authorizeUrl.searchParams.set('scope', 'playlist-read-private playlist-read-collaborative')

console.log('\n1. Abre esta liga, inicia sesión y dale "Agree":\n')
console.log(authorizeUrl.toString())
console.log('\nEsperando a que autorices (no cierres esta terminal)...\n')

const server = createServer((req, res) => {
  const url = new URL(req.url, REDIRECT_URI)
  if (url.pathname !== '/callback') {
    res.writeHead(404)
    res.end()
    return
  }

  const code = url.searchParams.get('code')
  const recibidoState = url.searchParams.get('state')
  const errorSpotify = url.searchParams.get('error')

  if (errorSpotify || !code || recibidoState !== state) {
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end('<h1>Algo salió mal. Regresa a la terminal.</h1>')
    server.close()
    console.error('❌ No se completó la autorización:', errorSpotify || 'código o state inválido')
    process.exit(1)
    return
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end('<h1>Listo, ya puedes cerrar esta pestaña y regresar a la terminal.</h1>')
  server.close()

  continuar(code).catch((err) => {
    console.error('❌', err.message)
    process.exit(1)
  })
})

server.listen(PUERTO)

async function continuar(code) {
  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: clientId,
      code_verifier: codeVerifier,
    }),
  })

  if (!tokenRes.ok) {
    throw new Error(
      `No se pudo cambiar el código por un token (${tokenRes.status}): ${await tokenRes.text()}`
    )
  }

  const { access_token } = await tokenRes.json()

  // el truco: pedimos la playlist completa (que sí funciona) en vez del
  // endpoint /tracks (que Spotify tiene restringido) -> la respuesta ya
  // trae las canciones adentro, en tracks.items
  const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
    headers: { Authorization: `Bearer ${access_token}` },
  })

  if (!res.ok) {
    throw new Error(`No se pudo leer la playlist (${res.status}): ${await res.text()}`)
  }

  const data = await res.json()

  if (!data.tracks) {
    console.log('La respuesta no trae "tracks". Llaves que sí trae:', Object.keys(data))
    console.log('Respuesta completa:\n', JSON.stringify(data, null, 2))
    throw new Error('La respuesta de Spotify no trae el campo "tracks" (ver arriba).')
  }

  const itemsCrudos = data.tracks.items ?? []
  const todas = itemsCrudos.map((item) => item.track).filter(Boolean)

  console.log(
    `Diagnóstico: total reportado=${data.tracks.total ?? '?'}, items recibidos=${itemsCrudos.length}, con track válido=${todas.length}`
  )

  if (todas.length === 0) {
    console.log('Primer item crudo (para ver qué trae):', JSON.stringify(itemsCrudos[0], null, 2))
    throw new Error('La playlist se leyó bien pero no trae canciones utilizables.')
  }

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
        `En el player esas se ven pero no van a poder sonar.`
    )
  }

  const destino = new URL('../src/data/canciones.json', import.meta.url)
  await writeFile(destino, JSON.stringify(canciones, null, 2) + '\n')

  console.log(`✅ Listo: ${canciones.length} canciones (de "${data.name}") guardadas en src/data/canciones.json`)
  process.exit(0)
}
