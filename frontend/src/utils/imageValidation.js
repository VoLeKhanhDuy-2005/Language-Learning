// Validates the magic bytes of a file to ensure it is a genuine PNG, JPEG/JPG, or WebP image.

export const validateImageMagicBytes = (file) => {
  return new Promise((resolve) => {
    if (!file) {
      resolve(false)
      return
    }

    const reader = new FileReader()
    reader.onloadend = (e) => {
      if (e.target.readyState !== FileReader.DONE) {
        resolve(false)
        return
      }

      const arr = new Uint8Array(e.target.result)
      let header = ''
      for (let i = 0; i < arr.length; i++) {
        header += arr[i].toString(16).padStart(2, '0')
      }
      header = header.toLowerCase()

      // 1. PNG: starts with 89 50 4e 47 (hex)
      if (header.startsWith('89504e47')) {
        resolve(true)
        return
      }

      // 2. JPEG: starts with ff d8 ff
      if (header.startsWith('ffd8ff')) {
        resolve(true)
        return
      }

      // 3. WebP: RIFF (52 49 46 46) at start, WEBP (57 45 42 50) at offset 8
      if (header.startsWith('52494646') && header.substring(16, 24) === '57454250') {
        resolve(true)
        return
      }

      resolve(false)
    }

    // Read the first 12 bytes of the file
    const blob = file.slice(0, 12)
    reader.readAsArrayBuffer(blob)
  })
}
