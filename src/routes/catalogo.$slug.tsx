import { createFileRoute } from "@tanstack/react-router";
import { catalogSearchSchema } from "@/features/catalog/catalog-constants";

export const Route = createFileRoute("/catalogo/$slug")({
  validateSearch: (search) => catalogSearchSchema.parse(search),
});
