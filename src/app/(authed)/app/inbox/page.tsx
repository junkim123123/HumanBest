"use client";

export default function InboxPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Inbox</h1>
        <p className="mt-2 text-slate-600">
          Updates, questions, and communication with your team
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8 text-center">
        <p className="text-slate-500">No messages yet</p>
        <p className="mt-2 text-sm text-slate-400">
          Updates and messages will appear here
        </p>
      </div>
    </div>
  );
}

