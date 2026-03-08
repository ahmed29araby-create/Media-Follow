import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type OAuthState = {
  userId: string;
  origin?: string;
};

function normalizeOrigin(origin: string | null | undefined): string | undefined {
  if (!origin) return undefined;

  try {
    const parsed = new URL(origin);
    const host = parsed.hostname.toLowerCase();
    const isLocalhost = host === "localhost" || host === "127.0.0.1";
    const isAllowedHost =
      isLocalhost || host.endsWith(".lovable.app") || host.endsWith(".lovableproject.com");
    const isAllowedProtocol = parsed.protocol === "https:" || (isLocalhost && parsed.protocol === "http:");

    if (!isAllowedHost || !isAllowedProtocol) return undefined;

    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return undefined;
  }
}

function parseOAuthState(rawState: string): OAuthState | null {
  try {
    const decoded = JSON.parse(atob(rawState));
    if (!decoded || typeof decoded.userId !== "string") return null;

    return {
      userId: decoded.userId,
      origin: normalizeOrigin(typeof decoded.origin === "string" ? decoded.origin : undefined),
    };
  } catch {
    return null;
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    const parsedState = state ? parseOAuthState(state) : null;
    const userId = parsedState?.userId ?? state;
    const appOrigin = parsedState?.origin;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    if (error) {
      return new Response(generateHTML("error", `Authorization denied: ${error}`, appOrigin), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (!code || !state || !userId) {
      return new Response(generateHTML("error", "Missing authorization code", appOrigin), {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Verify user is admin
    const { data: roleData } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(generateHTML("error", "Admin access required", appOrigin), {
        status: 403,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Extract client credentials (handle JSON credentials format)
    let clientId = Deno.env.get("GOOGLE_CLIENT_ID")!.trim();
    let clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!.trim();
    if (clientId.startsWith("{")) {
      try {
        const p = JSON.parse(clientId);
        clientId = p?.web?.client_id || p?.installed?.client_id || clientId;
      } catch {
        /* use original value */
      }
    }
    if (clientSecret.startsWith("{")) {
      try {
        const p = JSON.parse(clientSecret);
        clientSecret = p?.web?.client_secret || p?.installed?.client_secret || clientSecret;
      } catch {
        /* use original value */
      }
    }
    const redirectUri = `${supabaseUrl}/functions/v1/google-drive-callback`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.refresh_token) {
      return new Response(generateHTML("error", "Failed to get refresh token. Please try again.", appOrigin), {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Get user info from Google to show which account is connected
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userInfo = await userInfoRes.json();
    const connectedEmail = userInfo.email || "Unknown";

    // Store refresh token and connected email in admin_settings
    await serviceClient.from("admin_settings").upsert(
      { setting_key: "google_drive_refresh_token", setting_value: tokenData.refresh_token },
      { onConflict: "setting_key" },
    );

    await serviceClient.from("admin_settings").upsert(
      { setting_key: "google_drive_email", setting_value: connectedEmail },
      { onConflict: "setting_key" },
    );

    return new Response(
      generateHTML("success", `Google Drive connected successfully as ${connectedEmail}!`, appOrigin, connectedEmail),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  } catch (err) {
    return new Response(generateHTML("error", `Error: ${err.message}`), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
});

function generateHTML(
  status: "success" | "error",
  message: string,
  appOrigin?: string,
  connectedEmail?: string,
): string {
  const color = status === "success" ? "#22c55e" : "#ef4444";
  const icon = status === "success" ? "✓" : "✗";
  const safeMessage = escapeHtml(message);
  const safeOrigin = appOrigin ? JSON.stringify(appOrigin) : "null";
  const safeEmail = connectedEmail ? JSON.stringify(connectedEmail) : "null";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Google Drive - ${status === "success" ? "Connected" : "Error"}</title>
</head>
<body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0a0a0a;font-family:system-ui,sans-serif;color:#fff;">
  <div style="text-align:center;max-width:420px;padding:40px;">
    <div style="font-size:64px;color:${color};margin-bottom:16px;">${icon}</div>
    <h1 style="font-size:20px;margin-bottom:8px;line-height:1.4;">${safeMessage}</h1>
    <p style="color:#888;font-size:14px;">You can close this window and return to the app.</p>
  </div>

  <script>
    (() => {
      const origin = ${safeOrigin};
      const payload = {
        type: "google-drive-oauth",
        status: "${status}",
        email: ${safeEmail},
      };

      if (window.opener && origin) {
        try {
          window.opener.postMessage(payload, origin);
          window.close();
          return;
        } catch (_) {}
      }

      if (origin) {
        try {
          const target = new URL("/settings", origin);
          target.searchParams.set("google_drive", status === "success" ? "connected" : "error");
          window.location.replace(target.toString());
          return;
        } catch (_) {}
      }

      setTimeout(() => window.close(), 3000);
    })();
  </script>
</body>
</html>`;
}
