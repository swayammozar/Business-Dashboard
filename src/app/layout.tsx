import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Business CMD Dashboard",
  description: "A personal business command dashboard for clear execution.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                function showDashboardError(message) {
                  var id = "business-cmd-runtime-error";
                  if (document.getElementById(id)) return;
                  var box = document.createElement("div");
                  box.id = id;
                  box.style.cssText = "position:fixed;inset:24px;z-index:999999;display:flex;align-items:center;justify-content:center;background:#020617;color:#e2e8f0;font-family:Arial,sans-serif;";
                  box.innerHTML = '<div style="max-width:560px;border:1px solid rgba(248,113,113,.45);background:rgba(15,23,42,.96);border-radius:12px;padding:24px;box-shadow:0 24px 80px rgba(0,0,0,.35)"><p style="margin:0 0 8px;color:#7dd3fc;font-size:12px;font-weight:700;letter-spacing:.22em;text-transform:uppercase">Business CMD Dashboard</p><h1 style="margin:0 0 12px;color:#fff;font-size:28px">Website crashed while loading</h1><p style="margin:0 0 16px;line-height:1.5;color:#cbd5e1">' + String(message).replace(/[<>&]/g, function (c) { return ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]; }) + '</p><button onclick="localStorage.removeItem(\\'business_cmd_supabase_session\\');location.reload()" style="border:0;border-radius:8px;background:#38bdf8;color:#020617;font-weight:700;padding:10px 14px;cursor:pointer">Reset login and reload</button></div>';
                  document.body.appendChild(box);
                }
                window.addEventListener("error", function (event) {
                  showDashboardError(event.message || "Unknown browser error.");
                });
                window.addEventListener("unhandledrejection", function (event) {
                  var reason = event.reason;
                  showDashboardError((reason && (reason.message || reason.toString())) || "Unknown loading error.");
                });
              })();
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
