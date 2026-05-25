import type { CRPlayerProfile } from '~~/shared/types/domain'

// GET /api/cr/player/:tag → profilo giocatore CR (trofei, arena, clan)
export default defineEventHandler(async (event) => {
  const tag = getRouterParam(event, 'tag')
  if (!tag) throw createError({ statusCode: 400, statusMessage: 'tag mancante' })

  const clean = tag.replace('#', '').toUpperCase()
  try {
    return await crFetch<CRPlayerProfile>(`/players/%23${clean}`)
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 502,
      statusMessage: `Profile fetch fallito: ${err.message ?? err}`,
    })
  }
})
