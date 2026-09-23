// Universal links for the iPhone app: tapping a lccommandsuite.com/community or
// /join link (from email, texts, the web) opens the Collective app if installed.
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
