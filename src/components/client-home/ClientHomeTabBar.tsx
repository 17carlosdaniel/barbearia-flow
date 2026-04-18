import { Home, Search, Calendar as CalendarIcon, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const tabs = [
  { label: "Início", path: "/cliente", icon: Home },
  { label: "Buscar", path: "/cliente/buscar", icon: Search },
  { label: "Agenda", path: "/cliente/agendamentos", icon: CalendarIcon },
  { label: "Perfil", path: "/cliente/perfil", icon: User },
];

const ClientHomeTabBar = () => {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-md home-tabbar-glass rounded-2xl px-2 py-2">
      <div className="grid grid-cols-4 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
                active ? "text-primary bg-primary/10" : "text-muted-foreground"
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? "home-tab-active" : ""}`} />
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default ClientHomeTabBar;
