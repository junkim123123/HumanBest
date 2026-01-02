// @ts-nocheck
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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

interface PlaceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: {
    id: string;
    label: string;
    fobMin: number;
    fobMax: number;
    moq: number;
    leadTimeDays: number;
  };
  reportId: string;
}

export function PlaceOrderModal({ isOpen, onClose, supplier, reportId }: PlaceOrderModalProps) {
  const [targetQuantity, setTargetQuantity] = useState("");
  const [colorOrVariant, setColorOrVariant] = useState("");
  const [packagingChoice, setPackagingChoice] = useState("");
  const [deliveryDestination, setDeliveryDestination] = useState("");
  const [deadline, setDeadline] = useState("");

  const handleSubmit = () => {
    // TODO: Implement order submission
    console.log("Place order:", {
      supplierId: supplier.id,
      reportId,
      targetQuantity,
      colorOrVariant,
      packagingChoice,
      deliveryDestination,
      deadline,
    });
    onClose();
  };

  const isFormValid =
    targetQuantity &&
    colorOrVariant &&
    packagingChoice &&
    deliveryDestination &&
    deadline;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Place order with {supplier.label}</DialogTitle>
          <DialogDescription>
            Confirm your order details. Execution fee applies only if you place an order.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Target quantity */}
          <div>
            <Label htmlFor="targetQuantity" className="text-sm font-semibold text-slate-900">
              Target quantity <span className="text-red-500">*</span>
            </Label>
            <Input
              id="targetQuantity"
              type="number"
              value={targetQuantity}
              onChange={(e) => setTargetQuantity(e.target.value)}
              placeholder={`Minimum: ${supplier.moq.toLocaleString()} units`}
              className="mt-2 h-11"
              min={supplier.moq}
            />
            <p className="text-xs text-slate-500 mt-1">
              MOQ: {supplier.moq.toLocaleString()} units
            </p>
          </div>

          {/* Color or variant */}
          <div>
            <Label htmlFor="colorOrVariant" className="text-sm font-semibold text-slate-900">
              Color or variant <span className="text-red-500">*</span>
            </Label>
            <Input
              id="colorOrVariant"
              value={colorOrVariant}
              onChange={(e) => setColorOrVariant(e.target.value)}
              placeholder="e.g., Red, Blue, Size M"
              className="mt-2 h-11"
            />
          </div>

          {/* Packaging choice */}
          <div>
            <Label htmlFor="packagingChoice" className="text-sm font-semibold text-slate-900">
              Packaging choice <span className="text-red-500">*</span>
            </Label>
            <Select value={packagingChoice} onValueChange={setPackagingChoice}>
              <SelectTrigger className="mt-2 h-11">
                <SelectValue placeholder="Select packaging" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard export carton</SelectItem>
                <SelectItem value="custom">Custom packaging</SelectItem>
                <SelectItem value="retail">Retail-ready packaging</SelectItem>
                <SelectItem value="bulk">Bulk packaging</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Delivery destination */}
          <div>
            <Label htmlFor="deliveryDestination" className="text-sm font-semibold text-slate-900">
              Delivery destination <span className="text-red-500">*</span>
            </Label>
            <Input
              id="deliveryDestination"
              value={deliveryDestination}
              onChange={(e) => setDeliveryDestination(e.target.value)}
              placeholder="e.g., Los Angeles, CA, USA"
              className="mt-2 h-11"
            />
          </div>

          {/* Deadline */}
          <div>
            <Label htmlFor="deadline" className="text-sm font-semibold text-slate-900">
              Deadline <span className="text-red-500">*</span>
            </Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="mt-2 h-11"
            />
            <p className="text-xs text-slate-500 mt-1">
              Estimated lead time: {supplier.leadTimeDays || 30} days
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid}
            className="w-full h-12 bg-electric-blue-600 hover:bg-electric-blue-700 text-white"
          >
            Confirm and start execution
          </Button>
          <p className="text-xs text-slate-500 text-center">
            Execution fee applies only if you place an order.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

