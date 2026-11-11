/**
 * Endereço do app. Usado nos botões e no QR code (gerado no build).
 * Configure NEXT_PUBLIC_APP_URL na Vercel; sem ela, usa o padrão abaixo.
 */
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://porelas.app").replace(
  /\/+$/,
  "",
);

/** Endereço sem "https://", para exibir ("porelas.app"). */
export const APP_URL_EXIBICAO = APP_URL.replace(/^https?:\/\//, "");
