/* The ONE place the brand lives. Change it here, then run `python3 tools/rebrand.py`
   to sync the static fallbacks (page <title>, meta tags, manifest).
   Never put "GTA", "Rockstar" or "Grand Theft Auto" in name, short or logo. */
window.BRAND = {
  name: "STILLWORKS",
  short: "STILLWORKS",
  logo: ["STILL", "WORKS"],
  tagline: "The live tracker for GTA 6: what works, what's patched, what's real.",
  /* Live board API. "" = not public yet (GitHub Pages): the page never calls it and votes/forms
     say they open with the board. server/devserve.py serves "/api" here for local dev.
     On launch set it to the API's https URL (that host must allow CORS from this site). */
  apiBase: "",
  /* Launch: 19 Nov 2026, midnight in the visitor's own time zone (stores unlock by region). */
  launch: "2026-11-19T00:00:00",
  /* Start of the wait meter: Trailer 1 went up on Rockstar's YouTube channel on 5 Dec 2023. */
  waitStart: "2023-12-05T00:00:00Z"
};
