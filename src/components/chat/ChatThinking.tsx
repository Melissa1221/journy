"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, Loader2, Check } from "lucide-react";
import type { ThinkingStep } from "@/hooks/useJourniChat";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const TOOL_NAMES: Record<string, string> = {
  register_expense: "📝 Registrar gasto",
  edit_expense: "✏️ Editar gasto",
  delete_expense: "🗑️ Eliminar gasto",
  get_balance: "💰 Consultar balance",
  get_debts: "📊 Calcular deudas",
  list_expenses: "📋 Listar gastos",
  register_payment: "💸 Registrar pago",
  create_milestone: "📍 Crear momento",
  register_photo: "📸 Registrar foto",
  list_milestones: "🗺️ Listar momentos",
  list_photos: "🖼️ Listar fotos",
};

interface ChatThinkingProps {
  steps: ThinkingStep[];
  isComplete: boolean;
  className?: string;
}

export function ChatThinking({ steps, isComplete, className }: ChatThinkingProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (steps.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn("mb-2", className)}>
      <div className="rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-200 dark:border-violet-800 p-3">
        <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
          <ChevronRight
            className={cn(
              "h-4 w-4 text-violet-600 transition-transform duration-200",
              isOpen && "rotate-90"
            )}
          />
          <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
            {isComplete ? "🧠 Razonamiento completado" : "🧠 Pensando..."}
          </span>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-2 pl-4 border-l-2 border-violet-200 dark:border-violet-700 space-y-2">
          {steps.map((step, index) => (
            <ThinkingStepItem key={index} step={step} />
          ))}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function ThinkingStepItem({ step }: { step: ThinkingStep }) {
  const toolName = step.tool_name ? TOOL_NAMES[step.tool_name] || step.tool_name : "Procesando";
  const isComplete = step.status === "complete";

  return (
    <div className="flex items-start gap-2 py-1">
      <div
        className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5",
          isComplete
            ? "bg-green-100 dark:bg-green-900/30"
            : "bg-violet-100 dark:bg-violet-900/30 animate-pulse"
        )}
      >
        {isComplete ? (
          <Check className="h-3 w-3 text-green-600" />
        ) : (
          <Loader2 className="h-3 w-3 text-violet-600 animate-spin" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {toolName}
        </span>
        {step.result && (
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
            — {step.result.slice(0, 100)}{step.result.length > 100 ? "..." : ""}
          </span>
        )}
      </div>
    </div>
  );
}
