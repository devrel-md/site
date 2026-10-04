// Retired endpoint: old forms must not create leads or trigger sales systems.
export async function POST(): Promise<Response> {
  return new Response("The unlock form has been retired. Your file is available without signup.", { status: 410 });
}
