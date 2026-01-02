// @ts-nocheck
import { z } from "zod";

const fileSchema = z.custom<File | null | undefined>((value) => {
  if (typeof File === "undefined") return true;
  return value instanceof File || value === null || value === undefined;
});

export const analyzeSchema = z
  .object({
    destination: z.string().default("US"),
    shippingMode: z.string().default("air"),
    linkUrl: z.string().url().optional(),
    front: fileSchema,
    barcode: fileSchema,
    label: fileSchema,
  })
  .superRefine((val, ctx) => {
    if (!val.front) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["front"],
        message: "Add a front product photo to start",
      });
    }
  });

export type AnalyzeInput = z.infer<typeof analyzeSchema>;
