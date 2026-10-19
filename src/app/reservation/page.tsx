"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReservationLookupPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed) router.push(`/reservation/${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-xl font-bold">予約照会</h1>
      <p className="mt-2 text-sm text-slate-600">
        予約完了時に発行された予約コードを入力してください。
      </p>
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={6}
          placeholder="例: A3F9K2"
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 uppercase tracking-widest"
        />
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-white"
        >
          照会
        </button>
      </form>
    </div>
  );
}
