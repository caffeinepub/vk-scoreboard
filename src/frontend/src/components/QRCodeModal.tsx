import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface QRCodeModalProps {
  url: string;
  open: boolean;
  onClose: () => void;
}

export function QRCodeModal({ url, open, onClose }: QRCodeModalProps) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(
      () => toast.success("Link copied to clipboard!"),
      () => toast.error("Failed to copy link"),
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="bg-card border-border max-w-xs"
        data-ocid="qr_code.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-center">
            📱 Scan to View Live Score
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          {/* QR Code */}
          <div className="rounded-xl border border-border/50 bg-white p-3">
            <img
              src={qrUrl}
              alt="QR Code for live scoreboard"
              width={180}
              height={180}
              className="block rounded"
            />
          </div>

          {/* URL display */}
          <div className="w-full rounded-xl border border-border/40 bg-muted/30 px-3 py-2 text-center">
            <p className="text-xs text-muted-foreground break-all font-mono">
              {url}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              className="flex-1 border-primary/40 text-primary hover:bg-primary/10"
              onClick={handleCopy}
              data-ocid="qr_code.copy.button"
            >
              <Copy className="w-4 h-4 mr-1.5" />
              Copy Link
            </Button>
            <Button
              variant="ghost"
              className="border border-border/40 text-muted-foreground hover:text-foreground"
              onClick={() => window.open(url, "_blank")}
              data-ocid="qr_code.open.button"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
