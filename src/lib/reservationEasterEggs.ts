export type ReservationEasterEgg = {
  title: string;
  description: string;
  imageSrc: string | null;
  imageAlt: string;
};

function imageUrl(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

// キーは6文字の半角英数字（英字は大文字）。URLは画像・GIFそのものを指定する。
export const RESERVATION_EASTER_EGGS: Readonly<Record<string, ReservationEasterEgg>> = {
  INMKNG: {
    title: "隠しコースを発見！",
    description: "見つけてくれてありがとう！",
    imageSrc: imageUrl(process.env.EASTER_EGG_GIF1_URL),
    imageAlt: "イースターエッグのアニメーション",
  },
  YJSNPI: {
    title: "隠しコースを発見！",
    description: "見つけてくれてありがとう！",
    imageSrc: imageUrl(process.env.EASTER_EGG_GIF2_URL),
    imageAlt: "イースターエッグのアニメーション",
  },
  MURKMR: {
    title: "隠しコースを発見！",
    description: "見つけてくれてありがとう！",
    imageSrc: imageUrl(process.env.EASTER_EGG_GIF3_URL),
    imageAlt: "イースターエッグのアニメーション",
  },
};

export function getReservationEasterEgg(code: string): ReservationEasterEgg | null {
  const normalized = code.trim().toUpperCase();
  return Object.hasOwn(RESERVATION_EASTER_EGGS, normalized)
    ? RESERVATION_EASTER_EGGS[normalized]
    : null;
}
