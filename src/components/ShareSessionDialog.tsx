import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Share2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface ShareSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionName: string;
  sessionCode: string;
}

const ShareSessionDialog = ({ open, onOpenChange, sessionName, sessionCode }: ShareSessionDialogProps) => {
  const [copied, setCopied] = useState(false);
  const sessionUrl = typeof window !== 'undefined' ? `${window.location.origin}/join/${sessionCode}` : '';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sessionCode);
    setCopied(true);
    toast({
      title: "¡Código copiado!",
      description: "El código de sesión se copió al portapapeles",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(sessionUrl);
    toast({
      title: "¡Link copiado!",
      description: "El enlace de la sesión se copió al portapapeles",
    });
  };

  const handleShareWhatsApp = () => {
    const message = `¡Únete a nuestra sesión de gastos compartidos! 🎉\n\n📋 Sesión: ${sessionName}\n🔑 Código: ${sessionCode}\n🔗 Link: ${sessionUrl}\n\nO ingresa el código en la app para unirte.`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[24px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">¡Sesión creada! 🎉</DialogTitle>
          <DialogDescription className="text-base">
            Comparte este código con tu grupo para que se unan
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Session Info */}
          <div className="bg-primary/10 rounded-2xl p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">Sesión</p>
            <p className="text-xl font-bold">{sessionName}</p>
          </div>

          {/* Code Display */}
          <div className="space-y-3">
            <label className="text-sm font-semibold">Código de sesión</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-card border-2 border-primary/20 rounded-2xl px-6 py-4 text-center">
                <p className="text-3xl font-bold text-primary tracking-wider">
                  {sessionCode}
                </p>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleCopyCode}
                  className="h-full w-14 rounded-2xl"
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                      >
                        <CheckCircle2 className="h-5 w-5 text-accent-foreground" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Copy className="h-5 w-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Link */}
          <div className="space-y-3">
            <label className="text-sm font-semibold">Enlace de invitación</label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={sessionUrl}
                className="rounded-full text-sm"
              />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="rounded-full flex-shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="space-y-3">
            <label className="text-sm font-semibold">Compartir por</label>
            <div className="grid grid-cols-2 gap-3">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  variant="default"
                  className="w-full rounded-full"
                  onClick={handleShareWhatsApp}
                >
                  <svg
                    className="h-5 w-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  WhatsApp
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  variant="outline"
                  className="w-full rounded-full"
                  onClick={handleCopyCode}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Copiar código
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-accent/10 rounded-2xl p-4 border border-accent/20">
            <p className="text-sm text-muted-foreground">
              💡 <span className="font-semibold">Tip:</span> Tus amigos pueden ingresar el código en la página principal o usar el enlace directo para unirse sin registro.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)} className="rounded-full">
            Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareSessionDialog;
