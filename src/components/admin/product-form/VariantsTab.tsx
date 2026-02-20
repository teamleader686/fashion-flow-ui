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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
      {/* Sizes Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6 h-full">
        <div className="flex items-center gap-3 border-b pb-4">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <span className="text-lg font-bold">S</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Size Configuration</h3>
            <p className="text-sm text-muted-foreground">Manage available apparel sizes</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Quick Add */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Select</Label>
            <div className="flex flex-wrap gap-2">
              {commonSizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    if (sizes.includes(size)) removeSize(size);
                    else addSize(size);
                  }}
                  className={`
                        px-3 py-1.5 text-sm font-medium rounded-md transition-all border
                        ${sizes.includes(size)
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'}
                    `}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Input */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Add Custom Size</Label>
            <div className="flex gap-2">
              <Input
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSize(newSize)}
                placeholder="e.g. 32, XL+"
                className="h-10 border-gray-200"
              />
              <Button
                type="button"
                onClick={() => addSize(newSize)}
                disabled={!newSize.trim()}
                className="bg-gray-900 text-white hover:bg-gray-800"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Chip Display */}
          {sizes.length > 0 && (
            <div className="pt-4 border-t border-dashed">
              <p className="text-sm font-medium text-gray-700 mb-3">Active Sizes ({sizes.length})</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <div key={size} className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-gray-100 text-gray-800 rounded-full text-sm group border border-gray-200 hover:bg-white hover:border-red-200 transition-colors">
                    <span className="font-medium">{size}</span>
                    <button
                      type="button"
                      onClick={() => removeSize(size)}
                      className="p-0.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Colors Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6 h-full">
        <div className="flex items-center gap-3 border-b pb-4">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Color Configuration</h3>
            <p className="text-sm text-muted-foreground">Manage product color options</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Quick Add */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Select</Label>
            <div className="flex flex-wrap gap-2">
              {commonColors.map((color) => {
                const isSelected = colors.some(c => c.name === color.name);
                return (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => {
                      if (isSelected) removeColor(color.name);
                      else addColor(color);
                    }}
                    className={`
                                flex items-center gap-2 pl-2 pr-3 py-1.5 text-sm font-medium rounded-md transition-all border
                                ${isSelected
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50'}
                            `}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-black/10 shadow-sm"
                      style={{ backgroundColor: color.hex }}
                    />
                    {color.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom Input */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Custom Color</Label>
            <div className="flex gap-3">
              <div className="relative group">
                <Input
                  type="color"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  className="h-10 w-14 p-1 cursor-pointer border-gray-200"
                />
              </div>
              <Input
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                placeholder="Color Name (e.g. Teal)"
                className="flex-1 h-10 border-gray-200"
              />
              <Button
                type="button"
                onClick={() => addColor({ name: newColorName, hex: newColorHex })}
                disabled={!newColorName.trim()}
                className="bg-gray-900 text-white hover:bg-gray-800"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Chip Display */}
          {colors.length > 0 && (
            <div className="pt-4 border-t border-dashed">
              <p className="text-sm font-medium text-gray-700 mb-3">Active Colors ({colors.length})</p>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <div key={color.name} className="flex items-center gap-2 pl-2 pr-2 py-1.5 bg-gray-100 text-gray-800 rounded-full text-sm group border border-gray-200 hover:bg-white hover:border-red-200 transition-colors">
                    <span
                      className="w-4 h-4 rounded-full border border-white shadow-sm ring-1 ring-gray-200"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="font-medium pr-1">{color.name}</span>
                    <button
                      type="button"
                      onClick={() => removeColor(color.name)}
                      className="p-0.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VariantsTab;
