import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/cobranca")({
  beforeLoad: () => {
    throw redirect({ to: "/minha-conta", search: { tab: "subscription" } as any });
  },
  component: () => null,
});
