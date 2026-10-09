import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { createUniqueReservationCode } from "@/lib/code";

const SAMPLE_COUNT = 5;

export async function POST() {
  try {
    // 空きの確認と登録を同じトランザクションで行い、通常の予約と重複させない。
    const result = await prisma.$transaction(async (tx) => {
      const rigs = await tx.rig.findMany({
        where: { isActive: true },
        orderBy: [{ name: "asc" }, { id: "asc" }],
        select: { id: true },
      });
      if (rigs.length === 0) {
        return {
          ok: false as const,
          error: "先に設定画面で稼働中の機体を登録してください。",
        };
      }

      const slots = await tx.slot.findMany({
        where: { isOpen: true, endTime: { gt: new Date() } },
        orderBy: [{ startTime: "asc" }, { id: "asc" }],
        select: {
          id: true,
          reservations: {
            where: { status: { not: "cancelled" } },
            select: { rigId: true },
          },
        },
      });
      if (slots.length === 0) {
        return {
          ok: false as const,
          error: "先に設定画面で現在または未来の時間枠を生成し、受付中にしてください。",
        };
      }

      const reservations: Prisma.ReservationGetPayload<{
        include: { slot: true; rig: true };
      }>[] = [];
      for (const slot of slots) {
        const occupiedRigIds = new Set(slot.reservations.map((r) => r.rigId));
        for (const rig of rigs) {
          if (occupiedRigIds.has(rig.id)) continue;

          const code = await createUniqueReservationCode(tx);
          const reservation = await tx.reservation.create({
            data: {
              code,
              slotId: slot.id,
              rigId: rig.id,
              name: `サンプル予約 ${reservations.length + 1}`,
            },
            include: { slot: true, rig: true },
          });
          reservations.push(reservation);
          if (reservations.length === SAMPLE_COUNT) break;
        }
        if (reservations.length === SAMPLE_COUNT) break;
      }

      if (reservations.length === 0) {
        return {
          ok: false as const,
          error: "サンプル予約を作成できる空き枠・機体がありません。",
        };
      }

      return { ok: true as const, reservations };
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    return NextResponse.json(
      { created: result.reservations.length, reservations: result.reservations },
      { status: 201 },
    );
  } catch (error) {
    console.error("サンプル予約の生成に失敗しました。", error);
    return NextResponse.json(
      { error: "サンプル予約の生成に失敗しました。もう一度お試しください。" },
      { status: 500 },
    );
  }
}
