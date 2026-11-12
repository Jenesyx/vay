const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** 2026 → ۲۰۲۶ */
export const faNum = (n: number | string) => String(n).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);

/** 83.4 → "۰۱:۲۳" */
export const faTime = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  return faNum(`${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`);
};
