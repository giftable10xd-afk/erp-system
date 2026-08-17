import { continueRender, delayRender, staticFile } from "remotion";

let loaded = false;

export function ensureFontLoaded() {
  if (loaded) return;
  loaded = true;

  const handle = delayRender("تحميل خط Decotype Naskh Special");

  const font = new FontFace(
    "Decotype Naskh Special",
    `url(${staticFile("fonts/decotype-naskh-special.ttf")})`
  );

  font
    .load()
    .then((loadedFont) => {
      document.fonts.add(loadedFont);
      continueRender(handle);
    })
    .catch((err) => {
      console.error("فشل تحميل الخط", err);
      continueRender(handle);
    });
}
