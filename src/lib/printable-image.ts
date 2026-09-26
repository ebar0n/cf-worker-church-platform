// Normalize browser-decodable image formats before storing enrollment attachments.
// The Worker embeds JPEG/PNG directly; PDF files stay unchanged.
export async function printableImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || ['image/jpeg', 'image/png'].includes(file.type))
    return file;
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 2400 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('No se pudo convertir la imagen');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) => (value ? resolve(value) : reject(new Error('No se pudo convertir la imagen'))),
        'image/jpeg',
        0.92
      )
    );
    return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg' });
  } catch {
    throw new Error(
      'Este navegador no puede preparar esta imagen para imprimir. Conviértela a JPG o PNG y vuelve a subirla.'
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
