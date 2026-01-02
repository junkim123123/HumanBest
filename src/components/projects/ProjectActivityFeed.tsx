// @ts-nocheck
"use client";

import { Card } from "@/components/ui/card";
import { CheckCircle2, FileText, User, Bell, MessageSquare } from "lucide-react";
import type { ProjectActivity, ActivityType } from "@/lib/types/project";
import { formatDistanceToNow } from "date-fns";

interface ProjectActivityFeedProps {
  activities: ProjectActivity[];
}

const ACTIVITY_ICONS: Record<ActivityType, typeof CheckCircle2> = {
  milestone: CheckCircle2,
  note: FileText,
  user_action: User,
  outreach: MessageSquare,
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  milestone: "text-green-600",
  note: "text-blue-600",
  user_action: "text-purple-600",
  outreach: "text-blue-600",
};

export function ProjectActivityFeed({ activities }: ProjectActivityFeedProps) {
  if (!activities || activities.length === 0) {
    return null;
  }

  // Show last 5 activities, newest first
  const recentActivities = activities
    .slice()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <Card className="p-6 bg-white border border-slate-200">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
      <div className="space-y-3">
        {recentActivities.map((activity) => {
          const Icon = ACTIVITY_ICONS[activity.type];
          const colorClass = ACTIVITY_COLORS[activity.type];
          
          return (
            <div key={activity.id} className="flex items-start gap-3 text-sm">
              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colorClass}`} />
              <div className="flex-1 min-w-0">
                <p className="text-slate-700">{activity.message}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

