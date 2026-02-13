import Link from "next/link";

const items = [
  { href: "/atividades", label: "Atividades" },
  { href: "/materias", label: "Matérias" },
  { href: "/ranking", label: "Ranking" },
  { href: "/cla", label: "Clã" },
  { href: "/perfil", label: "Perfil" }
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <h2>Study Arena</h2>
      <p className="muted">Competição + XP + Retenção</p>
      <nav>
        {items.map((item) => (
          <Link className="menuItem" key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
