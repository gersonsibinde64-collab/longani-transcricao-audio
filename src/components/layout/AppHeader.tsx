
import { Search, Bell, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppHeader() {
  return (
    <header className="h-16 border-b border-border bg-white px-8 flex items-center justify-between">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" strokeWidth={1.5} />
          <Input
            type="text"
            placeholder="Pesquisar transcrições..."
            className="pl-10 pr-4 h-10 bg-white border border-input focus-visible:ring-1 focus-visible:ring-primary font-light"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="w-4 h-4" strokeWidth={1.5} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full"></span>
        </Button>

        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Settings className="w-4 h-4" strokeWidth={1.5} />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full ml-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg" alt="Usuário" />
                <AvatarFallback className="bg-primary text-primary-foreground font-light text-xs">
                  JD
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-white shadow-card-lg" align="end" forceMount>
            <DropdownMenuLabel className="font-light">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-normal leading-none">João Silva</p>
                <p className="text-xs leading-none text-muted-foreground font-light">
                  joao@exemplo.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="font-light">Perfil</DropdownMenuItem>
            <DropdownMenuItem className="font-light">Configurações</DropdownMenuItem>
            <DropdownMenuItem className="font-light">Ajuda</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive font-light">
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
