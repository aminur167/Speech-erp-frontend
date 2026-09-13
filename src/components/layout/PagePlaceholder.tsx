import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/layout/PageHeader";

export function PagePlaceholder({
  title,
}: {
  title: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={title}
      />
      <Card>
        <EmptyState label="This screen is planned for a later development phase." />
      </Card>
    </div>
  );
}
