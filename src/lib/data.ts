// All site content. Components read from here.
// Lyrics were supplied by the user (workspace rule: lyric lines only come from the user).

export const song = {
  fa: "وای",
  en: "VAY",
  artists: { fa: "کیکستی × مرصاد", en: "KIXTY × MERSAD" },
  released: { fa: "پنجشنبه ۲۱ آبان ۱۴۰۵", en: "Thursday 12 Nov 2026" },
  durationSec: 162,
  video: "/media/vay.mp4", // 720×540
  videoSm: "/media/vay-sm.mp4", // 480×360 for phones (the CRT glass hides the difference)
  poster: "/media/vay-poster.jpg",
  stream: "https://push.fm/fl/vay",
  /** their own teaser caption (Instagram), written in Finglish; reads like a wedding invite */
  teaser: { fa: "آخر هفته با دست و جیغ و هورا منتظریم", en: "this weekend, we'll be waiting with claps, screams and hooray" },
  youtube: "https://youtu.be/d7NED6aq7aQ",
};

export const artists = [
  { id: "kixty", fa: "کیکستی", en: "KIXTY", links: [{ label: "Instagram", href: "https://www.instagram.com/kixty_" }, { label: "X", href: "https://x.com/kixt7_" }] },
  { id: "mersad", fa: "مرصاد", en: "MERSAD", links: [{ label: "Instagram", href: "https://www.instagram.com/akamersad" }, { label: "X", href: "https://x.com/akamersad" }] },
] as const;

/** From the official video description. */
export const credits: { fa: string; en: string; names: string }[] = [
  { fa: "آهنگسازی", en: "Music producer", names: "KIXTY, 100SUBARU" },
  { fa: "کارگردانی هنری", en: "Art direction", names: "NAB FACTORY, WHAT CREATIVE HOUSE" },
  { fa: "آرت‌ورک", en: "Artwork", names: "RAEII" },
  { fa: "میکس", en: "Mix", names: "KIXTY" },
  { fa: "مستر", en: "Master", names: "SOUNDLAB STUDIO" },
  { fa: "مدیر پروژه", en: "Project manager", names: "POURYA, RASHEDJV" },
];

export type Who = "kixty" | "mersad" | "duo" | "all";

export type Part = {
  id: string;
  fa: string;
  en: string;
  who: Who;
  lines: string[];
};

export const parts: Part[] = [
  { id: "intro", fa: "اینترو", en: "Intro", who: "all", lines: ["(برید کن-)"] },
  {
    id: "v1",
    fa: "ورس ۱ — کیکستی",
    en: "Verse 1 — Kixty",
    who: "kixty",
    lines: [
      "دارم میام کار خب پس بچینش",
      "بگو برن یه مشت ازگل کلیشه",
      "می‌دونی که حرف لمپن به کیره",
      "من رپرم چون شرتم سفیده",
      "این حرفا تو کت من نمی‌ره",
      "جوییدم بکس تو منم تریدنت",
      "دافت گاییده از پیشم نمی‌ره",
      "تخمم نی هرکی یه چی بهم بگه",
      "پس",
    ],
  },
  {
    id: "bridge",
    fa: "بریج — کیکستی",
    en: "Bridge — Kixty",
    who: "kixty",
    lines: [
      "(وای)",
      "نمی‌رسن بهم پلشتا (وای)",
      "نمی‌شم هندل خطرناک (وای)",
      "حال من بنگه بلد با (وای)",
      "بدجوری خندن از اخمات (وای)",
    ],
  },
  {
    id: "interlude1",
    fa: "اینترلود",
    en: "Interlude",
    who: "all",
    lines: [
      "ممنونم از عزیزانی که (وای)",
      "اومدین مراسم (وای)",
      "آقا انرژیا نیوفته ها (وای)",
      "انرژی اصن پایینه پایینه پایینه پایینه پایینه پایینه پایینه پایینه",
    ],
  },
  {
    id: "v2",
    fa: "ورس ۲ — کیکستی",
    en: "Verse 2 — Kixty",
    who: "kixty",
    lines: [
      "ویترین و پیشونیم عرق داره",
      "بیبی آخ دافتم طرفداره",
      "می‌گی تیمتم بدجوری بداَس‌کاره",
      "یا گفتی یه مشت کلاسور ورق بامه",
      "رپر موردعلاقت بدهکاره",
      "به رفیقم بدهکاره",
      "دافت تیک می‌زنه ولی قلق داره",
      "جفتمون می‌دونیم تتو کمر داره",
    ],
  },
  {
    id: "v3",
    fa: "ورس ۳ — مرصاد و کیکستی",
    en: "Verse 3 — Mersad & Kixty",
    who: "duo",
    lines: [
      "(سام‌علیک، بیا)",
      "شرمنده زحمت دادیم (وای بیا)",
      "متاسفام خطرناکیم (بیا)",
      "ته استکان کمرباریک (وای بیا)",
      "عشق و حال ورق‌بازی (بیا)",
      "کلی عرق کردی یه کم بدرخشی (بیا)",
      "به خودم بگو داری گله هرچی (وای-)",
      "نه تو دلمی نه می‌شه کر من شی (بیا)",
      "بیخیال پسر بده یه قر مشتی",
      "تا کونو تکون می‌ده می‌گه شاباش من چی",
      "گوشت‌تلخی مثل امیرعلی داداش افشین",
      "آنتن نمی‌دی می‌زنن کانال بعدی",
      "مثل شاهای قدیم داریم اخلاقای سمی",
      "دافت کونش به توئه می‌کنه منو نگاه هی",
      "خوشش میاد با هم دعوا کنیم سر و صدا شه",
      "کلی اعتمادبه‌نفس می‌گیره حال می‌کنه ولی",
      "فردا صبحش تورو بلاک می‌کنه سریع",
    ],
  },
  { id: "interlude2", fa: "اینترلود — مرصاد", en: "Interlude — Mersad", who: "mersad", lines: ["وای چه پسری"] },
  {
    id: "v4",
    fa: "ورس ۴ — مرصاد و کیکستی",
    en: "Verse 4 — Mersad & Kixty",
    who: "duo",
    lines: [
      "بهم می‌گن مرصاد باس‌فایت رپی",
      "برا فیت باهام باید کارزار بزنی",
      "بلاک چیه بوی باید بات‌پلاگ بخری",
      "استاد اسکی رو آلپاین عنی",
      "وست‌ساید قوی (یه تاگ لایف غنی)",
      "فاز داری پسر با - بپری",
      "جلو داف لفظ میای حال مال بخری",
      "پولت کم میاد می‌شی ساین‌شاین ددی",
      "رپ چیه باس شیفت پارت‌تیم بزنی",
      "سواگ چیه (عو) شبیه باب راسه یزید",
      "جنس منس می‌زنی تو آفتاب می‌پری",
      "سپردم سایه‌تو با باشماق بزنیم",
      "دیش دیری دی",
      "رو صورت نداری ریش سیبیلی",
      "ساوندمو گوش کنی جیش می‌رینی",
      "دیش دیری دی",
    ],
  },
  {
    id: "outro",
    fa: "اوترو — کیکستی",
    en: "Outro — Kixty",
    who: "kixty",
    lines: ["دیدارا دیدان دان دادان", "دیدارا دیدان دان دادان", "(Swag)", "آها"],
  },
];

