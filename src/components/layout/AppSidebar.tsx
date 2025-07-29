
import { NavLink, useLocation } from "react-router-dom";
import { BarChart3, FileText, Upload, User, Home } from "lucide-react";
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
  { title: "Nova Transcrição", url: "/nova-transcricao", icon: Upload },
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
    const baseClasses = "w-full justify-start gap-4 px-6 py-4 text-sm font-light transition-all hover:bg-accent rounded-none border-r-2 border-transparent";
    return isActive(path) 
      ? `${baseClasses} bg-accent text-primary border-r-primary font-normal`
      : `${baseClasses} text-foreground hover:text-primary`;
  };

  return (
    <Sidebar className="w-60 bg-white border-r border-border">
      <div className="p-8 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-xl font-normal text-foreground">Longani</h1>
            <p className="text-xs font-light text-muted-foreground">v1 Beta</p>
          </div>
        </div>
      </div>

      <SidebarContent className="px-0 py-8">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClasses(item.url)}>
                      <item.icon className="w-5 h-5" strokeWidth={1.5} />
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
