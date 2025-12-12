import { Home, History, Settings, Sun, Moon, LayoutDashboard, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { useTheme } from "@/providers/ThemeProvider";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();
  
  const isSessionRoute = location.pathname.startsWith('/session/');
  const sessionId = isSessionRoute ? location.pathname.split('/')[2] : null;

  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;

  const items = [
    { title: "Início", url: "/", icon: Home },
    { title: "Painel", url: "/dashboard", icon: LayoutDashboard },
  ];

  if (sessionId) {
    items.push({ title: "Configurações", url: `/config?session=${sessionId}`, icon: Settings });
  } else {
    items.push({ title: "Configurações", url: `/config?global=true`, icon: Settings });
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogout = async () => {
    try {
      await signOut();
      // Usar replace para evitar problemas de navegação
      navigate("/login", { replace: true });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Mesmo com erro, redirecionar para login
      navigate("/login", { replace: true });
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel><span>Menu</span></SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="default"
            onClick={toggleTheme}
            className="w-full justify-start"
          >
            {theme === "dark" ? (
              <>
                <Sun className="h-4 w-4" />
                <span className="ml-2">Tema Claro</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4" />
                <span className="ml-2">Tema Escuro</span>
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="default"
            onClick={handleLogout}
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            <span className="ml-2">Sair</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
