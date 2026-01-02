// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { SupplierQuote } from "@/lib/report/types";
import { buildSamplePlanRequestMessage } from "@/lib/messaging/templates";
import { openWhatsAppDraftForTemplate, normalizePhone } from "@/lib/messaging/whatsapp";
import { buildMailtoUrlForTemplate, buildEmailSubject, buildEmailBody } from "@/lib/messaging/email";
import { DEFAULT_REQUESTER_EMAIL, DEFAULT_REQUESTER_WHATSAPP_RAW } from "@/lib/constants/contact";
import { US_STATES } from "@/lib/constants/usStates";
import { getSamplePlanPrefs, setSamplePlanPrefs, type SamplePlanPrefs } from "@/lib/storage/samplePlanPrefs";
import { findLatestProjectByReportId, appendProjectActivity, updateProjectMilestonesForOutreach } from "@/lib/storage/projects";

interface SamplePlanQuickModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: SupplierQuote;
  productName: string;
  reportId?: string;
  category?: string;
  targetMoq?: number;
  incoterms?: string;
  shippingMode?: string;
  materialsAndDimensions?: string | null;
  packagingAndPrinting?: string | null;
  certificationsNeeded?: string[] | null;
  upc?: string | null;
  hasBackLabelPhoto?: boolean;
}

