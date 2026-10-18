import { TopBar } from "@/components/nav/TopBar";
import { BottomNav } from "@/components/nav/BottomNav";
import { SideNav } from "@/components/nav/SideNav";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh">
      <SideNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        {/* pb-24 reserva espaço para a barra inferior no celular */}
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-24 pt-2 md:pb-8">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
