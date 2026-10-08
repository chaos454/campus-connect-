import { createFileRoute } from "@tanstack/react-router";
import { GroupsPage } from "@/components/campus/groups-page";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({ meta: [{ title: "Projects — Campus" }, { name: "description", content: "Find teammates for projects at your college." }] }),
  component: () => <GroupsPage kind="project" />,
});
