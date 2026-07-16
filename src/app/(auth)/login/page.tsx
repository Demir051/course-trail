import { LoginForm } from "@/components/auth/auth-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDictionary } from "@/i18n/dictionaries";
import { getRequestLocale } from "@/lib/locale-server";
import { safeInternalPath } from "@/lib/safe-redirect";

export const metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const t = getDictionary(await getRequestLocale());
  const next = safeInternalPath(params.next, "/dashboard");

  const errorCode = params.error;
  const errorMessage =
    errorCode && errorCode in t.errors
      ? t.errors[errorCode as keyof typeof t.errors]
      : errorCode
        ? t.errors.generic
        : null;

  return (
    <Card className="border-border/70 bg-card/80 shadow-sm">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">
          {t.auth.welcomeBack}
        </CardTitle>
        <CardDescription>{t.auth.welcomeBody}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorMessage ? (
          <p className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <LoginForm next={next} />
      </CardContent>
    </Card>
  );
}