/** Every lyric line in order, with its part. Index = position in timings.json. */
export const flatLines = parts.flatMap((p) => p.lines.map((text) => ({ text, part: p })));

/** Lines that trigger something on screen when they are sung. */
export const cues = {
  channel: flatLines.findIndex((l) => l.text.startsWith("آنتن نمی‌دی")),
  shabash: flatLines.findIndex((l) => l.text.includes("شاباش")),
};

/** Wedding-album stills pulled from the music video (seconds = where the shot is). */
// alt text describes the shot only; who is who in the video is unconfirmed (bible ⚠️), so no names
export const album: { src: string; t: number; frame: "heart" | "oval" | "arch" | "rect"; alt: string }[] = [
  { src: "/media/album-01.jpg", t: 8.8, frame: "arch", alt: "Curly-haired man in a black suit in front of silver tinsel" },
  { src: "/media/album-02.jpg", t: 17.6, frame: "oval", alt: "Long-haired man in a suit with silver tinsel round his neck" },
  { src: "/media/album-03.jpg", t: 18.6, frame: "rect", alt: "Man pulling open his shirt collar in the crowd" },
  { src: "/media/album-04.jpg", t: 25.6, frame: "heart", alt: "Three men in black suits standing side by side" },
  { src: "/media/album-05.jpg", t: 37.4, frame: "rect", alt: "Hands fanning out a stack of cash" },
  { src: "/media/album-06.jpg", t: 41.4, frame: "oval", alt: "Man lying back on a floor covered in money" },
  { src: "/media/album-07.jpg", t: 42.6, frame: "arch", alt: "Man upside down in a pile of bills" },
  { src: "/media/album-08.jpg", t: 76.0, frame: "heart", alt: "Bald man with a mustache pointing at the camera next to a curly-haired friend" },
  { src: "/media/album-09.jpg", t: 105.3, frame: "rect", alt: "Bald man with a mustache frowning into the lens" },
  { src: "/media/album-10.jpg", t: 107.4, frame: "arch", alt: "Bald man in a suit in front of the tinsel curtain, crowd behind" },
  { src: "/media/album-11.jpg", t: 140.5, frame: "oval", alt: "Guest raising a hand in the packed party" },
  { src: "/media/album-12.jpg", t: 149.0, frame: "heart", alt: "Man in sunglasses in the middle of the crowd" },
];

/** the maker: shown in the footer and printed on every shared invitation image */
export const credit = { handle: "@artabidkhori", href: "https://www.instagram.com/artabidkhori" };
