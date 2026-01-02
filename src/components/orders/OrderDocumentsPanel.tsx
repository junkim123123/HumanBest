import { FileText, Download, Upload } from 'lucide-react';

interface OrderDocumentsPanelProps {
  documents: any[];
  onUpload?: (type: string, file: File) => Promise<void>;
}

const documentIcons: Record<string, any> = {
  quote: FileText,
  pi: FileText,
  qc_report: FileText,
  invoice: FileText,
  packing_list: FileText,
  bol: FileText,
  other: FileText,
};

const documentLabels: Record<string, string> = {
  quote: 'Quote',
  pi: 'Proforma Invoice',
  qc_report: 'QC Report',
  invoice: 'Invoice',
  packing_list: 'Packing List',
  bol: 'Bill of Lading',
  other: 'Attachment',
};

export default function OrderDocumentsPanel({ documents, onUpload }: OrderDocumentsPanelProps) {
  const groupedByType = (documents || []).reduce(
    (acc, doc) => {
      const type = doc?.type || 'other';
      if (!acc[type]) acc[type] = [];
      acc[type].push(doc);
      return acc;
    },
    {} as Record<string, any[]>
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8">
      <h2 className="text-xl font-bold text-slate-900 mb-6">Documents</h2>

      {documents.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 mb-1">No documents yet</p>
          <p className="text-sm text-slate-500">Documents will appear as milestones progress</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByType).map(([type, docs]) => {
            const docArray = docs as any[];
            return (
              <div key={type}>
                <h3 className="font-semibold text-slate-900 mb-3 text-sm uppercase tracking-wide text-slate-500">
                  {documentLabels[type] || type}
                </h3>
                <div className="space-y-2">
                  {docArray.map((doc: any) => {
                    const IconComponent = documentIcons[type] || FileText;
                    return (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <IconComponent className="w-5 h-5 text-slate-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-900 truncate">{doc.title}</p>
                            {doc.description && (
                              <p className="text-xs text-slate-500 truncate">{doc.description}</p>
                            )}
                            <p className="text-xs text-slate-500 mt-1">
                              Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {doc.file_url && (
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-3 flex-shrink-0 p-2 hover:bg-slate-200 rounded transition-colors"
                            title="Download"
                          >
                            <Download className="w-4 h-4 text-slate-600" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
