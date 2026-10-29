import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Regra nova e rígida do react-hooks@7; rebaixada para aviso (o padrão
      // de inicialização via efeito aqui é intencional e já testado).
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // Service worker e artefatos do PWA gerados pelo Serwist (não editar à mão)
      "public/sw.js",
      "public/sw.js.map",
      "public/swe-worker-*.js",
    ],
  },
];

export default eslintConfig;
