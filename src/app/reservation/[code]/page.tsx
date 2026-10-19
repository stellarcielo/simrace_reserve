import ReservationDetailClient from "./ReservationDetailClient";
import ReservationEasterEggView from "@/components/ReservationEasterEgg";
import { prisma } from "@/lib/db";
import { getReservationEasterEgg } from "@/lib/reservationEasterEggs";

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const normalized = code.trim().toUpperCase();
  const easterEgg = getReservationEasterEgg(normalized);

  if (easterEgg) {
    // あとから隠しコードを追加しても、既存予約の照会・キャンセルを妨げない。
    const existing = await prisma.reservation.findUnique({
      where: { code: normalized },
      select: { id: true },
    });
    if (!existing) return <ReservationEasterEggView easterEgg={easterEgg} />;
  }

  return <ReservationDetailClient code={normalized} />;
}
