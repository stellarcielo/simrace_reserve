"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { ReservationEasterEgg } from "@/lib/reservationEasterEggs";

export default function ReservationEasterEggView({
  easterEgg,
}: {
  easterEgg: ReservationEasterEgg;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);

  return (
    <section
      aria-labelledby="easter-egg-heading"
      className="mx-auto max-w-3xl px-4 py-10"
    >
      <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 text-center text-white shadow-lg">
        <div className="px-5 pt-8 sm:px-8">
          <p className="text-xs font-semibold tracking-widest text-emerald-300">
            シークレット・ピット
          </p>
          <h1 id="easter-egg-heading" className="mt-3 text-2xl font-bold sm:text-3xl">
            {easterEgg.title}
          </h1>
          <p className="mx-auto mt-4 max-w-xl whitespace-pre-line text-sm leading-7 text-slate-200">
            {easterEgg.description}
          </p>
        </div>
        <div className="relative mx-auto mt-6 flex aspect-video w-full max-w-2xl items-center justify-center bg-slate-950">
          {easterEgg.imageSrc && failedSource !== easterEgg.imageSrc ? (
            <Image
              src={easterEgg.imageSrc}
              alt={easterEgg.imageAlt}
              fill
              unoptimized
              sizes="(max-width: 768px) calc(100vw - 32px), 672px"
              onError={() => setFailedSource(easterEgg.imageSrc)}
              className="object-contain"
            />
          ) : (
            <p role="status" className="px-5 py-8 text-sm leading-7 text-slate-300">
              {easterEgg.imageSrc
                ? "画像を読み込めませんでした。時間をおいてもう一度お試しください。"
                : "このイースターエッグの画像は準備中です。"}
            </p>
          )}
        </div>
        <div className="px-5 pb-8 pt-6">
          <Link
            href="/reservation"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
          >
            別の予約番号を入力する
          </Link>
        </div>
      </div>
    </section>
  );
}
