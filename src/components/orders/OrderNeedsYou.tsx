'use client';

import { AlertCircle, CheckCircle } from 'lucide-react';

interface OrderNeedsYouProps {
  tasks: any[];
  onMarkDone?: (taskId: string) => Promise<void>;
}

export default function OrderNeedsYou({ tasks, onMarkDone }: OrderNeedsYouProps) {
  const openTasks = tasks.filter(t => t.status === 'open');

  if (openTasks.length === 0) {
    return null;
  }

  return (
    <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <AlertCircle className="w-5 h-5 text-amber-600" />
        <h3 className="font-bold text-slate-900">Action Required ({openTasks.length})</h3>
      </div>

      <div className="space-y-3">
        {openTasks.map(task => (
          <div 
            key={task.id}
            className="bg-white border border-amber-200 rounded-lg p-4 flex items-start justify-between gap-4"
          >
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900 mb-1">{task.title}</h4>
              {task.description && (
                <p className="text-sm text-slate-600">{task.description}</p>
              )}
            </div>
            
            {onMarkDone && (
              <button
                onClick={() => onMarkDone(task.id)}
                className="flex-shrink-0 p-2 hover:bg-emerald-50 rounded-lg transition-colors group"
                title="Mark as done"
              >
                <CheckCircle className="w-5 h-5 text-slate-400 group-hover:text-emerald-600" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
