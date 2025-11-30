"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, PlusCircle, LogOut, MessageCircle } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import BackButton from "@/components/BackButton";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/UserAvatar";
import { LinkWhatsAppDialog } from "@/components/LinkWhatsAppDialog";

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);

  const navItems = [
    { path: "/dashboard", icon: Home, label: "Mis Viajes" },
    { path: "/create-session", icon: PlusCircle, label: "Crear Viaje" },
  ];

  // Show back button on pages that are not dashboard or create-session
  const showBackButton = !pathname.startsWith("/dashboard") && !pathname.startsWith("/create-session");

  const userName = user?.user_metadata?.full_name || user?.email || "Usuario";

  return (
    <header className="fixed top-0 z-50 w-full border-b border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBackButton && <BackButton />}
          <button
            onClick={() => router.push("/dashboard")}
            className="text-2xl font-bold bg-gradient-to-r from-primary via-accent-foreground to-blue-deep bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            Journi
          </button>
        </div>

        <nav className="flex items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || pathname.startsWith(item.path);

            return (
              <Button
                key={item.path}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => router.push(item.path)}
                className="gap-2"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Button>
            );
          })}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <UserAvatar name={userName} size="sm" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {userName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowWhatsAppDialog(true)}
                className="cursor-pointer"
              >
                <MessageCircle className="mr-2 h-4 w-4 text-green-600" />
                Vincular WhatsApp
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-red-600 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>

      {/* WhatsApp Linking Dialog */}
      <LinkWhatsAppDialog
        open={showWhatsAppDialog}
        onOpenChange={setShowWhatsAppDialog}
      />
    </header>
  );
};

export default Header;
