"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OrganizationSettings } from "./types";

type BillingSettingsSectionProps = {
  organization: OrganizationSettings;
};

export function BillingSettingsSection({ organization }: BillingSettingsSectionProps) {
  return (
    <section role="tabpanel" aria-labelledby="settings-tab-billing" id="settings-panel-billing">
      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-[#71717a]">
            Billing is a placeholder section. Replace these actions with Stripe/Paddle customer portal flows.
          </p>

          <div className="grid gap-3 rounded-lg border border-[#27272a] bg-[#111113] p-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-[#71717a]">Current plan</p>
              <p className="text-sm text-[#fafafa]">{organization.plan}</p>
            </div>
            <div>
              <p className="text-xs text-[#71717a]">Renewal date</p>
              <p className="text-sm text-[#fafafa]">Dec 31, 2026</p>
            </div>
            <div>
              <p className="text-xs text-[#71717a]">Billing email</p>
              <p className="text-sm text-[#fafafa]">{organization.billingEmail}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/billing">
              <Button type="button">Manage subscription</Button>
            </Link>
            <Button type="button" variant="secondary" disabled>
              Update payment method
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
