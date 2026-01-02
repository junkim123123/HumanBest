// Prompt templates for Gemini inference

export const labelDraftPrompt = `Extract label fields. Return ONLY JSON with keys:
{
  "originCountryDraft": {"value": "string|null", "confidence": 0-1, "evidenceSnippet": "<=60 chars"},
  "netWeightDraft": {"value": "string|null", "confidence": 0-1, "evidenceSnippet": "<=60 chars"},
  "allergensDraft": {"value": ["string"]|null, "confidence": 0-1, "evidenceSnippet": "<=60 chars"},
  "brandDraft": {"value": "string|null", "confidence": 0-1, "evidenceSnippet": "<=60 chars"},
  "productNameDraft": {"value": "string|null", "confidence": 0-1, "evidenceSnippet": "<=60 chars"}
}
Rules:
- confidence 1 = clearly visible, 0.3-0.6 unclear, 0-0.2 not found
- evidenceSnippet must quote or summarize what you see on the label; use "Not visible" when absent.
`;

export const barcodeDraftPrompt = `Extract barcode digits. Return ONLY JSON:
{
  "digits": "string|null",
  "confidence": 0-1,
  "evidenceSnippet": "<=80 chars why/visibility"
}
- If unreadable, digits=null and confidence<=0.2.
`;

export const weightDraftPrompt = `Estimate unit weight. Return ONLY JSON:
{
  "value": number|null,
  "unit": "g"|"kg"|"ml"|"oz"|"lb",
  "confidence": 0-1,
  "evidenceSnippet": "<=80 chars reasoning"
}
Use label hints and visual cues; if unknown set value null and confidence 0.1-0.2 with rationale.
`;

export const casePackDraftPrompt = `Infer units per case. Return ONLY JSON:
{
  "candidates": [
    {"value": number, "confidence": 0-1, "evidenceSnippet": "<=80 chars"},
    {"value": number, "confidence": 0-1, "evidenceSnippet": "<=80 chars"}
  ],
  "selectedValue": number|null,
  "selectedConfidence": number|null
}
Prefer realistic carton counts (6, 8, 12, 24). If no box cues, propose 12 and 24 with low confidence and explain.
`;

export const customsCategoryPrompt = `Classify customs category and HS options. Return ONLY JSON:
{
  "customsCategoryDraft": {"value": "plain language category", "confidence": 0-1, "rationale": "<=120 chars", "source": "VISION|TEXT|REASONING"},
  "hsCandidatesDraft": [
    {"hsCode": "string", "confidence": 0-1, "rationale": "<=120 chars", "source": "VISION|TEXT|REASONING"}
  ]
}
Always return at least one HS candidate, even if low confidence.
`;
