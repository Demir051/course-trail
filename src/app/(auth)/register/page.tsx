import { RegisterForm } from "@/components/auth/auth-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDictionary } from "@/i18n/dictionaries";
import { getRequestLocale } from "@/lib/locale-server";

export const metadata = { title: "Create account" };

export default async function RegisterPage() {
  const t = getDictionary(await getRequestLocale());

  return (
    <Card className="border-border/70 bg-card/80 shadow-sm">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">
          {t.auth.createTitle}
        </CardTitle>
        <CardDescription>{t.auth.createBody}</CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm />
      </CardContent>
    </Card>
  );
}
