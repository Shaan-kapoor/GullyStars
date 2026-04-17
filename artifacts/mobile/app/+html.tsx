import { ScrollViewStyleReset } from "expo-router/html";
import React from "react";

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />

        <title>Gully Stars</title>
        <meta name="description" content="The grassroots sports community app for cricket, football and basketball." />

        <meta name="theme-color" content="#00C896" />
        <meta name="background-color" content="#0A0E13" />

        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Gully Stars" />

        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />

        <meta property="og:type" content="website" />
        <meta property="og:title" content="Gully Stars" />
        <meta property="og:description" content="The grassroots sports community app for cricket, football and basketball." />

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{
          __html: `
            html, body, #root {
              height: 100%;
              overflow: hidden;
              background: #0A0E13;
              -webkit-tap-highlight-color: transparent;
            }
            * {
              box-sizing: border-box;
            }
            @media (display-mode: standalone) {
              html {
                -webkit-overflow-scrolling: touch;
              }
            }
          `
        }} />

        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js', { scope: '/' })
                  .then(function(reg) {
                    reg.addEventListener('updatefound', function() {
                      var newWorker = reg.installing;
                      if (newWorker) {
                        newWorker.addEventListener('statechange', function() {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            newWorker.postMessage('SKIP_WAITING');
                          }
                        });
                      }
                    });
                  })
                  .catch(function() {});
              });
            }
          `
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
