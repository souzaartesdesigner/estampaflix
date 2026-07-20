import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArtworkForm } from "@/features/admin/artes/artwork-form";
import { ArtworksTable } from "@/features/admin/artes/artworks-table";

export const Route = createFileRoute("/_authenticated/admin/artes")({ component: Artes });

function Artes() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data: artworks = [] } = useQuery({
    queryKey: ["admin-artworks"],
    queryFn: async () => (await supabase.from("artworks").select("*, categories(name)").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => (await supabase.from("categories").select("id,name").order("name")).data ?? [],
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("artworks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-artworks"] }); toast.success("Arte excluída"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Artes</h1>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="bg-gradient-brand text-brand-foreground">
          <Plus className="mr-2 h-4 w-4" /> Nova arte
        </Button>
      </div>

      <ArtworksTable
        artworks={artworks}
        onEdit={(a) => { setEditing(a); setOpen(true); }}
        onDelete={(id) => del.mutate(id)}
      />

      {open && (
        <ArtworkForm
          key={editing?.id ?? "new"}
          open={open}
          onOpenChange={setOpen}
          editing={editing}
          categories={categories}
        />
      )}
    </div>
  );
}
