"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, Wallet, Map, User } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const MobileNav = () => {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      name: "Inicio",
      icon: Home,
      path: "/dashboard",
      color: "text-primary",
    },
    {
      name: "Gastos",
      icon: Wallet,
      path: "/expenses",
      color: "text-coral",
    },
    {
      name: "Recuerdos",
      icon: Map,
      path: "/memories",
      color: "text-greenNature",
    },
    {
      name: "Perfil",
      icon: User,
      path: "/profile",
      color: "text-blueSnow",
    },
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Navigation - Only visible on mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border/50 pb-safe">
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className="relative flex flex-col items-center justify-center gap-1 transition-colors"
              >
                {/* Active indicator */}
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-b-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}

                {/* Icon */}
                <Icon
                  className={cn(
                    "h-6 w-6 transition-all",
                    active ? item.color : "text-muted-foreground"
                  )}
                />

                {/* Label */}
                <span
                  className={cn(
                    "text-xs font-medium transition-all",
                    active ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Spacer for mobile nav - prevents content from being hidden */}
      <div className="md:hidden h-16" />
    </>
  );
};

export default MobileNav;
