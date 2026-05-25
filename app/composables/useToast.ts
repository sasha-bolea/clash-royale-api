// Stato globale toast condiviso (singleton via useState).
export function useToast() {
  const message = useState<string>('toast-message', () => '')
  const visible = useState<boolean>('toast-visible', () => false)
  let hideTimer: ReturnType<typeof setTimeout> | null = null

  function showToast(msg: string) {
    message.value = msg
    visible.value = true
    if (hideTimer) clearTimeout(hideTimer)
    hideTimer = setTimeout(() => { visible.value = false }, 2500)
  }

  function showError(msg: string) {
    console.error(msg)
    showToast(msg)
  }

  return { message, visible, showToast, showError }
}
