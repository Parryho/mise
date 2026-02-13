import { useState } from "react";
import { useSearch } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, CalendarDays, Shield } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import Guests from "./Guests";
import Catering from "./Catering";
import GuestProfiles from "./GuestProfiles";

const TAB_KEYS = ["pax", "catering", "profiles"] as const;

export default function GuestsHub() {
  const { t } = useTranslation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const tabParam = params.get("tab");
  const initialTab = TAB_KEYS.includes(tabParam as any) ? tabParam! : "pax";
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="max-w-2xl mx-auto p-4 pb-24">
      <h1 className="text-2xl font-heading font-bold mb-4">
        {t("guestsHub.title")}
      </h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="pax" className="flex-1 gap-1.5">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">{t("guestsHub.tabPax")}</span>
            <span className="sm:hidden">PAX</span>
          </TabsTrigger>
          <TabsTrigger value="catering" className="flex-1 gap-1.5">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">{t("guestsHub.tabCatering")}</span>
            <span className="sm:hidden">Events</span>
          </TabsTrigger>
          <TabsTrigger value="profiles" className="flex-1 gap-1.5">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">{t("guestsHub.tabProfiles")}</span>
            <span className="sm:hidden">Allergene</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pax" className="mt-0">
          <Guests embedded />
        </TabsContent>
        <TabsContent value="catering" className="mt-0">
          <Catering embedded />
        </TabsContent>
        <TabsContent value="profiles" className="mt-0">
          <GuestProfiles embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}
