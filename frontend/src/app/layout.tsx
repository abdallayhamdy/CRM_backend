import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { AppShell } from "@/components/layout/AppShell";
import { LAYOUT_CONSTANTS } from "@/lib/layout-constants";
import { Toaster } from "sonner";
import { AuthProvider } from "@/hooks/use-auth";

import { Inter, Lexend_Deca } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeInitializer } from "@/components/ThemeInitializer";
import { ThemeScope } from "@/components/ThemeScope";


const inter = Inter({subsets:['latin'],variable:'--font-sans'});
const lexend = Lexend_Deca({
  subsets: ['latin'],
  variable: '--font-lexend',
  weight: ['300', '400', '500', '600', '700', '800']
});

export const metadata: Metadata = {
  title: { default: "Rootline CRM", template: "%s | Rootline CRM" },
  description: "Your all-in-one CRM for managing contacts, deals, and pipelines.",
  openGraph: {
    title: "Rootline CRM",
    description: "Your all-in-one CRM.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rootline CRM",
    description: "Your all-in-one CRM.",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.ico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full antialiased", "font-sans", inter.variable, lexend.variable)} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem("app-mode");
                  var dark = saved === "dark" || (saved === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
                  if (dark) {
                    document.documentElement.classList.add("dark");
                  } else {
                    document.documentElement.classList.remove("dark");
                  }
                  var colorTheme = localStorage.getItem("app-color-theme") || "rootline";
                  var path = window.location.pathname;
                  var isExempt = ["/", "/login", "/register", "/sign-in", "/sign-up", "/forgot-password", "/reset-password", "/auth-callback"].indexOf(path) !== -1;
                  document.documentElement.setAttribute("data-theme", isExempt ? "none" : colorTheme);
                  var DEFAULT_APPEARANCE = {
                    style: "nova", baseColor: "taupe",
                    chartColor1: "blue", chartColor2: "emerald", chartColor3: "violet",
                    chartColor4: "amber", chartColor5: "rose", radius: "medium",
                    headingFont: "inter", bodyFont: "inter"
                  };
                  var appearance = localStorage.getItem("app-appearance");
                  if (!appearance) {
                    localStorage.setItem("app-appearance", JSON.stringify(DEFAULT_APPEARANCE));
                    appearance = JSON.stringify(DEFAULT_APPEARANCE);
                  }
                  var baseColor = null;
                  if (appearance) {
                    var p = JSON.parse(appearance);
                    baseColor = p.baseColor || DEFAULT_APPEARANCE.baseColor;
                    document.documentElement.setAttribute("data-style", p.style || DEFAULT_APPEARANCE.style);
                    document.documentElement.setAttribute("data-base", baseColor);
                    document.documentElement.setAttribute("data-chart-1", p.chartColor1 || DEFAULT_APPEARANCE.chartColor1);
                    document.documentElement.setAttribute("data-chart-2", p.chartColor2 || DEFAULT_APPEARANCE.chartColor2);
                    document.documentElement.setAttribute("data-chart-3", p.chartColor3 || DEFAULT_APPEARANCE.chartColor3);
                    document.documentElement.setAttribute("data-chart-4", p.chartColor4 || DEFAULT_APPEARANCE.chartColor4);
                    document.documentElement.setAttribute("data-chart-5", p.chartColor5 || DEFAULT_APPEARANCE.chartColor5);
                    document.documentElement.setAttribute("data-radius", p.radius || DEFAULT_APPEARANCE.radius);
                    document.documentElement.setAttribute("data-heading-font", p.headingFont || DEFAULT_APPEARANCE.headingFont);
                    document.documentElement.setAttribute("data-body-font", p.bodyFont || DEFAULT_APPEARANCE.bodyFont);
                  }
                  var DARK_BG = {
                    rootline:"225 50% 8%",ocean:"210 15% 13%",forest:"150 12% 13%",
                    sunset:"25 15% 13%",rose:"340 15% 13%",purple:"270 15% 13%",
                    midnight:"220 12% 13%",lavender:"260 15% 13%",emerald:"160 12% 13%",
                    amber:"40 15% 13%",slate:"210 10% 13%",crimson:"0 15% 13%",
                    coral:"10 15% 13%",mint:"165 12% 13%",indigo:"235 15% 13%",
                    peach:"20 15% 13%",teal:"175 15% 13%",magenta:"310 15% 13%",
                    olive:"80 10% 13%",sky:"195 15% 13%",copper:"18 12% 13%",
                    lilac:"280 15% 13%",charcoal:"210 5% 13%",gold:"45 15% 13%",
                    black:"0 0% 8%"
                  };
                  var LIGHT_BASE_BG = {
                    neutral:"0 0% 100%",stone:"30 10% 98%",zinc:"240 6% 98%",
                    mauve:"270 10% 98%",olive:"80 10% 98%",mist:"190 10% 98%",taupe:"15 10% 98%"
                  };
                  var LIGHT_THEME_BG = {
                    midnight:"220 25% 95%",lavender:"260 15% 95%",emerald:"160 15% 95%",
                    amber:"40 15% 95%",slate:"210 10% 95%",crimson:"0 15% 95%",
                    coral:"10 15% 95%",mint:"165 15% 95%",indigo:"235 15% 95%",
                    peach:"20 15% 95%",teal:"175 15% 95%",magenta:"310 15% 95%",
                    olive:"80 10% 95%",sky:"195 20% 95%",copper:"18 12% 95%",
                    lilac:"280 15% 95%",charcoal:"210 5% 94%",gold:"45 15% 95%",
                    black:"0 0% 94%"
                  };
                  var bg;
                  if (dark) {
                    bg = DARK_BG[colorTheme] || "225 50% 8%";
                  } else if (baseColor && LIGHT_BASE_BG[baseColor]) {
                    bg = LIGHT_BASE_BG[baseColor];
                  } else {
                    bg = LIGHT_THEME_BG[colorTheme] || "35 20% 88%";
                  }
                  document.documentElement.style.backgroundColor = "hsl(" + bg + ")";
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
        <body className="min-h-screen bg-background font-sans selection:bg-primary/20 overflow-auto" suppressHydrationWarning>
        <AuthProvider>
          <ThemeProvider>
            <ThemeScope />
            <ThemeInitializer />
            <SidebarProvider>
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[999] focus:bg-background focus:text-foreground focus:px-4 focus:py-2 focus:border focus:rounded-md focus:shadow-lg"
              >
                Skip to main content
              </a>
              <AppShell>
                {children}
              </AppShell>
            </SidebarProvider>
            <Toaster position="top-right" richColors />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
