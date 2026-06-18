"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DateRangePickerProps {
  fromDate: string;
  toDate: string;
  onChange: (from: string, to: string) => void;
}

export function DateRangePicker({ fromDate, toDate, onChange }: DateRangePickerProps) {
  return (
    <div className="flex items-end gap-3">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">From</Label>
        <Input
          type="date"
          value={fromDate}
          onChange={(e) => onChange(e.target.value, toDate)}
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">To</Label>
        <Input
          type="date"
          value={toDate}
          onChange={(e) => onChange(fromDate, e.target.value)}
          className="h-8 text-xs"
        />
      </div>
    </div>
  );
}
