import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/layout/PageHeader";

export function PagePlaceholder({
  homeHref,
  roleLabel,
  title,
  subtitle,
}: {
  homeHref: string;
  roleLabel: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref={homeHref}
        breadcrumb={[roleLabel, title]}
        title={title}
        subtitle={subtitle}
      />
      <Card>
        <EmptyState label="This screen is planned for a later development phase." />
      </Card>
    </div>
  );
}
