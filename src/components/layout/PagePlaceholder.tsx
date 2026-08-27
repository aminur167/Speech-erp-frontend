import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/states";

export function PagePlaceholder({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
      <Card>
        <EmptyState label="This screen is planned for a later development phase." />
      </Card>
    </div>
  );
}
