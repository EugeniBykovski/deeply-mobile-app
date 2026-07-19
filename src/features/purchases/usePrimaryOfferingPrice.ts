import { useEffect, useState } from 'react';
import Purchases, { PACKAGE_TYPE } from 'react-native-purchases';

export interface PrimaryOfferingPrice {
  priceString: string;
  packageType: PACKAGE_TYPE;
}

/**
 * Fetches the store's localized price for the default subscription package,
 * so surfaces like the locked-content sheet never hardcode a price. Prefers
 * monthly (the most common at-a-glance reference point), falling back to
 * whatever the current offering exposes first. Returns null while loading
 * or when offerings are unavailable — callers should render without a price
 * rather than fabricate one. Callers own translating packageType into a
 * localized period label.
 */
export function usePrimaryOfferingPrice(): PrimaryOfferingPrice | null {
  const [price, setPrice] = useState<PrimaryOfferingPrice | null>(null);

  useEffect(() => {
    let cancelled = false;

    Purchases.getOfferings()
      .then((offerings) => {
        if (cancelled) return;
        const pkgs = offerings.current?.availablePackages ?? [];
        if (pkgs.length === 0) return;

        const preferred =
          pkgs.find((p) => p.packageType === PACKAGE_TYPE.MONTHLY) ?? pkgs[0]!;

        setPrice({
          priceString: preferred.product.priceString,
          packageType: preferred.packageType as PACKAGE_TYPE,
        });
      })
      .catch(() => {
        // Offerings unavailable — leave price as null, never fabricate one.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return price;
}
