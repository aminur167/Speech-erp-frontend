import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/currency";
import type { Material } from "@/types/domain";

export function MaterialTable({
  materials,
  onAdjustStock,
  onEdit,
  onDelete,
}: {
  materials: Material[];
  onAdjustStock?: (material: Material) => void;
  onEdit?: (material: Material) => void;
  onDelete?: (material: Material) => void;
}) {
  const hasActions = Boolean(onAdjustStock || onEdit || onDelete);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <th className="py-2 pr-4 font-medium">Code</th>
            <th className="py-2 pr-4 font-medium">Name</th>
            <th className="py-2 pr-4 font-medium">Unit</th>
            <th className="py-2 pr-4 font-medium">Quantity</th>
            <th className="py-2 pr-4 font-medium">Unit Cost</th>
            <th className="py-2 pr-4 font-medium">Total Value</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            {hasActions && <th className="py-2 pr-4 font-medium">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {materials.map((material) => {
            const isLow = material.quantity <= material.reorderLevel;
            return (
              <tr key={material.id} className="border-b border-border last:border-0">
                <td className="py-2 pr-4 font-mono text-xs text-text-secondary">
                  {material.code}
                </td>
                <td className="py-2 pr-4 font-medium text-text-primary">{material.name}</td>
                <td className="py-2 pr-4 capitalize">{material.unit}</td>
                <td className="py-2 pr-4">{material.quantity}</td>
                <td className="py-2 pr-4">{formatCurrency(material.unitCost)}</td>
                <td className="py-2 pr-4 font-medium">
                  {formatCurrency(material.quantity * material.unitCost)}
                </td>
                <td className="py-2 pr-4">
                  <Badge tone={isLow ? "danger" : "success"} label={isLow ? "Low Stock" : "In Stock"} />
                </td>
                {hasActions && (
                  <td className="py-2 pr-4">
                    <div className="flex flex-wrap gap-2">
                      {onAdjustStock && (
                        <Button variant="secondary" onClick={() => onAdjustStock(material)}>
                          Adjust
                        </Button>
                      )}
                      {onEdit && (
                        <Button variant="secondary" onClick={() => onEdit(material)}>
                          Edit
                        </Button>
                      )}
                      {onDelete && (
                        <Button variant="danger" onClick={() => onDelete(material)}>
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
