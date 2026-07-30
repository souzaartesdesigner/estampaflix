import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/downloads")({
  beforeLoad: () => {
    throw redirect({ to: "/minha-conta", search: { tab: "downloads" } as any });
  },
  component: () => null,
});
