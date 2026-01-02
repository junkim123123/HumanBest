"use client";

import { Upload, Brain, FileText } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "사진 업로드",
    description: "제품 사진 한 장만 올리세요",
  },
  {
    icon: Brain,
    title: "AI 분석",
    description: "HS 코드, 리스크, 비용 범위 자동 계산",
  },
  {
    icon: FileText,
    title: "리포트 생성",
    description: "최악 기준 포함, 다음 행동까지 제시",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-slate-50 py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            How it works
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            3단계로 랜디드 코스트와 리스크를 바로 확인하세요
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-electric-blue-100 mb-4">
                  <Icon className="w-8 h-8 text-electric-blue-600" />
                </div>
                <div className="text-sm font-bold text-electric-blue-600 mb-2">
                  Step {index + 1}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-slate-600">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}














