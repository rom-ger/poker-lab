/** Копирование текста: Clipboard API или fallback для HTTP / LAN. */
export async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      /* fallback */
    }
  }

  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}

/** Ссылка для гостей (HashRouter: путь в #, без name/create). */
export function getShareableRoomUrl(): string {
  const base = `${window.location.origin}${window.location.pathname}`
  const match = window.location.hash.match(/^#\/room\/([a-z0-9]+)/)
  if (match) {
    return `${base}#/room/${match[1]}`
  }
  return `${base}#/`
}
