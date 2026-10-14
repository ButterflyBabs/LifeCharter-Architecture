// Universal links for the iPhone app: tapping a collective.lccommandsuite.com/community or /join link
// (and the old lccommandsuite.com ones, which forward) from email, texts or the web opens the Collective app if
// installed. The same file is served on both hosts; the app lists both under Associated Domains.
export const dynamic = "force-static";

export function GET() {
  const appID = `${process.env.APNS_TEAM_ID || "FLC73LFHKN"}.com.lifecharter.collective`;
  return Response.json(
    {
      applinks: {
        details: [
          {
            appIDs: [appID],
            components: [
              { "/": "/community", comment: "The Collective" },
              { "/": "/community/*" },
              { "/": "/join/*", comment: "Invitation links" },
            ],
          },
        ],
      },
      webcredentials: { apps: [appID] },
    },
    { headers: { "Cache-Control": "public, max-age=3600" } }
  );
}
