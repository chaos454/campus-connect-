import { createFileRoute } from "@tanstack/react-router";
import { GroupsPage } from "@/components/campus/groups-page";

export const Route = createFileRoute("/_authenticated/study-groups")({
  head: () => ({ meta: [{ title: "Study Groups — Campus" }, { name: "description", content: "Find people to study with at your college." }] }),
  component: () => <GroupsPage kind="study" />,
});
