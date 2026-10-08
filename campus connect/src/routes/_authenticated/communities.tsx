import { createFileRoute } from "@tanstack/react-router";
import { GroupsPage } from "@/components/campus/groups-page";

export const Route = createFileRoute("/_authenticated/communities")({
  head: () => ({ meta: [{ title: "Communities — Campus" }, { name: "description", content: "Clubs and interest groups at your college." }] }),
  component: () => <GroupsPage kind="community" />,
});
