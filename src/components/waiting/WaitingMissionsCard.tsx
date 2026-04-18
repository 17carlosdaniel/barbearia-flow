import { motion } from "framer-motion";
import { CheckCircle2, Gift, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MissionView } from "@/lib/waitEngagement";

interface WaitingMissionsCardProps {
  missions: MissionView[];
  onClaimMission: (missionId: string) => void;
  /** Sem título interno — o bloco pai define o título da seção */
  embedded?: boolean;
  /** Texto do botão ao resgatar (ex.: Fazer agora / Participar) */
  claimButtonLabel?: string;
}

const WaitingMissionsCard = ({
  missions,
  onClaimMission,
  embedded = false,
  claimButtonLabel = "Resgatar recompensa",
}: WaitingMissionsCardProps) => {
  return (
    <section className="space-y-3">
      {!embedded && (
        <div className="flex items-center gap-2">
          <Gift className="h-4 w-4 text-primary" />
          <h3 className="font-display text-lg font-semibold">Missões rápidas</h3>
        </div>
      )}

      <div className={embedded ? "grid grid-cols-1 gap-2.5" : "grid grid-cols-1 md:grid-cols-2 gap-3"}>
        {missions.map((mission, idx) => (
          <motion.div
            key={mission.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
            whileHover={{ y: embedded ? 0 : -2 }}
            className={`glass-card rounded-xl border border-border/60 shadow-card ${embedded ? "p-3.5" : "p-4"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">{mission.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{mission.description}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full border border-primary/40 text-primary bg-primary/10">
                +{mission.rewardPoints} pts
              </span>
            </div>

            <div className="mt-3 text-xs text-muted-foreground">
              Progresso: {Math.min(mission.progressCount, mission.targetCount)}/{mission.targetCount}
            </div>
            <div className="h-1.5 bg-secondary rounded-full mt-1 overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (mission.progressCount / mission.targetCount) * 100)}%` }}
              />
            </div>

            <div className="mt-3">
              {mission.isCompletedForWindow ? (
                <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Concluída neste período
                </div>
              ) : mission.canClaimNow ? (
                <Button size="sm" variant="gold-outline" onClick={() => onClaimMission(mission.id)}>
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  {claimButtonLabel}
                </Button>
              ) : (
                <div className="text-xs text-muted-foreground">Complete a missão para desbloquear.</div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default WaitingMissionsCard;
