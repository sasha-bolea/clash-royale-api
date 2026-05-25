<script setup lang="ts">
import { Chart, registerables } from 'chart.js'
import type { Player, Tournament } from '~~/shared/types/domain'

Chart.register(...registerables)

type ChartFilter = '1m' | '3m' | 'sempre'

const props = defineProps<{
  tournaments: Tournament[]
  players: Player[]
  filter: ChartFilter
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const empty = ref(false)

function pointsInTournament(t: Tournament, username: string): number {
  const participantUsernames = (t.tournament_players ?? []).map(tp => tp.players.username)
  const winCounts: Record<string, number> = {}
  participantUsernames.forEach((u) => { winCounts[u] = 0 })
  ;(t.tournament_matches ?? []).forEach((m) => {
    if (m.winner && winCounts[m.winner.username] !== undefined) {
      winCounts[m.winner.username]!++
    }
  })
  const ranked = [...participantUsernames].sort((a, b) => (winCounts[b] ?? 0) - (winCounts[a] ?? 0))
  const pos = ranked.indexOf(username) + 1
  return pos > 0 ? (POINTS_BY_PLACE[pos] ?? 0) : 0
}

function buildChart() {
  if (chart) {
    chart.destroy()
    chart = null
  }
  const canvas = canvasRef.value
  if (!canvas) return

  Chart.defaults.font.family = 'ClashRoyale, serif'
  Chart.defaults.font.size = 10

  const now = new Date()
  let cutoff: Date | null = null
  if (props.filter === '1m') cutoff = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
  if (props.filter === '3m') cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())

  const allSorted = [...props.tournaments].sort(
    (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime(),
  )
  const sorted = cutoff ? allSorted.filter(t => new Date(t.started_at) >= cutoff!) : allSorted

  if (sorted.length === 0) {
    empty.value = true
    return
  }
  empty.value = false

  const labels = sorted.map(t =>
    new Date(t.started_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
  )

  // Punti accumulati pre-finestra
  const cumPoints: Record<string, number> = {}
  props.players.forEach((p) => { cumPoints[p.username] = 0 })
  if (cutoff) {
    allSorted.filter(t => new Date(t.started_at) < cutoff!).forEach((t) => {
      const partSet = new Set((t.tournament_players ?? []).map(tp => tp.players.username))
      props.players.forEach((p) => {
        if (partSet.has(p.username)) cumPoints[p.username]! += pointsInTournament(t, p.username)
      })
    })
  }

  const activeInPeriod = new Set(
    sorted.flatMap(t => (t.tournament_players ?? []).map(tp => tp.players.username)),
  )

  const seriesData: Record<string, number[]> = {}
  props.players.forEach((p) => { seriesData[p.username] = [] })

  sorted.forEach((t) => {
    const partSet = new Set((t.tournament_players ?? []).map(tp => tp.players.username))
    props.players.forEach((p) => {
      if (partSet.has(p.username)) cumPoints[p.username]! += pointsInTournament(t, p.username)
      seriesData[p.username]!.push(cumPoints[p.username]!)
    })
  })

  const colors = ['#f5c842', '#7eb8f7', '#f77e7e', '#7ef7a0', '#f7a07e', '#c07ef7']
  const datasets = props.players
    .filter(p => activeInPeriod.has(p.username))
    .map((p) => {
      const colorIdx = props.players.indexOf(p)
      const col = colors[colorIdx % colors.length]!
      return {
        label: p.username,
        data: seriesData[p.username]!,
        borderColor: col,
        backgroundColor: col + '33',
        borderWidth: 2,
        pointRadius: 4,
        tension: 0.3,
        fill: false,
      }
    })

  chart = new Chart(canvas, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#e8d9c0',
            boxWidth: 12,
            font: { family: 'ClashRoyale, serif', size: 11 },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: '#8a7f6e', maxRotation: 45, font: { family: 'ClashRoyale, serif', size: 10 } },
          grid: { color: 'rgba(255,255,255,0.05)' },
        },
        y: {
          ticks: { color: '#8a7f6e', stepSize: 1, font: { family: 'ClashRoyale, serif', size: 10 } },
          grid: { color: 'rgba(255,255,255,0.05)' },
          beginAtZero: true,
        },
      },
    },
  })
}

onMounted(async () => {
  await (document as any).fonts?.load?.('10px "ClashRoyale"').catch(() => {})
  buildChart()
})
watch(() => [props.filter, props.tournaments, props.players], () => buildChart(), { deep: true })
onBeforeUnmount(() => { chart?.destroy(); chart = null })
</script>

<template>
  <div class="ts-chart-wrap">
    <p v-if="empty" class="empty-msg" style="text-align:center;padding:24px 0">
      Nessun torneo nel periodo
    </p>
    <canvas v-show="!empty" ref="canvasRef" id="ts-chart"></canvas>
  </div>
</template>
