import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Palette } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Color = {
  name: string;
  hex: string;
};

type VariantsTabProps = {
  sizes: string[];
  colors: Color[];
  onSizesChange: (sizes: string[]) => void;
  onColorsChange: (colors: Color[]) => void;
};

const VariantsTab = ({ sizes, colors, onSizesChange, onColorsChange }: VariantsTabProps) => {
  const [newSize, setNewSize] = useState('');
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');

  // Predefined common sizes
  const commonSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'];

  // Predefined common colors
  const commonColors = [
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Red', hex: '#FF0000' },
    { name: 'Blue', hex: '#0000FF' },
    { name: 'Green', hex: '#00FF00' },
    { name: 'Pink', hex: '#FFC0CB' },
    { name: 'Yellow', hex: '#FFFF00' },
    { name: 'Purple', hex: '#800080' },
  ];

  const addSize = (size: string) => {
    const trimmedSize = size.trim().toUpperCase();
    if (trimmedSize && !sizes.includes(trimmedSize)) {
      onSizesChange([...sizes, trimmedSize]);
      setNewSize('');
    }
  };

  const removeSize = (sizeToRemove: string) => {
    onSizesChange(sizes.filter(s => s !== sizeToRemove));
  };

  const addColor = (color: Color) => {
    if (color.name.trim() && !colors.some(c => c.name === color.name)) {
      onColorsChange([...colors, color]);
      setNewColorName('');
      setNewColorHex('#000000');
    }
  };

  const removeColor = (colorName: string) => {
    onColorsChange(colors.filter(c => c.name !== colorName));
  };

  return (
    <div className="space-y-6 py-4">
      {/* Sizes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Product Sizes</CardTitle>
          <CardDescription>
            Add available sizes for this product. Click quick-add buttons or enter custom sizes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Add Common Sizes */}
          <div>
            <Label className="text-sm text-gray-600 mb-2 block">Quick Add</Label>
            <div className="flex flex-wrap gap-2">
              {commonSizes.map((size) => (
                <Button
                  key={size}
                  type="button"
                  variant={sizes.includes(size) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (sizes.includes(size)) {
                      removeSize(size);
                    } else {
                      addSize(size);
                    }
                  }}
                  className="text-xs"
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Size Input */}
          <div>
            <Label htmlFor="custom-size" className="text-sm text-gray-600 mb-2 block">
              Add Custom Size
            </Label>
            <div className="flex gap-2">
              <Input
                id="custom-size"
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSize(newSize)}
                placeholder="e.g., 32, 34, 36"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={() => addSize(newSize)}
                disabled={!newSize.trim()}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Selected Sizes */}
          {sizes.length > 0 && (
            <div>
              <Label className="text-sm text-gray-600 mb-2 block">
                Selected Sizes ({sizes.length})
              </Label>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <Badge
                    key={size}
                    variant="secondary"
                    className="px-3 py-1.5 text-sm flex items-center gap-2"
                  >
                    {size}
                    <button
                      type="button"
                      onClick={() => removeSize(size)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Colors Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Product Colors</CardTitle>
          <CardDescription>
            Add available colors for this product. Choose from presets or create custom colors.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Add Common Colors */}
          <div>
            <Label className="text-sm text-gray-600 mb-2 block">Quick Add</Label>
            <div className="flex flex-wrap gap-2">
              {commonColors.map((color) => (
                <Button
                  key={color.name}
                  type="button"
                  variant={colors.some(c => c.name === color.name) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (colors.some(c => c.name === color.name)) {
                      removeColor(color.name);
                    } else {
                      addColor(color);
                    }
                  }}
                  className="text-xs flex items-center gap-2"
                >
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: color.hex }}
                  />
                  {color.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Color Input */}
          <div>
            <Label className="text-sm text-gray-600 mb-2 block">Add Custom Color</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                placeholder="Color name (e.g., Navy Blue)"
                className="flex-1"
              />
              <div className="flex gap-2">
                <div className="relative">
                  <Input
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Palette className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-gray-400" />
                </div>
                <Button
                  type="button"
                  onClick={() => addColor({ name: newColorName, hex: newColorHex })}
                  disabled={!newColorName.trim()}
                  size="icon"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Selected Colors */}
          {colors.length > 0 && (
            <div>
              <Label className="text-sm text-gray-600 mb-2 block">
                Selected Colors ({colors.length})
              </Label>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <Badge
                    key={color.name}
                    variant="secondary"
                    className="px-3 py-1.5 text-sm flex items-center gap-2"
                  >
                    <div
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: color.hex }}
                    />
                    {color.name}
                    <button
                      type="button"
                      onClick={() => removeColor(color.name)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <div className="text-blue-500 mt-0.5">ℹ️</div>
            <div className="text-sm text-blue-900 space-y-1">
              <p className="font-medium">How it works:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Sizes and colors will be displayed on product pages</li>
                <li>Customers can filter products by size and color</li>
                <li>Stock is managed at the product level (not per variant)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VariantsTab;
