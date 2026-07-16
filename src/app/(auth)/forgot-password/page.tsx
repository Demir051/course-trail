import { ForgotPasswordForm } from "@/components/auth/auth-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDictionary } from "@/i18n/dictionaries";
import { getRequestLocale } from "@/lib/locale-server";

export const metadata = { title: "Reset password" };

export default async function ForgotPasswordPage() {
  const t = getDictionary(await getRequestLocale());

  return (
    <Card className="border-border/70 bg-card/80 shadow-sm">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">
          {t.auth.resetTitle}
        </CardTitle>
        <CardDescription>{t.auth.resetBody}</CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
      </CardContent>
    </Card>
  );
}
