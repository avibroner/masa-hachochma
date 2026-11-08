"use client";

import { DirectionProvider as BaseDirectionProvider } from "@base-ui/react/direction-provider";

export function DirectionProvider({ children }: { children: React.ReactNode }) {
  return <BaseDirectionProvider direction="rtl">{children}</BaseDirectionProvider>;
}
