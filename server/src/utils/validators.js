const { z } = require("zod");

const createDownloadSchema = z
  .object({
    url: z.string().url("Informe uma URL válida"),
    fileName: z.string().trim().max(255).optional().or(z.literal("")),
    targetDir: z.string().trim().max(400).optional(),
    category: z.string().trim().max(120).optional(),
    priority: z.coerce.number().int().min(1).max(10).optional()
  })
  .strict();

const browserImportSchema = z
  .object({
    browser: z.enum(["all", "chrome", "firefox"]).optional(),
    limit: z.coerce.number().int().min(1).max(1000).optional()
  })
  .strict();

module.exports = {
  createDownloadSchema,
  browserImportSchema
};
