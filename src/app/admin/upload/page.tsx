"use client";

import { useState, useCallback } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Upload, FileUp, CheckCircle, AlertCircle, RefreshCw, FileText } from "lucide-react";

export default function AdminUploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [stats, setStats] = useState({ success: 0, fail: 0, error: 0 });

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`${timestamp}: ${message}`, ...prev.slice(0, 99)]);
  };

  // 파일 처리 (하나씩 순차 처리)
  const processFiles = async (files: File[]) => {
    setIsProcessing(true);
    setLogs([]);
    setStats({ success: 0, fail: 0, error: 0 });
    setProgress({ current: 0, total: files.length });

    addLog(`🚀 총 ${files.length}개 파일 업로드 시작...`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress((prev) => ({ ...prev, current: i + 1 }));
      addLog(`📄 [${i + 1}/${files.length}] 처리 중: ${file.name}`);

      try {
        let jsonData: any[] = [];

        if (file.name.endsWith(".csv")) {
          jsonData = await parseCSV(file);
        } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
          jsonData = await parseXLSX(file);
        } else {
          addLog(`⚠️ 지원하지 않는 파일 형식: ${file.name}`);
          continue;
        }

        if (jsonData.length === 0) {
          addLog(`⚠️ 데이터가 없습니다: ${file.name}`);
          continue;
        }

        // API로 전송
        await uploadToDB(jsonData, file.name);

      } catch (error: any) {
        addLog(`❌ 파일 처리 오류 (${file.name}): ${error.message}`);
        setStats((prev) => ({ ...prev, error: prev.error + 1 }));
      }
    }

    addLog("🎉 모든 작업 완료!");
    setIsProcessing(false);
  };

  const parseCSV = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (error) => reject(error),
      });
    });
  };

  const parseXLSX = async (file: File): Promise<any[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // 헤더 행 찾기
    const allRows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null,
    }) as unknown[][];

    if (allRows.length === 0) {
      return [];
    }

    // For ImportKey format: first row is metadata, real header is first data row
    // Check if first row looks like metadata (contains "ImportKey" or is mostly empty)
    let headerRowIndex = 0;
    
    const firstRow = allRows[0] as (string | null)[];
    const firstRowText = firstRow.map(c => String(c || "").toUpperCase()).join(" ");
    const isMetadataRow = 
      firstRowText.includes("IMPORTKEY") || 
      firstRowText.includes("EXPORT") ||
      firstRow.length < 3; // Very few columns suggests metadata
    
    if (isMetadataRow && allRows.length > 1) {
      // First row is metadata, second row is the real header
      headerRowIndex = 1;
    } else {
      // Check if first row looks like a header (contains common ImportKey column names)
      const hasHeaderKeywords = 
        firstRowText.includes("SUPPLIER") || 
        firstRowText.includes("CARGO") || 
        firstRowText.includes("BUYER") ||
        firstRowText.includes("DESCRIPTION");
      
      if (hasHeaderKeywords) {
        // First row is the header
        headerRowIndex = 0;
      } else {
        // Fallback: find row with most non-empty cells
        let maxNonEmptyCells = 0;
        for (let i = 0; i < Math.min(5, allRows.length); i++) {
          const row = allRows[i] as (string | null)[];
          const nonEmptyCount = row.filter((cell) => cell && String(cell).trim() !== "").length;
          if (nonEmptyCount > maxNonEmptyCells) {
            maxNonEmptyCells = nonEmptyCount;
            headerRowIndex = i;
          }
        }
      }
    }

    // 헤더 추출
    const rawHeaders = allRows[headerRowIndex] as (string | null)[];
    const headers: string[] = [];
    const headerIndices: number[] = [];
    
    rawHeaders.forEach((header, index) => {
      const headerStr = header ? String(header).trim() : "";
      if (headerStr !== "") {
        headers.push(headerStr);
        headerIndices.push(index);
      }
    });

    if (headers.length === 0) {
      return [];
    }

    // 데이터 행 변환
    const rows = allRows.slice(headerRowIndex + 1) as unknown[][];
    const data = rows
      .filter((row) => {
        const rowArray = row as (string | null)[];
        return rowArray.some((cell, idx) => {
          if (!headerIndices.includes(idx)) return false;
          return cell && String(cell).trim() !== "";
        });
      })
      .map((row) => {
        const obj: Record<string, unknown> = {};
        headers.forEach((header, headerIdx) => {
          const colIndex = headerIndices[headerIdx];
          const cellValue = (row as (string | null)[])[colIndex];
          obj[header] = cellValue ? String(cellValue).trim() : "";
        });
        return obj;
      });

    return data;
  };

  const uploadToDB = async (data: any[], fileName: string) => {
    try {
      const response = await fetch("/api/admin/upload-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });

      const result = await response.json();

      if (response.ok) {
        setStats((prev) => ({
          success: prev.success + result.data.successCount,
          fail: prev.fail + result.data.failedCount,
          error: prev.error + result.data.errorCount,
        }));
        addLog(`✅ ${fileName}: 성공 ${result.data.successCount}건 / 실패 ${result.data.failedCount}건`);
      } else {
        throw new Error(result.error || "서버 오류");
      }
    } catch (error: any) {
      throw error;
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    // 여러 파일 받기
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) processFiles(files);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // 여러 파일 받기
      const files = Array.from(e.target.files);
      processFiles(files);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">ImportKey 데이터 주유소 ⛽</h1>
        <p className="text-slate-500 mt-2">
          수집한 엑셀(CSV/XLSX) 파일을 여기에 몽땅 던져주세요. DB에 자동으로 채워집니다.
        </p>
      </div>

      {/* 업로드 영역 */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer
          ${isDragging ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"}
          ${isProcessing ? "opacity-50 pointer-events-none" : ""}
        `}
      >
        <input
          type="file"
          multiple // 중요: 다중 선택 허용
          accept=".csv, .xlsx, .xls"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-white rounded-full shadow-sm">
            {isProcessing ? (
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-blue-600" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {isProcessing ? "데이터 주입 중..." : "파일을 드래그하거나 클릭하세요"}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              CSV 또는 Excel 파일 지원 (다중 선택 가능)
            </p>
          </div>
        </div>
      </div>

      {/* 진행 상황 및 결과 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">성공</p>
            <p className="text-2xl font-bold text-green-600">{stats.success}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-red-100 rounded-lg">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">실패(중복/누락)</p>
            <p className="text-2xl font-bold text-red-600">{stats.fail}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">진행률</p>
            <p className="text-2xl font-bold text-blue-600">
              {progress.total > 0 ? `${Math.round((progress.current / progress.total) * 100)}%` : "0%"}
            </p>
            <p className="text-xs text-slate-400">({progress.current}/{progress.total} 파일)</p>
          </div>
        </div>
      </div>

      {/* 로그창 */}
      <div className="bg-slate-900 rounded-xl p-6 h-64 overflow-y-auto font-mono text-sm">
        {logs.length === 0 ? (
          <p className="text-slate-500">대기 중...</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="text-slate-300 mb-1 border-b border-slate-800 pb-1 last:border-0">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
