import { Suspense } from "react";
import { SearchView } from "@/components/search/SearchView";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-[#6B7280]">
          Loading search…
        </div>
      }
    >
      <SearchView />
    </Suspense>
  );
}
