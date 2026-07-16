import { getDictionary } from "@/i18n/dictionaries";
import { getRequestLocale } from "@/lib/locale-server";

/** Dictionary for the current request locale (server actions / RSC). */
export async function getT() {
  return getDictionary(await getRequestLocale());
}
