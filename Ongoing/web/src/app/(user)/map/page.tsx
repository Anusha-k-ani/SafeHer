import { StreetMapView } from "@/components/map/StreetMapView";

export default function MapPage() {
  return (
    <div className="pb-16 md:pb-0">
      <div className="bg-[#0B1D33] px-4 py-4 text-sm text-white/80">
        Safety map. Grid cells are demonstration intelligence unless a verified operational row is present. Empty areas are not labelled safe. Precise private SOS coordinates are not published here.
      </div>
      <StreetMapView />
    </div>
  );
}