export function SamplePlanQuickModal({
  isOpen,
  onClose,
  quote,
  productName,
  reportId,
  category,
  targetMoq,
  incoterms = "FOB",
  shippingMode,
  materialsAndDimensions,
  packagingAndPrinting,
  certificationsNeeded,
  upc,
  hasBackLabelPhoto,
}: SamplePlanQuickModalProps) {
  const [sampleQty, setSampleQty] = useState(3);
  const [deadlineDays, setDeadlineDays] = useState("7");
  const [stateCode, setStateCode] = useState("MO");
  const [city, setCity] = useState("St. Louis");
  const [sendVia, setSendVia] = useState<"whatsapp" | "email">("whatsapp");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [includePackaging, setIncludePackaging] = useState(true);
  const [includeCerts, setIncludeCerts] = useState(true);
  const [includeUpcAndLabel, setIncludeUpcAndLabel] = useState(true);
  const [noteToSupplier, setNoteToSupplier] = useState("");

  // Load preferences on modal open
  useEffect(() => {
    if (isOpen) {
      const prefs = getSamplePlanPrefs();
      setSampleQty(prefs.sampleQty);
      setDeadlineDays(prefs.deadlineDays.toString());
      setStateCode(prefs.stateCode);
      setCity(prefs.city || "");
      setSendVia(prefs.sendVia);
      setIncludePackaging(prefs.includePackaging);
      setIncludeCerts(prefs.includeCerts);
      setIncludeUpcAndLabel(prefs.includeUpcAndLabel);
      setNoteToSupplier(prefs.noteToSupplier || "");
    }
  }, [isOpen]);

  // Format destination string
  const formatDestination = (state: string, cityValue: string | null): string => {
    if (cityValue && cityValue.trim()) {
      return `USA, ${state}, ${cityValue.trim()}`;
    }
    return `USA, ${state}`;
  };

  const handlePreset = (presetState: string, presetCity: string) => {
    setStateCode(presetState);
    setCity(presetCity);
  };

  const savePrefs = () => {
    const prefs: SamplePlanPrefs = {
      stateCode,
      city: city.trim() || null,
      deadlineDays: parseInt(deadlineDays, 10),
      sampleQty,
      sendVia,
      includePackaging,
      includeCerts,
      includeUpcAndLabel,
      noteToSupplier: noteToSupplier.trim() || null,
    };
    setSamplePlanPrefs(prefs);
  };

  const generateMessage = () => {
    const destination = formatDestination(stateCode, city);
    return buildSamplePlanRequestMessage({
      productName,
      category,
      targetMoq: targetMoq || quote.moq,
      incoterms: incoterms as "FOB",
      shippingMode,
      materialsAndDimensions: includeUpcAndLabel ? materialsAndDimensions : null,
      packagingAndPrinting: includePackaging ? packagingAndPrinting : null,
      certificationsNeeded: includeCerts ? certificationsNeeded : null,
      upc: includeUpcAndLabel ? upc : null,
      hasBackLabelPhoto: includeUpcAndLabel ? hasBackLabelPhoto : undefined,
      requestedSampleQty: sampleQty,
      sampleDeadlineDays: parseInt(deadlineDays, 10),
      destination,
      supplierType: quote.supplierType,
      supplierContactName: quote.supplierContactName || null,
      includePackaging,
      includeCerts,
      includeUpcAndLabel,
      noteToSupplier: noteToSupplier.trim() || undefined,
    });
  };

  const logActivity = (channel: "whatsapp" | "email" | "copy", action: "sample_plan" | "quote_request" = "sample_plan") => {
    if (!reportId) {
      return; // Fail silently if no reportId
    }

    const project = findLatestProjectByReportId(reportId);
    if (!project) {
      return; // Fail silently if no project found
    }

    const channelLabel = channel === "whatsapp" ? "WhatsApp" : channel === "email" ? "Email" : "message";
    const actionLabel = action === "sample_plan" ? "Sample plan" : "Quote request";
    const message = channel === "copy"
      ? `${actionLabel} message copied for ${quote.supplierName}`
      : `${actionLabel} draft opened for ${quote.supplierName} via ${channelLabel}`;

    appendProjectActivity(project.id, {
      type: "user_action",
      message,
      meta: {
        supplierId: quote.id,
        supplierName: quote.supplierName,
        channel: channel === "copy" ? null : channel,
        action,
      },
    });

    // Optionally advance milestone if this is the first outreach
    if (channel !== "copy" && action === "sample_plan") {
      updateProjectMilestonesForOutreach(project.id);
    }
  };

  const handleOpenDraft = () => {
    // Validate state is selected
    if (!stateCode) {
      toast.error("Please select a state");
      return;
    }

    try {
      const message = generateMessage();
      savePrefs();

      const channel = sendVia === "whatsapp" ? "whatsapp" : "email";

      if (sendVia === "whatsapp") {
        const supplierPhone = quote.supplierWhatsApp
          ? normalizePhone(quote.supplierWhatsApp)
          : null;

        openWhatsAppDraftForTemplate({
          supplierPhoneDigits: supplierPhone,
          requesterPhoneDigits: DEFAULT_REQUESTER_WHATSAPP_RAW,
          message,
        });
      } else {
        const subject = buildEmailSubject(`${productName} - Sample Plan Request`);
        const body = buildEmailBody(message);

        const url = buildMailtoUrlForTemplate({
          supplierEmail: quote.supplierEmail,
          requesterEmail: DEFAULT_REQUESTER_EMAIL,
          subject,
          body,
        });

        window.location.href = url;
      }

      // Log activity
      logActivity(channel, "sample_plan");

      onClose();
    } catch (error) {
      toast.error("Failed to open draft");
      console.error("Error:", error);
    }
  };

  const handleCopyMessage = () => {
    if (!stateCode) {
      toast.error("Please select a state");
      return;
    }

    const message = generateMessage();
    savePrefs();
    
    // Log activity
    logActivity("copy", "sample_plan");
    
    navigator.clipboard.writeText(message).then(() => {
      toast.success("Copied to clipboard");
    }).catch(() => {
      toast.error("Failed to copy message");
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto sm:max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Sample Plan Quick Check</DialogTitle>
          <DialogDescription>
            Review and adjust sample request details before sending.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Sample Quantity */}
          <div>
            <Label htmlFor="sampleQty">Sample Quantity</Label>
            <Input
              id="sampleQty"
              type="number"
              min={1}
              max={20}
              value={sampleQty}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= 20) {
                  setSampleQty(val);
                }
              }}
            />
          </div>

          {/* Deadline */}
          <div>
            <Label htmlFor="deadlineDays">Deadline</Label>
            <Select value={deadlineDays} onValueChange={setDeadlineDays}>
              <SelectTrigger id="deadlineDays">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 days</SelectItem>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Destination */}
          <div>
            <Label>Destination</Label>
            <div className="mt-2 space-y-3">
              {/* Country pill */}
              <div>
                <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-300">
                  USA
                </Badge>
              </div>

              {/* Presets */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreset("MO", "St. Louis")}
                  className="text-xs h-7"
                >
                  St. Louis, MO
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreset("IL", "Chicago")}
                  className="text-xs h-7"
                >
                  Chicago, IL
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreset("NY", "New York")}
                  className="text-xs h-7"
                >
                  New York, NY
                </Button>
              </div>

              {/* State and City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="stateCode">State *</Label>
                  <Select value={stateCode} onValueChange={setStateCode}>
                    <SelectTrigger id="stateCode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((state) => (
                        <SelectItem key={state.code} value={state.code}>
                          {state.name} ({state.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="St. Louis"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Send Via */}
          <div>
            <Label>Send Via</Label>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setSendVia("whatsapp")}
                className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  sendVia === "whatsapp"
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
              >
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setSendVia("email")}
                className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  sendVia === "email"
                    ? "bg-electric-blue-600 text-white border-electric-blue-600"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
              >
                Email
              </button>
            </div>
          </div>

          {/* Advanced Section */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              <span>Advanced Options</span>
              {showAdvanced ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3 pt-3 border-t border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includePackaging}
                    onChange={(e) => setIncludePackaging(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-slate-700">Include packaging/printing</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCerts}
                    onChange={(e) => setIncludeCerts(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-slate-700">Include certifications</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeUpcAndLabel}
                    onChange={(e) => setIncludeUpcAndLabel(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-slate-700">Include UPC and label photo</span>
                </label>

                <div>
                  <Label htmlFor="noteToSupplier">Note to Supplier (optional)</Label>
                  <textarea
                    id="noteToSupplier"
                    value={noteToSupplier}
                    onChange={(e) => {
                      if (e.target.value.length <= 240) {
                        setNoteToSupplier(e.target.value);
                      }
                    }}
                    maxLength={240}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-electric-blue-500 focus:border-electric-blue-500"
                    placeholder="Add any additional notes..."
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {noteToSupplier.length}/240 characters
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onClose();
            }}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleCopyMessage}
            className="w-full sm:w-auto"
          >
            Copy message
          </Button>
          <Button
            onClick={handleOpenDraft}
            className="w-full sm:w-auto bg-electric-blue-600 hover:bg-electric-blue-700"
          >
            Open draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

