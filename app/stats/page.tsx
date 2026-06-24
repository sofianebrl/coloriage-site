"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { GroupSelector } from "@/components/GroupSelector";
import { groupStats, pastSessions } from "@/lib/stats";

function rateColor(rate: number): string {
  if (rate >= 80) return "bg-emerald-500";
  if (rate >= 50) return "bg-amber-500";
  return "bg-red-500";
}

export default function StatsPage() {
  const { data, ready, selectedGroupId } = useStore();

  const { stats, totalSessions, average } = useMemo(() => {
    if (!selectedGroupId)
      return { stats: [], totalSessions: 0, average: 0 };
    const stats = groupStats(data, selectedGroupId);
    const totalSessions = pastSessions(data, selectedGroupId).length;
    const average =
      stats.length > 0
        ? Math.round(stats.reduce((sum, s) => sum + s.rate, 0) / stats.length)
        : 0;
    return { stats, totalSessions, average };
  }, [data, selectedGroupId]);

  if (!ready) return <p className="text-slate-400">Chargement…</p>;

  if (data.groups.length === 0) {
    return (
      <div>
        <PageHeader title="Statistiques" />
        <EmptyState
          title="Aucun groupe"
          description="Créez d'abord un groupe depuis l'accueil."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Statistiques"
        subtitle="Taux de présence sur les séances passées"
      />

      <GroupSelector />

      {totalSessions === 0 ? (
        <EmptyState
          title="Pas encore de données"
          description="Les statistiques apparaîtront après vos premières séances passées et l'appel des présences."
        />
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3">
            <Card className="animate-rise">
              <p className="text-3xl font-extrabold text-slate-900">
                {totalSessions}
              </p>
              <p className="text-sm text-slate-500">séances passées</p>
            </Card>
            <Card className="animate-rise" >
              <p className="text-3xl font-extrabold text-blue-600">
                {average}%
              </p>
              <p className="text-sm text-slate-500">présence moyenne</p>
            </Card>
          </div>

          <div className="space-y-2">
            {stats.map((s, i) => (
              <Link
                key={s.member.id}
                href={`/membres/${s.member.id}`}
                className="animate-rise block"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <Card className="transition-all duration-150 hover:border-slate-300 hover:shadow active:scale-[0.99]">
                  <div className="mb-2 flex items-center gap-3">
                    <span className="w-5 text-center text-sm font-bold text-slate-400">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium text-slate-900">
                      {s.member.firstName} {s.member.lastName}
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {s.rate}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-[width] duration-700 ease-out ${rateColor(
                        s.rate
                      )}`}
                      style={{ width: `${s.rate}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    {s.present} présent{s.present > 1 ? "s" : ""} · {s.absent}{" "}
                    absent{s.absent > 1 ? "s" : ""} · {s.excuse} excusé
                    {s.excuse > 1 ? "s" : ""}
                    {s.notMarked > 0 && ` · ${s.notMarked} non pointé`}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
