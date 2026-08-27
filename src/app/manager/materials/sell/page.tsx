import { Suspense } from "react";
import { SellMaterialsView } from "@/components/materials/SellMaterialsView";

export default function SellMaterialsPage() {
  return (
    <Suspense>
      <SellMaterialsView />
    </Suspense>
  );
}
