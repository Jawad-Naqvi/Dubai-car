"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { SearchAutocomplete } from "./search-autocomplete";

/**
 * Nav search — opens a type-ahead search with live make/model + listing
 * suggestions (SearchAutocomplete). Previously a bare link to /buy that did
 * nothing useful once you were already on the page.
 */
export function NavSearch() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Search cars"
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
          open
            ? "bg-[#141414] text-white border-[#141414]"
            : "border-[#141414]/15 text-[#141414] hover:bg-[#141414] hover:text-white"
        }`}
      >
        <Search className="h-3.5 w-3.5" />
      </button>

      {open && (
        <>
          {/* click-away */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-96 max-w-[calc(100vw-2rem)] rounded-xl bg-white border border-[#E5E5EA] shadow-card-hover p-2">
            <SearchAutocomplete autoFocus onNavigate={() => setOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}
