import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FanPulse — Copa 2026 | Vote nos seus jogadores favoritos",
  description:
    "Participe da maior votação de fãs e ajude a escolher os melhores jogadores da Copa do Mundo 2026. Vote, acompanhe o ranking ao vivo e torça pelo seu favorito!",
  keywords: [
    "Copa do Mundo 2026",
    "votação futebol",
    "FanPulse",
    "melhor jogador",
    "ranking Copa",
  ],
  openGraph: {
    title: "FanPulse — Copa 2026",
    description: "Vote nos seus jogadores favoritos da Copa do Mundo 2026!",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Tailwind CSS via CDN (dev) — em produção será via PostCSS build */}
        <script src="https://cdn.tailwindcss.com"></script>
        {/* Google Font: Poppins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}