import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { transferImageToStorage } from "./artwork-upload.server";

export const processExternalImage = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ 
    url: z.string().url(),
    folder: z.string().optional()
  }).parse(data))
  .handler(async ({ data }) => {
    return await transferImageToStorage(data.url, "artwork-previews", data.folder || "imported");
  });
