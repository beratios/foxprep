"use client";

import { useState } from "react";

export function CopyButton({ text, label = "Copy address" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="rounded-[3px] border-2 border-black px-2 py-1 text-[12px] font-bold hover:bg-black hover:text-white"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1800);
      }}
    >
      {done ? "Copied" : label}
    </button>
  );
}
