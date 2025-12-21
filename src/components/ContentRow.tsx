import { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContentRowProps {
  title: string;
  children: ReactNode;
  onViewAll?: () => void;
}

export const ContentRow = ({ title, children, onViewAll }: ContentRowProps) => {
  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4 px-6">
        <h2 className="font-display font-bold text-xl text-foreground">{title}</h2>
        {onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll} className="text-muted-foreground hover:text-primary">
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto px-6 pb-4 scrollbar-hide">
        {children}
      </div>
    </section>
  );
};
