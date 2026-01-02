"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ReportNotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="flex justify-center mb-4">
          <AlertCircle className="w-12 h-12 text-slate-400" />
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          리포트를 찾을 수 없습니다
        </h1>
        <p className="text-slate-600 mb-6">
          리포트 생성에 실패했거나 삭제되었을 수 있습니다.
        </p>
        <div className="space-y-3">
          <Link href="/analyze">
            <Button className="w-full bg-electric-blue-600 hover:bg-electric-blue-700">
              새 분석 시작하기
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full">
              홈으로 돌아가기
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

