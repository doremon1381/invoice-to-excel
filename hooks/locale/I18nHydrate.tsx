import { useEffect } from "react";

import { hydrateAppLanguage } from "@/lib/i18n";

type I18nHydrateProps = {
  onReady?: () => void;
};

export function I18nHydrate({ onReady }: I18nHydrateProps) {
  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      try {
        await hydrateAppLanguage();
      } finally {
        if (isMounted) {
          onReady?.();
        }
      }
    }

    void hydrate();

    return () => {
      isMounted = false;
    };
  }, [onReady]);

  return null;
}
