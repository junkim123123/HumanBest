"use client";

import { PrimaryNav } from "@/components/PrimaryNav";
import { BookOpen, FileText, Video, TrendingUp } from "lucide-react";

export default function LearnPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PrimaryNav />
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Learn</h1>
          <p className="text-slate-600">
            카드뉴스, 꿀팁, 트렌드, 광고 릴스 모음
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Placeholder cards */}
          {[
            { icon: FileText, title: "Freight Pulse", desc: "주간 운임 한 장 요약" },
            { icon: TrendingUp, title: "Tariff Alarm", desc: "이번 주 조심할 관세 이슈" },
            { icon: Video, title: "Behind the Scenes", desc: "현장 작업 영상" },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="bg-white rounded-xl p-6 border border-slate-200 hover:border-electric-blue-300 transition-all"
              >
                <Icon className="w-8 h-8 text-electric-blue-600 mb-3" />
                <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">콘텐츠 준비 중입니다</p>
        </div>
      </div>
    </div>
  );
}














