import Script from "next/script";

export function GoogleAdsenseScript() {
  return (
    <Script
      id="google-adsense-script"
      async
      strategy="afterInteractive"
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9041574190753656"
      crossOrigin="anonymous"
    />
  );
}
