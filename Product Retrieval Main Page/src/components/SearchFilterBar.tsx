import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Language, translate } from '../lib/i18n';
import { Slider } from './ui/slider';

interface SearchFilterBarProps {
  language: Language;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: {
    campus: string;
    category: string;
    priceMin: number;
    priceMax: number;
    condition: string;
    deliveryType: string;
    itemLanguage: string;
    availableOnly: boolean;
  };
  onFilterChange: (filters: any) => void;
  onShowAdvancedFilters: () => void;
}

export function SearchFilterBar({
  language,
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
  onShowAdvancedFilters,
}: SearchFilterBarProps) {
  const t = (key: any) => translate(language, key);

  const updateFilter = (key: string, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="sticky top-[73px] z-40 bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 py-4">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 py-6"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Campus */}
          <Select value={filters.campus} onValueChange={(value) => updateFilter('campus', value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t('campus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('campus')}</SelectItem>
              <SelectItem value="mainCampus">{t('mainCampus')}</SelectItem>
              <SelectItem value="secondaryCampus">{t('secondaryCampus')}</SelectItem>
              <SelectItem value="offCampus">{t('offCampus')}</SelectItem>
            </SelectContent>
          </Select>

          {/* Category */}
          <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('category')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('category')}</SelectItem>
              <SelectItem value="books">{t('books')}</SelectItem>
              <SelectItem value="electronics">{t('electronics')}</SelectItem>
              <SelectItem value="dormFurniture">{t('dormFurniture')}</SelectItem>
              <SelectItem value="sports">{t('sports')}</SelectItem>
              <SelectItem value="clothing">{t('clothing')}</SelectItem>
              <SelectItem value="tickets">{t('tickets')}</SelectItem>
              <SelectItem value="others">{t('others')}</SelectItem>
            </SelectContent>
          </Select>

          {/* Condition */}
          <Select value={filters.condition} onValueChange={(value) => updateFilter('condition', value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t('condition')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('condition')}</SelectItem>
              <SelectItem value="new">{t('new')}</SelectItem>
              <SelectItem value="ninetyNew">{t('ninetyNew')}</SelectItem>
              <SelectItem value="eightyNew">{t('eightyNew')}</SelectItem>
              <SelectItem value="repairable">{t('repairable')}</SelectItem>
            </SelectContent>
          </Select>

          {/* Delivery Type */}
          <Select value={filters.deliveryType} onValueChange={(value) => updateFilter('deliveryType', value)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t('deliveryType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('deliveryType')}</SelectItem>
              <SelectItem value="faceToFace">{t('faceToFace')}</SelectItem>
              <SelectItem value="campusLocker">{t('campusLocker')}</SelectItem>
              <SelectItem value="courier">{t('courier')}</SelectItem>
            </SelectContent>
          </Select>

          {/* Price Range */}
          <div className="flex items-center gap-2 px-3 py-2 border rounded-md">
            <Input
              type="number"
              placeholder={t('min')}
              value={filters.priceMin || ''}
              onChange={(e) => updateFilter('priceMin', Number(e.target.value))}
              className="w-20 h-8 px-2 py-1"
            />
            <span>-</span>
            <Input
              type="number"
              placeholder={t('max')}
              value={filters.priceMax || ''}
              onChange={(e) => updateFilter('priceMax', Number(e.target.value))}
              className="w-20 h-8 px-2 py-1"
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-2 px-3 py-2 border rounded-md">
            <Switch
              checked={filters.availableOnly}
              onCheckedChange={(checked) => updateFilter('availableOnly', checked)}
              id="available-only"
            />
            <Label htmlFor="available-only" className="cursor-pointer text-sm">
              {t('availableOnly')}
            </Label>
          </div>

          {/* Advanced Filters Button */}
          <Button variant="outline" onClick={onShowAdvancedFilters} className="gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            {t('advancedFilters')}
          </Button>
        </div>

        {/* Active Filters Display */}
        {(filters.campus !== 'all' || filters.category !== 'all' || filters.condition !== 'all') && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {filters.campus !== 'all' && (
              <Badge variant="secondary" className="gap-2">
                {t(filters.campus as any)}
                <button onClick={() => updateFilter('campus', 'all')} className="hover:bg-gray-300 rounded-full px-1">
                  ×
                </button>
              </Badge>
            )}
            {filters.category !== 'all' && (
              <Badge variant="secondary" className="gap-2">
                {t(filters.category as any)}
                <button onClick={() => updateFilter('category', 'all')} className="hover:bg-gray-300 rounded-full px-1">
                  ×
                </button>
              </Badge>
            )}
            {filters.condition !== 'all' && (
              <Badge variant="secondary" className="gap-2">
                {t(filters.condition as any)}
                <button onClick={() => updateFilter('condition', 'all')} className="hover:bg-gray-300 rounded-full px-1">
                  ×
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
