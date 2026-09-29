import { NextRequest, NextResponse } from "next/server";
import { resolveGo, buildTrackedUrl } from "@/lib/goRedirect";
import { logClick } from "@/lib/clicks";
import { clientIp, hashIp } from "@/lib/hash";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: Params): Promise<Response> {
  const { slug } = await params;
  const { destination, params: goParams } = resolveGo(slug, request.nextUrl.searchParams);

  if (!destination) {
    return NextResponse.redirect(new URL("/", request.url), { status: 302 });
  }

  const ipHash = hashIp(clientIp(request.headers));
  await logClick(goParams, ipHash);

  const trackedUrl = buildTrackedUrl(destination, goParams);
  return NextResponse.redirect(trackedUrl, { status: 302 });
}
