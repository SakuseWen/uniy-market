import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';
import { Language, translate } from '../lib/i18n';

interface SideFilterPanelProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  advancedFilters: {
    brand: string;
    courseCode: string;
    tryBeforeBuy: boolean;
    showPriceTrend: boolean;
  };
  onAdvancedFilterChange: (filters: any) => void;
}

export function SideFilterPanel({
  language,
  isOpen,
  onClose,
  advancedFilters,
  onAdvancedFilterChange,
}: SideFilterPanelProps) {
  const t = (key: any) => translate(language, key);

  const updateFilter = (key: string, value: any) => {
    onAdvancedFilterChange({ ...advancedFilters, [key]: value });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('advancedFilters')}</SheetTitle>
          <SheetDescription>
            Refine your search with additional filters
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Brand/Model */}
          <div className="space-y-2">
            <Label>{t('brandModel')}</Label>
            <Input
              placeholder="e.g., Apple, Dell, Sony..."
              value={advancedFilters.brand}
              onChange={(e) => updateFilter('brand', e.target.value)}
            />
          </div>

          {/* Course Code */}
          <div className="space-y-2">
            <Label>{t('courseCode')}</Label>
            <Input
              placeholder="e.g., CS301, MATH201..."
              value={advancedFilters.courseCode}
              onChange={(e) => updateFilter('courseCode', e.target.value)}
            />
          </div>

          {/* Try Before Buy */}
          <div className="flex items-center justify-between">
            <Label htmlFor="try-before-buy">{t('tryBeforeBuy')}</Label>
            <Switch
              id="try-before-buy"
              checked={advancedFilters.tryBeforeBuy}
              onCheckedChange={(checked) => updateFilter('tryBeforeBuy', checked)}
            />
          </div>

          {/* Show Price Trend */}
          <div className="flex items-center justify-between">
            <Label htmlFor="price-trend">{t('showPriceTrend')}</Label>
            <Switch
              id="price-trend"
              checked={advancedFilters.showPriceTrend}
              onCheckedChange={(checked) => updateFilter('showPriceTrend', checked)}
            />
          </div>

          {/* Apply/Reset Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                onAdvancedFilterChange({
                  brand: '',
                  courseCode: '',
                  tryBeforeBuy: false,
                  showPriceTrend: false,
                });
              }}
            >
              Reset
            </Button>
            <Button className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600" onClick={onClose}>
              Apply
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
