"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_PACK_ID, INDUSTRY_PACKS, type IndustryPack } from "./packs";

type PackCtx = {
  packId: string;
  pack: IndustryPack;
  setPackId: (id: string) => void;
  packs: IndustryPack[];
};

const Ctx = createContext<PackCtx | null>(null);

export function PackProvider({ children }: { children: React.ReactNode }) {
  const [packId, setPackIdState] = useState(DEFAULT_PACK_ID);

  useEffect(() => {
    const saved = localStorage.getItem("eios_pack");
    if (saved && INDUSTRY_PACKS.some((p) => p.id === saved)) setPackIdState(saved);
  }, []);

  const setPackId = (id: string) => {
    setPackIdState(id);
    localStorage.setItem("eios_pack", id);
  };

  const pack = useMemo(
    () => INDUSTRY_PACKS.find((p) => p.id === packId) || INDUSTRY_PACKS[0],
    [packId],
  );

  return <Ctx.Provider value={{ packId, pack, setPackId, packs: INDUSTRY_PACKS }}>{children}</Ctx.Provider>;
}

export function usePack() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePack requires PackProvider");
  return ctx;
}
