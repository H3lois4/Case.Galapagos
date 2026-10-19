import { Logo } from "@/components/brand/LogoMark";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-fundo-alt px-4 py-10">
      <div className="mb-6">
        <Logo />
      </div>
      <div className="w-full max-w-sm rounded-card border border-borda bg-fundo p-6 shadow-[var(--sombra-card)]">
        {children}
      </div>
      <p className="mt-6 max-w-sm text-center text-[12px] text-tinta-suave">
        Por ELAS finance · educação e carreira no mercado financeiro
      </p>
    </div>
  );
}
