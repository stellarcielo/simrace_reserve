"use client";

import { useEffect, useState } from "react";
import Announcements from "@/components/Announcements";

type Reservation = {
  code: string;
  name: string;
  grade: string | null;
  status: "confirmed" | "cancelled" | "checked_in";
  slot: { date: string; startTime: string; endTime: string };
  rig: { name: string; spec: string };
};

function formatDateLabel(date: string) {
  const d = new Date(`${date}T00:00:00+09:00`);
  return d.toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function formatTimeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_LABEL: Record<Reservation["status"], string> = {
  confirmed: "予約確定",
  cancelled: "キャンセル済み",
  checked_in: "受付済み",
};

export default function ReservationDetailClient({ code }: { code: string }) {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/reservations/${encodeURIComponent(code)}`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "予約が見つかりません。");
      setReservation(null);
    } else {
      setReservation(data.reservation as Reservation);
      setError(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    // codeが変わるたびにAPIから予約情報を取得する
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function handleCancel() {
    if (!confirm("この予約をキャンセルしますか？")) return;
    setCancelling(true);
    const res = await fetch(`/api/reservations/${encodeURIComponent(code)}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "キャンセルに失敗しました。");
    } else {
      await load();
    }
    setCancelling(false);
  }

  if (loading) {
    return <p className="px-4 py-10 text-center text-slate-500">読み込み中...</p>;
  }

  if (error || !reservation) {
    return (
      <p className="px-4 py-10 text-center text-red-600">
        {error ?? "予約が見つかりません。"}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-xl font-bold">予約内容</h1>
      <Announcements className="mt-4" />
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-2xl font-bold tracking-widest">{reservation.code}</p>
        <p className="mt-2 text-sm text-slate-600">
          ステータス: {STATUS_LABEL[reservation.status]}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          {formatDateLabel(reservation.slot.date)}{" "}
          {formatTimeLabel(reservation.slot.startTime)}〜
          {formatTimeLabel(reservation.slot.endTime)}
        </p>
        <p className="text-sm text-slate-600">
          {reservation.name} 様
          {reservation.grade ? `（${reservation.grade}）` : ""}
        </p>
        <p className="mt-2 text-sm font-medium text-slate-700">{reservation.rig.name}</p>
        {reservation.rig.spec && (
          <p className="text-xs text-slate-500">{reservation.rig.spec}</p>
        )}
      </div>

      {reservation.status === "confirmed" && (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="mt-6 w-full rounded-lg border border-red-300 px-4 py-2 text-red-600 disabled:opacity-50"
        >
          {cancelling ? "処理中..." : "予約をキャンセルする"}
        </button>
      )}
    </div>
  );
}
