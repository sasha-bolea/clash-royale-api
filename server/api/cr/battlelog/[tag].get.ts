import type { CRBattle } from '~~/shared/types/domain'

// GET /api/cr/battlelog/:tag → battlelog giocatore CR (array)
export default defineEventHandler(async (event) => {
  const tag = getRouterParam(event, 'tag')
  if (!tag) throw createError({ statusCode: 400, statusMessage: 'tag mancante' })

  const clean = tag.replace('#', '').toUpperCase()
  try {
    const json = await crFetch<CRBattle[] | { items: CRBattle[] }>(
      `/players/%23${clean}/battlelog`,
    )
    return Array.isArray(json) ? json : (json.items ?? [])
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 502,
      statusMessage: `Battlelog fetch fallito: ${err.message ?? err}`,
    })
  }
})
