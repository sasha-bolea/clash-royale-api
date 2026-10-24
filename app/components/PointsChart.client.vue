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

function buildChart() {
  if (chart) {
    chart.destroy()
    chart = null
  }
  const canvas = canvasRef.value
  if (!canvas) return

  Chart.defaults.font.family = 'Lilita One, serif'
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

  const activeInPeriod = new Set(
    sorted.flatMap(t => (t.tournament_players ?? []).map(tp => tp.players.id)),
  )
  const seriesData = winRateSeries(sorted, props.players.map(p => p.id))

  // Series colours from the UI kit palette (gold, blue, red, green, bronze, violet).
  const colors = ['#ffd23f', '#8cc4ff', '#ff5c5c', '#4be08a', '#e08a4a', '#c07ef7']
  const datasets = props.players
    .filter(p => activeInPeriod.has(p.id))
    .map((p) => {
      const colorIdx = props.players.indexOf(p)
      const col = colors[colorIdx % colors.length]!
      return {
        label: p.username,
        data: seriesData[p.id]!,
        borderColor: col,
        backgroundColor: col + '33',
        borderWidth: 3,
        pointRadius: 4,
        pointBorderColor: '#03061a',
        pointBorderWidth: 2,
        pointBackgroundColor: col,
        tension: 0.3,
        fill: false,
        spanGaps: true,
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
            color: '#c9d3f5',
            boxWidth: 12,
            font: { family: 'Lilita One, serif', size: 11 },
          },
        },
        tooltip: {
          callbacks: { label: c => `${c.dataset.label}: ${c.parsed.y}%` },
        },
      },
      scales: {
        x: {
          ticks: { color: '#8a96c8', maxRotation: 45, font: { family: 'Lilita One, serif', size: 10 } },
          grid: { color: 'rgba(140,196,255,0.08)' },
        },
        y: {
          ticks: { color: '#8a96c8', stepSize: 25, callback: v => `${v}%`, font: { family: 'Lilita One, serif', size: 10 } },
          grid: { color: 'rgba(140,196,255,0.08)' },
          min: 0,
          max: 100,
        },
      },
    },
  })
}

onMounted(async () => {
  await (document as any).fonts?.load?.('10px "Lilita One"').catch(() => {})
  buildChart()
})
watch(() => [props.filter, props.tournaments, props.players], () => buildChart(), { deep: true })
onBeforeUnmount(() => { chart?.destroy(); chart = null })
</script>

<template>
  <div class="ts-chart-wrap">
    <p v-if="empty" class="ra-waiting">
      Nessun torneo nel periodo
    </p>
    <canvas v-show="!empty" ref="canvasRef" id="ts-chart"></canvas>
  </div>
</template>
