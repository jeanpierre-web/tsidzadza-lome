/** Photo réduite avant stockage : petit JPEG, orientation du téléphone respectée si possible. */
export const COMPRESS_MAX_EDGE = 800
export const COMPRESS_QUALITY = 0.62
export const COMPRESS_MAX_BYTES = 20 * 1024 * 1024

export function targetSize(width: number, height: number, maxEdge = COMPRESS_MAX_EDGE): { width: number; height: number } {
  if (!(width > 0) || !(height > 0)) throw new Error('PHOTO_UNREADABLE')
  const edge = Math.max(width, height)
  if (edge <= maxEdge) return { width: Math.round(width), height: Math.round(height) }
  const scale = maxEdge / edge
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

export function photoErrorMessage(error: unknown): string {
  const code = error instanceof Error ? error.message : ''
  if (code === 'PHOTO_TOO_BIG') return 'Photo trop lourde. Tu peux continuer sans photo.'
  if (code === 'PHOTO_TYPE') return "Ce fichier n'est pas une photo. Tu peux continuer sans photo."
  return 'Photo illisible. Tu peux continuer sans photo.'
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',')
  if (comma < 0) throw new Error('PHOTO_UNREADABLE')
  const meta = dataUrl.slice(0, comma)
  const mime = /data:([^;,]+)/.exec(meta)?.[1] ?? 'application/octet-stream'
  const binary = atob(dataUrl.slice(comma + 1))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('PHOTO_UNREADABLE'))
    reader.readAsDataURL(blob)
  })
}

interface Decoded {
  width: number
  height: number
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void
  close: () => void
}

async function decode(file: File): Promise<Decoded> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file)
      return {
        width: bitmap.width,
        height: bitmap.height,
        draw: (ctx, width, height) => ctx.drawImage(bitmap, 0, 0, width, height),
        close: () => bitmap.close(),
      }
    } catch {
      /* Image() en secours (certains SVG, anciens WebView). */
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('PHOTO_UNREADABLE'))
      el.src = url
    })
    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
      draw: (ctx, width, height) => ctx.drawImage(img, 0, 0, width, height),
      close: () => URL.revokeObjectURL(url),
    }
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
}

export async function compressImage(
  file: File,
  opts?: { maxEdge?: number; quality?: number },
): Promise<{ blob: Blob; dataUrl: string }> {
  if (file.type && !file.type.startsWith('image/')) throw new Error('PHOTO_TYPE')
  if (file.size > COMPRESS_MAX_BYTES) throw new Error('PHOTO_TOO_BIG')
  const decoded = await decode(file)
  try {
    const size = targetSize(decoded.width, decoded.height, opts?.maxEdge ?? COMPRESS_MAX_EDGE)
    const canvas = document.createElement('canvas')
    canvas.width = size.width
    canvas.height = size.height
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) throw new Error('PHOTO_UNREADABLE')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size.width, size.height)
    decoded.draw(ctx, size.width, size.height)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => (result ? resolve(result) : reject(new Error('PHOTO_UNREADABLE'))), 'image/jpeg', opts?.quality ?? COMPRESS_QUALITY)
    })
    return { blob, dataUrl: await blobToDataUrl(blob) }
  } finally {
    decoded.close()
  }
}
