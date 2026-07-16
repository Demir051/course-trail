import Link from "next/link";
import { PersonCard } from "@/components/social/person-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDictionary } from "@/i18n/dictionaries";
import { requireOnboardedProfile } from "@/lib/auth";
import { getFriendRelation, otherPartyId } from "@/lib/friends";
import { getRequestLocale } from "@/lib/locale-server";
import { sanitizeSearchTerm } from "@/lib/search";
import { createClient } from "@/lib/supabase/server";
import type { Friendship } from "@/types/database";

export const metadata = { title: "Friends" };

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_public: boolean;
};

export default async function FriendsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const me = await requireOnboardedProfile();
  const { q } = await searchParams;
  const query = sanitizeSearchTerm(q);
  const t = getDictionary(await getRequestLocale());
  const supabase = await createClient();

  const { data: friendshipRows } = await supabase
    .from("friendships")
    .select("*")
    .or(`requester_id.eq.${me.id},addressee_id.eq.${me.id}`)
    .in("status", ["pending", "accepted"]);

  const friendships = (friendshipRows ?? []) as Friendship[];
  const relatedIds = Array.from(
    new Set(
      friendships.map((f) => otherPartyId(f, me.id)).filter(Boolean),
    ),
  );

  const { data: relatedProfiles } = relatedIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, bio, is_public")
        .in("id", relatedIds)
    : { data: [] as ProfileRow[] };

  const profileById = new Map(
    ((relatedProfiles ?? []) as ProfileRow[]).map((p) => [p.id, p]),
  );

  const friends = friendships
    .filter((f) => f.status === "accepted")
    .map((f) => {
      const person = profileById.get(otherPartyId(f, me.id));
      if (!person) return null;
      return {
        person,
        relation: getFriendRelation(me.id, person.id, f),
      };
    })
    .filter(Boolean) as Array<{
    person: ProfileRow;
    relation: ReturnType<typeof getFriendRelation>;
  }>;

  const incoming = friendships
    .filter((f) => f.status === "pending" && f.addressee_id === me.id)
    .map((f) => {
      const person = profileById.get(f.requester_id);
      if (!person) return null;
      return {
        person,
        relation: getFriendRelation(me.id, person.id, f),
      };
    })
    .filter(Boolean) as Array<{
    person: ProfileRow;
    relation: ReturnType<typeof getFriendRelation>;
  }>;

  const outgoing = friendships
    .filter((f) => f.status === "pending" && f.requester_id === me.id)
    .map((f) => {
      const person = profileById.get(f.addressee_id);
      if (!person) return null;
      return {
        person,
        relation: getFriendRelation(me.id, person.id, f),
      };
    })
    .filter(Boolean) as Array<{
    person: ProfileRow;
    relation: ReturnType<typeof getFriendRelation>;
  }>;

  let searchResults: ProfileRow[] = [];
  if (query.length >= 2) {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, bio, is_public")
      .eq("is_public", true)
      .eq("onboarding_completed", true)
      .neq("id", me.id)
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(24);
    searchResults = (data ?? []) as ProfileRow[];
  }

  const friendshipByOtherId = new Map(
    friendships.map((f) => [otherPartyId(f, me.id), f]),
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-10">
      <div>
        <h1 className="font-heading text-3xl tracking-tight">{t.friends.title}</h1>
        <p className="mt-1 text-muted-foreground">{t.friends.subtitle}</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-heading text-xl">{t.friends.findPeople}</h2>
        <form
          className="flex flex-col gap-2 sm:flex-row"
          action="/friends"
          method="get"
        >
          <Input
            name="q"
            defaultValue={query}
            placeholder={t.friends.searchPlaceholder}
            aria-label={t.friends.searchPlaceholder}
            className="min-h-11 min-w-0 flex-1"
          />
          <Button type="submit" className="min-h-11 shrink-0 sm:min-h-9">
            {t.common.search}
          </Button>
        </form>
        {query.length > 0 && query.length < 2 ? (
          <p className="text-sm text-muted-foreground">
            {t.friends.searchHint}
          </p>
        ) : null}
        {query.length >= 2 ? (
          searchResults.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.common.noResults}</p>
          ) : (
            <div className="space-y-3">
              {searchResults.map((person) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  relation={getFriendRelation(
                    me.id,
                    person.id,
                    friendshipByOtherId.get(person.id) ?? null,
                  )}
                />
              ))}
            </div>
          )
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl">
          {t.friends.requests}{" "}
          {incoming.length > 0 ? (
            <span className="text-muted-foreground">({incoming.length})</span>
          ) : null}
        </h2>
        {incoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t.friends.noRequests}
          </p>
        ) : (
          <div className="space-y-3">
            {incoming.map(({ person, relation }) => (
              <PersonCard
                key={person.id}
                person={person}
                relation={relation}
              />
            ))}
          </div>
        )}
        {outgoing.length > 0 ? (
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              {t.friends.sentRequests}
            </h3>
            {outgoing.map(({ person, relation }) => (
              <PersonCard
                key={person.id}
                person={person}
                relation={relation}
              />
            ))}
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl">
          {t.friends.yourFriends}{" "}
          <span className="text-muted-foreground">({friends.length})</span>
        </h2>
        {friends.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t.friends.noFriends}{" "}
            <Link href="/discover" className="underline-offset-4 hover:underline">
              {t.nav.discover}
            </Link>
          </p>
        ) : (
          <div className="space-y-3">
            {friends.map(({ person, relation }) => (
              <PersonCard
                key={person.id}
                person={person}
                relation={relation}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
