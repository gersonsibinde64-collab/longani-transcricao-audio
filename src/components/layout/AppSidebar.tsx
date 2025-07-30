
import { NavLink, useLocation } from "react-router-dom";
import { BarChart3, FileText, Plus, User, Home } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Transcrições", url: "/transcricoes", icon: FileText },
  { title: "Nova Transcrição", url: "/nova-transcricao", icon: Plus },
  { title: "Estatísticas", url: "/estatisticas", icon: BarChart3 },
  { title: "Perfil", url: "/perfil", icon: User },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath.startsWith(path)) return true;
    return false;
  };

  const getNavClasses = (path: string) => {
    const baseClasses = "w-full justify-start gap-6 px-8 py-5 text-sm font-light transition-all hover:bg-blue-50 rounded-none border-0";
    return isActive(path) 
      ? `${baseClasses} bg-blue-50 text-blue-600 font-normal`
      : `${baseClasses} text-gray-700 hover:text-blue-600`;
  };

  return (
    <Sidebar className="w-64 bg-white border-0 shadow-none">
      <div className="p-8 border-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" strokeWidth={1} />
          </div>
          <div>
            <h1 className="text-xl font-light text-gray-800">Longani</h1>
            <p className="text-xs font-light text-gray-500">v1 Beta</p>
          </div>
        </div>
      </div>

      <SidebarContent className="px-0 py-6">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClasses(item.url)}>
                      <item.icon className="w-5 h-5" strokeWidth={1} />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
