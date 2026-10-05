"use client";

import { Printer } from 'lucide-react';

export function PrintButton() {
  return (
    <button className="btn btn-outline" onClick={() => window.print()}>
      <Printer size={16} /> Stampa Report
    </button>
  );
}
