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
    // Relative, for the same reason as the lead form: request.url is the
    // container's address behind the proxy.
    return new NextResponse(null, { status: 302, headers: { Location: "/" } });
  }

  const ipHash = hashIp(clientIp(request.headers));
  await logClick(goParams, ipHash);

  const trackedUrl = buildTrackedUrl(destination, goParams);
  return NextResponse.redirect(trackedUrl, { status: 302 });
}
