"use client";

import { Button } from "@/components/ui/button";
import { Home, PlusCircle, User } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import BackButton from "@/components/BackButton";

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { path: "/dashboard", icon: Home, label: "Mis Viajes" },
    { path: "/create-session", icon: PlusCircle, label: "Crear Viaje" },
  ];

  // Show back button on pages that are not dashboard or create-session
  const showBackButton = !pathname.startsWith("/dashboard") && !pathname.startsWith("/create-session");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBackButton && <BackButton />}
          <button
            onClick={() => router.push("/dashboard")}
            className="text-2xl font-bold bg-gradient-to-r from-primary via-accent-foreground to-blue-deep bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            TravelMemory
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
        </nav>
      </div>
    </header>
  );
};

export default Header;
