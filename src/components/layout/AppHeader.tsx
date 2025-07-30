
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
    <header className="h-16 border-0 bg-white px-8 flex items-center justify-between shadow-sm">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" strokeWidth={1} />
          <Input
            type="text"
            placeholder="Pesquisar transcrições..."
            className="pl-12 pr-4 h-12 bg-white border border-gray-200 rounded-lg focus-visible:ring-1 focus-visible:ring-blue-500 font-light text-gray-700"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative h-10 w-10 hover:bg-gray-50">
          <Bell className="w-4 h-4 text-gray-600" strokeWidth={1} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </Button>

        <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-gray-50">
          <Settings className="w-4 h-4 text-gray-600" strokeWidth={1} />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full ml-3 hover:bg-gray-50">
              <Avatar className="h-9 w-9">
                <AvatarImage src="/placeholder.svg" alt="Usuário" />
                <AvatarFallback className="bg-blue-600 text-white font-light text-xs">
                  JD
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-white shadow-lg border border-gray-200" align="end" forceMount>
            <DropdownMenuLabel className="font-light">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-normal leading-none text-gray-800">João Silva</p>
                <p className="text-xs leading-none text-gray-500 font-light">
                  joao@exemplo.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-200" />
            <DropdownMenuItem className="font-light text-gray-700 hover:bg-gray-50">Perfil</DropdownMenuItem>
            <DropdownMenuItem className="font-light text-gray-700 hover:bg-gray-50">Configurações</DropdownMenuItem>
            <DropdownMenuItem className="font-light text-gray-700 hover:bg-gray-50">Ajuda</DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-200" />
            <DropdownMenuItem className="text-red-600 font-light hover:bg-red-50">
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
