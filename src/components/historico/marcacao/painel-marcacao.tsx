"use client";

import { MetricsCards, Insights } from "./metrics-cards";

interface MarcacaoPainelProps {
  insights: Insights;
}

export function MarcacaoPainel({ insights }: MarcacaoPainelProps) {
  return (
    <div>
      <MetricsCards insights={insights} />
    </div>
  );
}
