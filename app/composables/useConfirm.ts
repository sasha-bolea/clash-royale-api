// App-wide confirmation dialog, replacing the browser's native confirm().
// askConfirm(options) opens the dialog rendered by ConfirmHost (app.vue) and
// resolves true when the user confirms, false when they cancel or tap outside.

export interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
}

interface ConfirmState extends ConfirmOptions {
  resolve: (ok: boolean) => void
}

export function useConfirm() {
  const current = useState<ConfirmState | null>('ra-confirm', () => null)

  // Opens the dialog and waits for the user's answer.
  function askConfirm(options: ConfirmOptions): Promise<boolean> {
    current.value?.resolve(false)
    return new Promise((resolve) => {
      current.value = { ...options, resolve }
    })
  }

  // Closes the dialog with the given answer (used by ConfirmHost).
  function answer(ok: boolean) {
    const c = current.value
    current.value = null
    c?.resolve(ok)
  }

  return { current, askConfirm, answer }
}
