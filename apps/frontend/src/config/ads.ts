// ─── Google AdSense ────────────────────────────────────────────────────────────
// 1. Cadastre-se em https://adsense.google.com
// 2. Adicione seu domínio e aguarde aprovação (~2-4 semanas)
// 3. Substitua os valores abaixo pelos gerados no painel do AdSense

export const ADSENSE_CLIENT = "ca-pub-4881546824923533"; // Publisher ID

export const AD_SLOTS = {
  // Criado em AdSense → Anúncios → Por bloco de anúncios → Anúncios gráficos e de texto
  horizontal: "XXXXXXXXXX", // formato: Leaderboard 728x90
  rectangle: "XXXXXXXXXX", // formato: Retângulo médio 300x250
} as const;

export type AdVariant = keyof typeof AD_SLOTS;
