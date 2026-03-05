import { ExtrasType } from "@/hooks/useCricketScoring";
import type { LocalBall } from "@/hooks/useCricketScoring";
import { cn } from "@/lib/utils";

interface BallPillProps {
  ball: LocalBall;
  size?: "sm" | "md";
}

export function BallPill({ ball, size = "sm" }: BallPillProps) {
  const dim = size === "sm" ? "w-7 h-7 text-[10px]" : "w-9 h-9 text-xs";

  if (ball.isWicket) {
    return (
      <div
        className={cn(
          "ball-dot box-glow-red",
          dim,
          "bg-wicket-red/20 border border-wicket-red/60 text-wicket-red font-bold",
        )}
      >
        W
      </div>
    );
  }

  if (ball.extrasType === ExtrasType.wide) {
    return (
      <div
        className={cn(
          "ball-dot",
          dim,
          "bg-wide-purple/20 border border-wide-purple/50 text-wide-purple font-bold",
        )}
      >
        Wd
      </div>
    );
  }

  if (ball.extrasType === ExtrasType.noball) {
    return (
      <div
        className={cn(
          "ball-dot",
          dim,
          "bg-noball-orange/20 border border-noball-orange/50 text-noball-orange font-bold",
        )}
      >
        Nb
      </div>
    );
  }

  if (ball.extrasType === ExtrasType.bye) {
    return (
      <div
        className={cn(
          "ball-dot",
          dim,
          "bg-muted border border-border text-muted-foreground font-medium",
        )}
      >
        B{ball.runs > 0 ? ball.runs : ""}
      </div>
    );
  }

  if (ball.extrasType === ExtrasType.legbye) {
    return (
      <div
        className={cn(
          "ball-dot",
          dim,
          "bg-muted border border-border text-muted-foreground font-medium",
        )}
      >
        Lb{ball.runs > 0 ? ball.runs : ""}
      </div>
    );
  }

  if (ball.runs === 6) {
    return (
      <div
        className={cn(
          "ball-dot box-glow-gold",
          dim,
          "bg-cricket-gold/20 border border-cricket-gold/60 text-cricket-gold font-bold",
        )}
      >
        6
      </div>
    );
  }

  if (ball.runs === 4) {
    return (
      <div
        className={cn(
          "ball-dot box-glow-green",
          dim,
          "bg-neon-green/20 border border-neon-green/60 text-neon-green font-bold",
        )}
      >
        4
      </div>
    );
  }

  if (ball.runs === 0) {
    return (
      <div
        className={cn(
          "ball-dot",
          dim,
          "bg-muted/60 border border-border/50 text-muted-foreground",
        )}
      >
        ·
      </div>
    );
  }

  return (
    <div
      className={cn(
        "ball-dot",
        dim,
        "bg-secondary border border-border text-foreground font-semibold",
      )}
    >
      {ball.runs}
    </div>
  );
}
