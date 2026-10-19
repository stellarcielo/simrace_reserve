import { randomInt } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { getReservationEasterEgg } from "@/lib/reservationEasterEggs";

// 紛らわしい文字 (0/O, 1/I) を除いた英数字
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateReservationCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}

export async function createUniqueReservationCode(
  tx: Prisma.TransactionClient,
): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReservationCode();
    if (getReservationEasterEgg(code)) continue;
    const existing = await tx.reservation.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new Error("予約コードの生成に失敗しました。もう一度お試しください。");
}
