import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, PlusCircle, Pencil, Trash2, Calendar, Users, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ALLERGENS } from "@shared/allergens";
import AllergenBadge from "@/components/AllergenBadge";
import { useTranslation } from "@/hooks/useTranslation";

interface Location {
  id: number;
  name: string;
}

interface GuestProfile {
  id: number;
  groupName: string;
  date: string;
  dateEnd: string | null;
  personCount: number;
  allergens: string[] | string;
  dietaryNotes: string | null;
  locationId: number | null;
  contactPerson: string | null;
  location?: Location;
  createdAt: string;
}

export default function GuestProfiles({ embedded }: { embedded?: boolean }) {
  const [locationFilter, setLocationFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: profiles, isLoading } = useQuery<GuestProfile[]>({
    queryKey: ["/api/guest-profiles"],
  });

  const { data: locations } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/guest-profiles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guest-profiles"] });
      toast({ title: t("guestProfiles.deleted") });
    },
    onError: () => {
      toast({ title: t("guestProfiles.deleteFailed"), variant: "destructive" });
    },
  });

  const handleDelete = (id: number) => {
    if (!confirm(t("guestProfiles.deleteConfirm"))) return;
    deleteMutation.mutate(id);
  };

  const isActiveProfile = (profile: GuestProfile) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = new Date(profile.date);
    start.setHours(0, 0, 0, 0);
    const end = profile.dateEnd ? new Date(profile.dateEnd) : new Date(profile.date);
    end.setHours(23, 59, 59, 999);
    return now >= start && now <= end;
  };

  const formatDateRange = (date: string, dateEnd: string | null) => {
    const startDate = new Date(date).toLocaleDateString("de-AT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    if (!dateEnd || dateEnd === date) {
      return startDate;
    }
    const endDate = new Date(dateEnd).toLocaleDateString("de-AT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return `${startDate} - ${endDate}`;
  };

  const filteredProfiles = profiles?.filter((p) => {
    if (locationFilter === "all") return true;
    if (locationFilter === "none") return !p.locationId;
    return p.locationId === parseInt(locationFilter);
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={embedded ? "space-y-4" : "p-4 space-y-4 pb-24"}>
      <div className="flex items-center gap-3">
        {!embedded && (
          <div className="flex-1">
            <h1 className="text-xl font-heading font-bold">{t("guestProfiles.title")}</h1>
            <p className="text-xs text-muted-foreground">
              {t("guestProfiles.subtitle", { count: profiles?.length || 0 })}
            </p>
          </div>
        )}
        <Button size="sm" className="gap-1 min-h-[44px] ml-auto" onClick={() => setShowAdd(true)}>
          <PlusCircle className="h-4 w-4" /> {t("guestProfiles.newProfile")}
        </Button>
      </div>

      {/* Location filter */}
      <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
        <Button
          variant={locationFilter === "all" ? "default" : "outline"}
          size="sm"
          className="h-7 text-xs shrink-0"
          onClick={() => setLocationFilter("all")}
        >
          {t("common.all")} ({profiles?.length || 0})
        </Button>
        {locations?.map((loc) => {
          const count = profiles?.filter((p) => p.locationId === loc.id).length || 0;
          if (count === 0) return null;
          return (
            <Button
              key={loc.id}
              variant={locationFilter === String(loc.id) ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs shrink-0"
              onClick={() => setLocationFilter(String(loc.id))}
            >
              {loc.name} ({count})
            </Button>
          );
        })}
        {profiles?.some((p) => !p.locationId) && (
          <Button
            variant={locationFilter === "none" ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs shrink-0"
            onClick={() => setLocationFilter("none")}
          >
            {t("guestProfiles.withoutLocation")} ({profiles.filter((p) => !p.locationId).length})
          </Button>
        )}
      </div>

      {/* Profiles list */}
      {filteredProfiles.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <Users className="h-10 w-10 mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground font-medium">
            {profiles?.length === 0
              ? t("guestProfiles.noProfiles")
              : t("guestProfiles.noProfilesFilter")}
          </p>
          {profiles?.length === 0 && (
            <>
              <p className="text-sm text-muted-foreground">{t("guestProfiles.noProfilesHint")}</p>
              <Button variant="outline" size="sm" className="gap-1 min-h-[44px]" onClick={() => setShowAdd(true)}>
                <PlusCircle className="h-4 w-4" /> {t("guestProfiles.firstProfile")}
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredProfiles.map((profile) => {
            const isActive = isActiveProfile(profile);
            const allergenCodes = Array.isArray(profile.allergens)
              ? profile.allergens.filter((c: string) => c in ALLERGENS)
              : typeof profile.allergens === "string"
                ? profile.allergens.split("").filter((c) => c in ALLERGENS)
                : [];

            return (
              <Card key={profile.id} className={isActive ? "border-orange-500 shadow-md" : ""}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{profile.groupName}</h3>
                        {isActive && (
                          <Badge variant="default" className="text-[10px] py-0 bg-orange-600">
                            {t("guestProfiles.active")}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateRange(profile.date, profile.dateEnd)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {profile.personCount} {profile.personCount === 1 ? t("guestProfiles.person") : t("guestProfiles.persons")}
                        </span>
                        {profile.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {profile.location.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <EditProfileDialog profile={profile} locations={locations || []} />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDelete(profile.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {allergenCodes.length > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-muted-foreground">{t("guestProfiles.allergensLabel")}:</span>
                      <div className="flex flex-wrap gap-1">
                        {allergenCodes.map((code) => (
                          <Badge key={code} variant="outline" className="text-[10px] py-0 border-orange-500">
                            {code} - {ALLERGENS[code].nameDE}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.dietaryNotes && (
                    <div className="text-xs bg-muted px-2 py-1.5 rounded">
                      <span className="font-medium">{t("guestProfiles.notesLabel")}: </span>
                      {profile.dietaryNotes}
                    </div>
                  )}

                  {profile.contactPerson && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {t("guestProfiles.contactLabel")}: {profile.contactPerson}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AddProfileDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        locations={locations || []}
      />
    </div>
  );
}

function AddProfileDialog({
  open,
  onOpenChange,
  locations,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locations: Location[];
}) {
  const [groupName, setGroupName] = useState("");
  const [date, setDate] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [personCount, setPersonCount] = useState("1");
  const [allergens, setAllergens] = useState<Set<string>>(new Set());
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [locationId, setLocationId] = useState<string>("none");
  const [contactPerson, setContactPerson] = useState("");
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/guest-profiles", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guest-profiles"] });
      toast({ title: t("guestProfiles.created") });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setGroupName("");
    setDate("");
    setDateEnd("");
    setPersonCount("1");
    setAllergens(new Set());
    setDietaryNotes("");
    setLocationId("none");
    setContactPerson("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || !date) {
      toast({ title: t("guestProfiles.nameAndDateRequired"), variant: "destructive" });
      return;
    }
    createMutation.mutate({
      groupName: groupName.trim(),
      date,
      dateEnd: dateEnd || null,
      personCount: parseInt(personCount) || 1,
      allergens: Array.from(allergens).sort(),
      dietaryNotes: dietaryNotes.trim() || null,
      locationId: locationId === "none" ? null : parseInt(locationId),
      contactPerson: contactPerson.trim() || null,
    });
  };

  const toggleAllergen = (code: string) => {
    const newSet = new Set(allergens);
    if (newSet.has(code)) {
      newSet.delete(code);
    } else {
      newSet.add(code);
    }
    setAllergens(newSet);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("guestProfiles.newProfile")}</DialogTitle>
        </DialogHeader>
        <ProfileForm
          groupName={groupName}
          setGroupName={setGroupName}
          date={date}
          setDate={setDate}
          dateEnd={dateEnd}
          setDateEnd={setDateEnd}
          personCount={personCount}
          setPersonCount={setPersonCount}
          allergens={allergens}
          toggleAllergen={toggleAllergen}
          dietaryNotes={dietaryNotes}
          setDietaryNotes={setDietaryNotes}
          locationId={locationId}
          setLocationId={setLocationId}
          contactPerson={contactPerson}
          setContactPerson={setContactPerson}
          locations={locations}
          saving={createMutation.isPending}
          onSubmit={handleSubmit}
          submitLabel={t("common.create")}
        />
      </DialogContent>
    </Dialog>
  );
}

function EditProfileDialog({
  profile,
  locations,
}: {
  profile: GuestProfile;
  locations: Location[];
}) {
  const [open, setOpen] = useState(false);
  const [groupName, setGroupName] = useState(profile.groupName);
  const [date, setDate] = useState(profile.date);
  const [dateEnd, setDateEnd] = useState(profile.dateEnd || "");
  const [personCount, setPersonCount] = useState(String(profile.personCount));
  const [allergens, setAllergens] = useState<Set<string>>(
    new Set(
      Array.isArray(profile.allergens)
        ? profile.allergens.filter((c: string) => c in ALLERGENS)
        : typeof profile.allergens === "string"
          ? profile.allergens.split("").filter((c) => c in ALLERGENS)
          : []
    )
  );
  const [dietaryNotes, setDietaryNotes] = useState(profile.dietaryNotes || "");
  const [locationId, setLocationId] = useState<string>(
    profile.locationId ? String(profile.locationId) : "none"
  );
  const [contactPerson, setContactPerson] = useState(profile.contactPerson || "");
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("PUT", `/api/guest-profiles/${profile.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guest-profiles"] });
      toast({ title: t("common.saved") });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || !date) {
      toast({ title: t("guestProfiles.nameAndDateRequired"), variant: "destructive" });
      return;
    }
    updateMutation.mutate({
      groupName: groupName.trim(),
      date,
      dateEnd: dateEnd || null,
      personCount: parseInt(personCount) || 1,
      allergens: Array.from(allergens).sort(),
      dietaryNotes: dietaryNotes.trim() || null,
      locationId: locationId === "none" ? null : parseInt(locationId),
      contactPerson: contactPerson.trim() || null,
    });
  };

  const toggleAllergen = (code: string) => {
    const newSet = new Set(allergens);
    if (newSet.has(code)) {
      newSet.delete(code);
    } else {
      newSet.add(code);
    }
    setAllergens(newSet);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-7 w-7">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("guestProfiles.editProfile")}</DialogTitle>
        </DialogHeader>
        <ProfileForm
          groupName={groupName}
          setGroupName={setGroupName}
          date={date}
          setDate={setDate}
          dateEnd={dateEnd}
          setDateEnd={setDateEnd}
          personCount={personCount}
          setPersonCount={setPersonCount}
          allergens={allergens}
          toggleAllergen={toggleAllergen}
          dietaryNotes={dietaryNotes}
          setDietaryNotes={setDietaryNotes}
          locationId={locationId}
          setLocationId={setLocationId}
          contactPerson={contactPerson}
          setContactPerson={setContactPerson}
          locations={locations}
          saving={updateMutation.isPending}
          onSubmit={handleSubmit}
          submitLabel={t("common.save")}
        />
      </DialogContent>
    </Dialog>
  );
}

function ProfileForm({
  groupName,
  setGroupName,
  date,
  setDate,
  dateEnd,
  setDateEnd,
  personCount,
  setPersonCount,
  allergens,
  toggleAllergen,
  dietaryNotes,
  setDietaryNotes,
  locationId,
  setLocationId,
  contactPerson,
  setContactPerson,
  locations,
  saving,
  onSubmit,
  submitLabel,
}: {
  groupName: string;
  setGroupName: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
  dateEnd: string;
  setDateEnd: (v: string) => void;
  personCount: string;
  setPersonCount: (v: string) => void;
  allergens: Set<string>;
  toggleAllergen: (code: string) => void;
  dietaryNotes: string;
  setDietaryNotes: (v: string) => void;
  locationId: string;
  setLocationId: (v: string) => void;
  contactPerson: string;
  setContactPerson: (v: string) => void;
  locations: Location[];
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
}) {
  const { t } = useTranslation();
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label>{t("guestProfiles.groupName")}</Label>
        <Input
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder={t("guestProfiles.groupNamePlaceholder")}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{t("guestProfiles.arrival")}</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>{t("guestProfiles.departure")}</Label>
          <Input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>{t("guestProfiles.personCount")}</Label>
        <Input
          type="number"
          min="1"
          value={personCount}
          onChange={(e) => setPersonCount(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label>{t("guestProfiles.location")}</Label>
        <Select value={locationId} onValueChange={setLocationId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("guestProfiles.noLocation")}</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc.id} value={String(loc.id)}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>{t("guestProfiles.contactPerson")}</Label>
        <Input
          value={contactPerson}
          onChange={(e) => setContactPerson(e.target.value)}
          placeholder={t("guestProfiles.contactPersonPlaceholder")}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("guestProfiles.allergensLabel")}</Label>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-2">
          {Object.values(ALLERGENS).map((allergen) => (
            <label
              key={allergen.code}
              className="flex items-start gap-2 cursor-pointer hover:bg-muted p-1.5 rounded"
            >
              <input
                type="checkbox"
                checked={allergens.has(allergen.code)}
                onChange={() => toggleAllergen(allergen.code)}
                className="mt-0.5"
              />
              <span className="text-xs leading-tight">
                <span className="font-semibold">{allergen.code}</span> - {allergen.nameDE}
              </span>
            </label>
          ))}
        </div>
        {allergens.size > 0 && (
          <div className="text-xs text-muted-foreground">
            {t("guestProfiles.selected")}: {Array.from(allergens).sort().join(", ")}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>{t("guestProfiles.dietaryNotes")}</Label>
        <Textarea
          value={dietaryNotes}
          onChange={(e) => setDietaryNotes(e.target.value)}
          placeholder={t("guestProfiles.dietaryNotesPlaceholder")}
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        {submitLabel}
      </Button>
    </form>
  );
}
