import { z } from "zod";
import { USERNAME_REGEX } from "@/lib/constants";
import { isSafeHttpUrl } from "@/lib/errors";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const registerSchema = z
  .object({
    email: z.email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
    displayName: z
      .string()
      .min(1, "Display name is required.")
      .max(60, "Display name is too long."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const usernameSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(24)
    .regex(
      USERNAME_REGEX,
      "Use 3–24 characters: lowercase letters, numbers, or underscores.",
    ),
});

export const profileSchema = z.object({
  display_name: z.string().min(1).max(60),
  username: z
    .string()
    .min(3)
    .max(24)
    .regex(
      USERNAME_REGEX,
      "Use 3–24 characters: lowercase letters, numbers, or underscores.",
    ),
  bio: z.string().max(500).optional().nullable(),
  website_url: z
    .union([z.string(), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === "" || v == null ? null : v.trim()))
    .refine((v) => v === null || isSafeHttpUrl(v), {
      message: "Website must start with http:// or https://",
    }),
  is_public: z.boolean(),
});

export const passwordResetSchema = z.object({
  email: z.email("Enter a valid email address."),
});

export const newPasswordSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
