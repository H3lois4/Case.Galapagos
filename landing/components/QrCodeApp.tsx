import QRCode from "qrcode";

/**
 * QR code do link do app, gerado no build (SVG nítido em qualquer tamanho).
 * Sempre vinho sobre fundo claro, inclusive no modo escuro: QR claro sobre
 * escuro falha em vários leitores de câmera.
 */
export async function QrCodeApp({ url }: { url: string }) {
  const svg = await QRCode.toString(url, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#990521", light: "#ffffff" },
  });

  return (
    <div
      role="img"
      aria-label={`QR code que abre ${url}`}
      className="w-full [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
      // SVG gerado aqui no build a partir da nossa própria URL (sem entrada de usuária).
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
