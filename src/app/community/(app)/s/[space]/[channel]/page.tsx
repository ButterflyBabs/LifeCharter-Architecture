"use client";

import Link from "next/link";
import { useCommunity } from "@/lib/community/context";
import { ChannelFeed } from "@/components/community/Feed";
import { EmptyState, Eyebrow } from "@/components/community/ui";
import { JoinSpaceBanner } from "@/components/community/JoinSpaceBanner";

export default function ChannelPage({ params }: { params: { space: string; channel: string } }) {
  const { spaceBySlug, channelsFor, isMember } = useCommunity();
  const space = spaceBySlug(params.space);
  const channel = space ? channelsFor(space.id).find((c) => c.slug === params.channel) : undefined;

  if (!space || !channel) {
    return (
      <EmptyState icon="🧭" title="This pathway isn't available">
        It may be private, or the link may have changed. <Link href="/community" className="underline">Back to Home</Link>
      </EmptyState>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <Eyebrow>
          <Link href={`/community/s/${space.slug}`} className="hover:underline">
            {space.emoji} {space.name}
          </Link>
        </Eyebrow>
        <h1 className="mt-1 font-editorial text-[30px] font-semibold leading-tight text-[var(--cm-ink)] md:text-[34px]">
          <span className="mr-2">{channel.emoji}</span>
          {channel.name}
        </h1>
        {channel.description && <p className="mt-1 text-[14.5px] text-[var(--cm-muted-2)]">{channel.description}</p>}
      </div>
      {!isMember(space.id) && <JoinSpaceBanner spaceId={space.id} name={space.name} />}
      <ChannelFeed key={channel.id} channel={channel} />
    </div>
  );
}
