"use client";

import Script from "next/script";

const MEDIA_ID = "6hagdd5kew";
const ASPECT = "0.46153846153846156"; // vídeo vertical

/** Player da VSL (Wistia). Carrega o web component e renderiza o vídeo. */
export function VslPlayer() {
  return (
    <>
      <Script src="https://fast.wistia.com/player.js" strategy="afterInteractive" />
      <Script
        src={`https://fast.wistia.com/embed/${MEDIA_ID}.js`}
        type="module"
        strategy="afterInteractive"
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `wistia-player[media-id='${MEDIA_ID}']:not(:defined){background:center / contain no-repeat url('https://fast.wistia.com/embed/medias/${MEDIA_ID}/swatch');display:block;filter:blur(5px);padding-top:${(100 / Number(ASPECT)).toFixed(2)}%;}`,
        }}
      />
      <div
        className="mx-auto w-full max-w-[280px] overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/5 shadow-[0_28px_70px_-22px_rgba(16,24,40,0.5)]"
        dangerouslySetInnerHTML={{
          __html: `<wistia-player media-id="${MEDIA_ID}" aspect="${ASPECT}" style="display:block;width:100%"></wistia-player>`,
        }}
      />
    </>
  );
}
