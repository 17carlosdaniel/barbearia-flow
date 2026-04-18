import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Keyboard, Pencil, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  comboFromKeyboardEvent,
  isBrowserReservedShortcut,
  normalizeShortcut,
  quickActionsStorageKey,
  SHORTCUT_ACTIONS_BARBER,
  shortcutsEnabledStorageKey,
  shortcutStorageKey,
  type ShortcutActionId,
  type UserShortcut,
} from "@/lib/shortcuts";

const BarberShortcuts = () => {
  const { user } = useAuth();
  const [customShortcuts, setCustomShortcuts] = useState<UserShortcut[]>([]);
  const [shortcutActionDraft, setShortcutActionDraft] = useState<ShortcutActionId>("new_product");
  const [shortcutComboDraft, setShortcutComboDraft] = useState("");
  const [capturingShortcut, setCapturingShortcut] = useState(false);
  const [quickActions, setQuickActions] = useState<string[]>([]);
  const [shortcutsEnabled, setShortcutsEnabled] = useState(true);
  const [draftError, setDraftError] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [pendingConflict, setPendingConflict] = useState<{
    combo: string;
    action: ShortcutActionId;
    existingAction: ShortcutActionId;
  } | null>(null);
  const lastAutoAttemptRef = useRef("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(shortcutStorageKey("barbeiro", user?.id));
      if (raw) setCustomShortcuts(JSON.parse(raw) as UserShortcut[]);
      const quickRaw = localStorage.getItem(quickActionsStorageKey("barbeiro", user?.id));
      if (quickRaw) setQuickActions(JSON.parse(quickRaw) as string[]);
      const enabledRaw = localStorage.getItem(shortcutsEnabledStorageKey("barbeiro", user?.id));
      setShortcutsEnabled(enabledRaw === null ? true : enabledRaw === "1");
    } catch {
      // ignore
    }
  }, [user?.id]);

  useEffect(() => {
    if (!capturingShortcut) return;
    const onKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      if (event.key === "Escape") {
        setCapturingShortcut(false);
        setDraftError("");
        return;
      }
      const combo = comboFromKeyboardEvent(event);
      if (!combo) return;
      setShortcutComboDraft(combo);
      setCapturingShortcut(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [capturingShortcut]);

  const persistShortcuts = (next: UserShortcut[]) => {
    setCustomShortcuts(next);
    try {
      localStorage.setItem(shortcutStorageKey("barbeiro", user?.id), JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const persistQuickActions = (next: string[]) => {
    setQuickActions(next);
    try {
      localStorage.setItem(quickActionsStorageKey("barbeiro", user?.id), JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const upsertShortcut = (allowReplace = false) => {
    const combo = normalizeShortcut(shortcutComboDraft);
    if (!combo) {
      setDraftError("Defina uma combinação para salvar.");
      return false;
    }
    if (isBrowserReservedShortcut(combo)) {
      setDraftError(`❌ ${combo} não permitido (atalho reservado do navegador).`);
      return false;
    }
    if (!combo.includes("+")) {
      setDraftError("Use combinação com modificador (ex.: Ctrl+Shift+P).");
      return false;
    }
    const existing = customShortcuts.find((s) => s.key === combo && s.key !== editingKey);
    if (existing && !allowReplace) {
      setPendingConflict({
        combo,
        action: shortcutActionDraft,
        existingAction: existing.action,
      });
      setDraftError(`Esse atalho já está em uso por "${SHORTCUT_ACTIONS_BARBER.find((a) => a.id === existing.action)?.label ?? existing.action}".`);
      return false;
    }

    const base = editingKey ? customShortcuts.filter((s) => s.key !== editingKey) : [...customShortcuts];
    const withoutCombo = base.filter((s) => s.key !== combo);
    const prevSame = customShortcuts.find((s) => s.key === combo);
    const next: UserShortcut[] = [
      ...withoutCombo,
      {
        key: combo,
        action: shortcutActionDraft,
        createdAt: prevSame?.createdAt ?? new Date().toISOString(),
        useCount: prevSame?.useCount ?? 0,
        lastUsedAt: prevSame?.lastUsedAt,
      },
    ];
    persistShortcuts(next);
    setShortcutComboDraft("");
    setDraftError("");
    setPendingConflict(null);
    setEditingKey(null);
    toast({ title: "Atalho salvo" });
    return true;
  };

  const removeShortcut = (key: string) => {
    const next = customShortcuts.filter((s) => s.key !== key);
    persistShortcuts(next);
  };

  const toggleQuickAction = (actionId: string) => {
    const has = quickActions.includes(actionId);
    const next = has ? quickActions.filter((id) => id !== actionId) : [...quickActions, actionId].slice(0, 5);
    persistQuickActions(next);
  };

  const setShortcutsEnabledAndPersist = (enabled: boolean) => {
    setShortcutsEnabled(enabled);
    try {
      localStorage.setItem(shortcutsEnabledStorageKey("barbeiro", user?.id), enabled ? "1" : "0");
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!shortcutsEnabled) return;
    if (capturingShortcut) return;
    const combo = normalizeShortcut(shortcutComboDraft);
    if (!combo || !combo.includes("+")) return;
    const key = `${editingKey ?? "new"}|${combo}|${shortcutActionDraft}`;
    if (lastAutoAttemptRef.current === key) return;
    lastAutoAttemptRef.current = key;
    void upsertShortcut(false);
  }, [shortcutComboDraft, shortcutActionDraft, capturingShortcut, shortcutsEnabled]); // autosave

  const sortedShortcuts = useMemo(
    () =>
      [...customShortcuts].sort((a, b) => {
        const useDiff = (b.useCount ?? 0) - (a.useCount ?? 0);
        if (useDiff !== 0) return useDiff;
        const dateA = Date.parse(a.lastUsedAt ?? a.createdAt ?? "1970-01-01");
        const dateB = Date.parse(b.lastUsedAt ?? b.createdAt ?? "1970-01-01");
        return dateB - dateA;
      }),
    [customShortcuts],
  );

  const renderKeyCaps = (combo: string) => (
    <span className="inline-flex flex-wrap items-center gap-1">
      {combo.split("+").map((part, idx) => (
        <span key={`${combo}-${part}-${idx}`} className="inline-flex items-center rounded-md border border-border/70 bg-background/40 px-2 py-0.5 text-[11px] font-semibold">
          {part}
        </span>
      ))}
    </span>
  );

  const applyRecommendedDefaults = () => {
    const defaults: UserShortcut[] = [
      { key: "CTRL+SHIFT+P", action: "new_product", createdAt: new Date().toISOString(), useCount: 0 },
      { key: "CTRL+SHIFT+O", action: "orders", createdAt: new Date().toISOString(), useCount: 0 },
      { key: "CTRL+SHIFT+D", action: "dashboard", createdAt: new Date().toISOString(), useCount: 0 },
    ];
    const safeDefaults = defaults.filter((d) => !isBrowserReservedShortcut(d.key));
    const merged = [...customShortcuts];
    safeDefaults.forEach((d) => {
      if (!merged.some((m) => m.key === d.key)) merged.push(d);
    });
    persistShortcuts(merged);
    toast({ title: "Padrão aplicado", description: "Atalhos recomendados adicionados." });
  };

  return (
    <DashboardLayout userType="barbeiro">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
          <h2 className="text-lg font-display font-semibold text-foreground inline-flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary" />
            Atalhos personalizados
          </h2>
          <p className="text-sm text-muted-foreground">No desktop, crie atalhos de teclado. No mobile, escolha ações rápidas favoritas.</p>
          <div className="config-item-row">
            <div className="config-icon-badge bg-primary/15 text-primary"><Keyboard className="w-4 h-4" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Ativar atalhos de teclado</p>
              <p className="text-xs text-muted-foreground">Ativa atalhos de teclado e ações rápidas no mobile.</p>
            </div>
            <Switch checked={shortcutsEnabled} onCheckedChange={setShortcutsEnabledAndPersist} />
          </div>

          {shortcutsEnabled ? (
            <>
              <div className="rounded-xl border border-border/60 bg-secondary/25 p-3 space-y-2">
                {sortedShortcuts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum atalho criado ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {sortedShortcuts.map((shortcut) => {
                      const action = SHORTCUT_ACTIONS_BARBER.find((a) => a.id === shortcut.action);
                      return (
                        <div key={shortcut.key} className="flex items-center justify-between rounded-lg border border-border/50 bg-background/30 px-3 py-2">
                          <div>
                            <p className="text-sm font-medium text-foreground">{renderKeyCaps(shortcut.key)}</p>
                            <p className="text-xs text-muted-foreground">{action?.label ?? shortcut.action}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingKey(shortcut.key);
                                setShortcutComboDraft(shortcut.key);
                                setShortcutActionDraft(shortcut.action);
                                setCapturingShortcut(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button type="button" size="icon" variant="ghost" onClick={() => removeShortcut(shortcut.key)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] gap-2">
                  <Input
                    value={shortcutComboDraft}
                    onChange={(e) => setShortcutComboDraft(e.target.value.toUpperCase())}
                    onFocus={() => setCapturingShortcut(true)}
                    placeholder={capturingShortcut ? "Pressione a combinação... (ESC cancela)" : "Ctrl+Shift+P"}
                    className={cn(
                      "bg-secondary border-border",
                      capturingShortcut && "border-primary/70 ring-2 ring-primary/25",
                    )}
                  />
                  <select
                    value={shortcutActionDraft}
                    onChange={(e) => setShortcutActionDraft(e.target.value as ShortcutActionId)}
                    className="w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm text-foreground"
                  >
                    {SHORTCUT_ACTIONS_BARBER.map((action) => (
                      <option key={action.id} value={action.id}>
                        {action.label}
                      </option>
                    ))}
                  </select>
                </div>
                {draftError ? <p className="text-xs text-destructive">{draftError}</p> : null}
                {pendingConflict ? (
                  <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 p-2.5 flex items-center justify-between gap-2">
                    <p className="text-xs text-amber-200">
                      Esse atalho já está em uso por{" "}
                      <strong>{SHORTCUT_ACTIONS_BARBER.find((a) => a.id === pendingConflict.existingAction)?.label}</strong>.
                    </p>
                    <div className="flex gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setPendingConflict(null);
                          setDraftError("");
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          const ok = upsertShortcut(true);
                          if (ok) toast({ title: "Atalho substituído" });
                        }}
                      >
                        Substituir
                      </Button>
                    </div>
                  </div>
                ) : null}
                <p className="text-[11px] text-muted-foreground">
                  Reservados do navegador são bloqueados automaticamente (ex.: Ctrl+W, Ctrl+R, Ctrl+T, Ctrl+P, F5, F12).
                </p>
                <p className="text-[11px] text-primary/85">Salvamento automático ativo após capturar combinação válida.</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="text-foreground/90 font-medium">Sugestões recomendadas</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{renderKeyCaps("CTRL+SHIFT+P")} Novo produto</span>
                    <span>{renderKeyCaps("CTRL+SHIFT+O")} Pedidos</span>
                    <span>{renderKeyCaps("CTRL+SHIFT+D")} Dashboard</span>
                  </div>
                </div>
                <div className="pt-1">
                  <Button type="button" variant="outlineGold" size="sm" onClick={applyRecommendedDefaults}>
                    Aplicar padrão recomendado
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-secondary/25 p-3 space-y-2">
                <p className="text-sm font-medium text-foreground">Ações rápidas (mobile)</p>
                <p className="text-xs text-muted-foreground">
                  Escolha até 5 ações para aparecerem como botões rápidos no app. Selecionados:{" "}
                  <span className={cn("font-medium", quickActions.length >= 5 ? "text-amber-300" : "text-foreground")}>
                    {quickActions.length}/5
                  </span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SHORTCUT_ACTIONS_BARBER.map((action) => {
                    const active = quickActions.includes(action.id);
                    return (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => toggleQuickAction(action.id)}
                        className={`rounded-full border px-2.5 py-1.5 text-xs transition-colors ${
                          active
                            ? "border-primary bg-primary text-primary-foreground shadow-[0_8px_20px_-14px_rgba(245,184,65,0.7)]"
                            : "border-border/60 bg-background/20 text-foreground"
                        }`}
                      >
                        {active ? "✓ " : "+ "}
                        {action.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-border/60 bg-secondary/25 p-3 text-sm text-muted-foreground">
              Atalhos desabilitados. Ative a chave acima para criar e usar atalhos.
            </div>
          )}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default BarberShortcuts;

