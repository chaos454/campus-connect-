import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Clock, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Student } from "@/lib/campus";

export function ConnectButton({ s }: { s: Student }) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries();
  const connect = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("connections").insert({ requester_id: u.user!.id, addressee_id: s.id });
      if (error) throw error;
    },
    onSuccess: () => { toast.success(`Request sent to ${s.full_name.split(" ")[0]}`); refresh(); },
    onError: () => toast.error("Couldn't send request. Try again."),
  });
  const accept = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("connections").update({ status: "accepted" })
        .eq("requester_id", s.id).eq("addressee_id", u.user!.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("You're now connected"); refresh(); },
  });

  if (s.connection_status === "accepted")
    return <Button size="sm" variant="secondary" disabled><Check /> Connected</Button>;
  if (s.connection_status === "pending" && s.is_requester)
    return <Button size="sm" variant="secondary" disabled><Clock /> Requested</Button>;
  if (s.connection_status === "pending")
    return <Button size="sm" onClick={() => accept.mutate()} disabled={accept.isPending}>Accept</Button>;
  return (
    <Button size="sm" variant="soft" onClick={() => connect.mutate()} disabled={connect.isPending}>
      <UserPlus /> Connect
    </Button>
  );
}
