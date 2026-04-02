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

const extensionStartDownloadSchema = z
  .object({
    browser: z.enum(["chrome", "firefox"]).optional(),
    url: z.string().url("Informe uma URL válida"),
    fileName: z.string().trim().max(255).optional().or(z.literal("")),
    targetDir: z.string().trim().max(400).optional(),
    category: z.string().trim().max(120).optional(),
    priority: z.coerce.number().int().min(1).max(10).optional()
  })
  .strict();

const extensionDownloadEventSchema = z
  .object({
    browser: z.enum(["chrome", "firefox"]),
    eventType: z.enum(["created", "changed", "erased", "manual-start"]).optional(),
    item: z
      .object({
        downloadId: z.union([z.string(), z.number()]),
        url: z.string().optional(),
        finalUrl: z.string().optional(),
        filePath: z.string().optional(),
        fileName: z.string().optional(),
        bytesReceived: z.coerce.number().min(0).optional(),
        totalBytes: z.coerce.number().min(0).optional(),
        state: z.enum(["in_progress", "complete", "interrupted"]).optional(),
        paused: z.boolean().optional(),
        error: z.string().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        canResume: z.boolean().optional()
      })
      .strict()
  })
  .strict();

module.exports = {
  createDownloadSchema,
  browserImportSchema,
  extensionStartDownloadSchema,
  extensionDownloadEventSchema
};
