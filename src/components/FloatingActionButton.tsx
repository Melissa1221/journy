"use client";

import { useState } from "react";
import { Plus, X, DollarSign, Camera, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  onAddExpense?: () => void;
  onAddPhoto?: () => void;
  onAddNote?: () => void;
}

const FloatingActionButton = ({
  onAddExpense,
  onAddPhoto,
  onAddNote,
}: FloatingActionButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      icon: DollarSign,
      label: "Gasto",
      color: "bg-coral hover:bg-coral/90",
      onClick: onAddExpense,
    },
    {
      icon: Camera,
      label: "Foto",
      color: "bg-greenNature hover:bg-greenNature/90",
      onClick: onAddPhoto,
    },
    {
      icon: FileText,
      label: "Nota",
      color: "bg-blueSnow hover:bg-blueSnow/90",
      onClick: onAddNote,
    },
  ];

  const handleActionClick = (onClick?: () => void) => {
    setIsOpen(false);
    onClick?.();
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Action Menu */}
      <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-50">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="absolute bottom-20 right-0 flex flex-col gap-3 mb-4"
            >
              {actions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.div
                    key={action.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    {/* Label */}
                    <span className="bg-card text-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg border border-border/50">
                      {action.label}
                    </span>

                    {/* Action Button */}
                    <Button
                      size="icon"
                      className={cn(
                        "h-12 w-12 rounded-full shadow-lg text-white",
                        action.color
                      )}
                      onClick={() => handleActionClick(action.onClick)}
                    >
                      <Icon className="h-5 w-5" />
                    </Button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center transition-all",
            isOpen && "rotate-45"
          )}
        >
          {isOpen ? <X className="h-7 w-7" /> : <Plus className="h-7 w-7" />}
        </motion.button>
      </div>
    </>
  );
};

export default FloatingActionButton;
