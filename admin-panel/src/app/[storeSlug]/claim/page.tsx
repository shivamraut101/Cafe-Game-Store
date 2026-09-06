"use client";

import React, { use } from "react";
import StaffVoucherLookupPortal from "../../claim/page";

interface StoreClaimPageProps {
  params: Promise<{ storeSlug: string }>;
}

export default function StoreScopedClaimPortal({ params }: StoreClaimPageProps) {
  const resolvedParams = use(params);
  const storeSlug = resolvedParams.storeSlug;

  return (
    <div className="w-full">
      {/* Store Context Badge */}
      <StaffVoucherLookupPortal />
    </div>
  );
}
