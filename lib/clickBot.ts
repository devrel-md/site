// Flags /go requests that look automated, so click metrics can leave them out.
// The click is still logged and the redirect still happens: this only labels it.
//
// Two signals, either one is enough:
// - The user agent names itself as a bot, crawler, link checker or HTTP library.
// - The user agent claims to be a browser but the request has no Sec-Fetch-Mode
//   header. Every current Chrome, Edge, Firefox and Safari sends it on a real
//   navigation; crawlers that copy a browser user agent usually don't. On launch
//   day, two such crawlers fetched every /go link on the home page within the same
//   second, doubling the click count.

const AUTOMATED_UA =
  /bot\b|bot\/|crawl|spider|slurp|scrapy|fetch|preview|monitor|uptime|lighthouse|headless|curl|wget|python|go-http|java\/|okhttp|axios|node-fetch|undici|libwww|httpclient/i;

export function isLikelyBot(headers: Headers): boolean {
  const userAgent = headers.get("user-agent")?.trim() ?? "";
  if (!userAgent) return true;
  if (AUTOMATED_UA.test(userAgent)) return true;
  if (/^Mozilla\//.test(userAgent) && !headers.get("sec-fetch-mode")) return true;
  return false;
}
