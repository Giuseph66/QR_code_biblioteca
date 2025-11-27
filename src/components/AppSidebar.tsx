import { Home, History, Settings, Sun, Moon, LayoutDashboard } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useSearchParams } from "react-router-dom";
import { useTheme } from "@/providers/ThemeProvider";
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
  const { theme, setTheme } = useTheme();
  
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
      </SidebarFooter>
    </Sidebar>
  );
}
