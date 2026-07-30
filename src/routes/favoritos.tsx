import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/favoritos")({
  beforeLoad: () => {
    throw redirect({ to: "/minha-conta", search: { tab: "favorites" } as any });
  },
  component: () => null,
});
