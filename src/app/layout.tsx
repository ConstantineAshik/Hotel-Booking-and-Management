import {siteMetadata,siteSettings} from "../server/site-metadata";
import "./globals.css";
import "./admin.css";
import "./calendar.css";
import "./public.css";
import "./booking.css";
import "./print.css";
import "./cms.css";
import "./theme.css";
export const dynamic="force-dynamic";
export const generateMetadata=siteMetadata;
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const site=await siteSettings();const locale=site?.property.locale??"en";
  return <html lang={locale} dir={locale==="ar"?"rtl":"ltr"}><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>;
}
