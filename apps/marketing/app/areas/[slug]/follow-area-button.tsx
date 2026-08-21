"use client";

import { useActionState } from "react";
import Link from "next/link";
import { followAreaAction, unfollowAreaAction } from "@/lib/followed-area-actions";
import { Button } from "@/components/ui";

export function FollowAreaButton({
  areaSlug,
  isLoggedIn,
  initiallyFollowed,
}: {
  areaSlug: string;
  isLoggedIn: boolean;
  initiallyFollowed: boolean;
}) {
  const [followState, followAction, followPending] = useActionState(followAreaAction, {});
  const [unfollowState, unfollowAction, unfollowPending] = useActionState(unfollowAreaAction, {});

  if (!isLoggedIn) {
    return (
      <Link href="/auth/signup">
        <Button variant="secondary">Follow this area</Button>
      </Link>
    );
  }

  // Optimistic-ish: once either action resolves ok, trust that over the
  // server-rendered initial prop for the rest of this page's lifetime.
  const isFollowed =
    unfollowState?.ok ? false : followState?.ok ? true : initiallyFollowed;

  if (isFollowed) {
    return (
      <form action={unfollowAction}>
        <input type="hidden" name="areaSlug" value={areaSlug} />
        <Button variant="secondary" type="submit" disabled={unfollowPending}>
          {unfollowPending ? "Removing…" : "Following ✓"}
        </Button>
      </form>
    );
  }

  return (
    <form action={followAction}>
      <input type="hidden" name="areaSlug" value={areaSlug} />
      <Button variant="secondary" type="submit" disabled={followPending}>
        {followPending ? "Following…" : "Follow this area"}
      </Button>
    </form>
  );
}
