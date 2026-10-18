import {
  GraduationCap,
  Compass,
  MessageCircleHeart,
  Mic,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  rotulo: string;
  Icone: LucideIcon;
}

export const navItems: NavItem[] = [
  { href: "/aulas", rotulo: "Aulas", Icone: GraduationCap },
  { href: "/carreira", rotulo: "Carreira", Icone: Compass },
  { href: "/mentoria", rotulo: "Mentoria", Icone: MessageCircleHeart },
  { href: "/pratica", rotulo: "Prática", Icone: Mic },
  { href: "/rede", rotulo: "Rede", Icone: Users },
];
