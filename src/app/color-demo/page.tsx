"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter, useSearchParams } from "next/navigation";

const COLOR_OPTIONS = [
  { name: "Default Blue", value: "3431c4", hex: "#3431c4" },
  { name: "Class Orange", value: "ec6825", hex: "#ec6825" },
  { name: "Smile Teal", value: "449197", hex: "#449197" },
  { name: "Red", value: "ff0000", hex: "#ff0000" },
  { name: "Green", value: "00ff00", hex: "#00ff00" },
  { name: "Purple", value: "8b5cf6", hex: "#8b5cf6" },
  { name: "Pink", value: "ec4899", hex: "#ec4899" },
  { name: "Yellow", value: "f59e0b", hex: "#f59e0b" },
];

export default function ColorDemoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentColor = searchParams.get("color") || "3431c4";

  const handleColorChange = (colorValue: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("color", colorValue);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Dynamic Color Demo
          </h1>
          <p className="text-lg text-muted-foreground">
            See how Tailwind&apos;s primary colors change based on the selected
            color
          </p>
        </div>

        {/* Color Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Choose a Color</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {COLOR_OPTIONS.map((color) => (
                <Button
                  key={color.value}
                  variant={currentColor === color.value ? "default" : "outline"}
                  onClick={() => handleColorChange(color.value)}
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  style={{
                    backgroundColor:
                      currentColor === color.value ? color.hex : undefined,
                    borderColor: color.hex,
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="text-xs font-medium">{color.name}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Color Demonstration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Primary Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Primary Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Badge variant="default" className="w-full justify-center">
                  Primary Button
                </Badge>
                <p className="text-sm text-muted-foreground">
                  This button uses <code>bg-primary</code> and{" "}
                  <code>text-primary-foreground</code>
                </p>
              </div>

              <div className="space-y-2">
                <Badge variant="secondary" className="w-full justify-center">
                  Secondary Badge
                </Badge>
                <p className="text-sm text-muted-foreground">
                  This badge uses <code>bg-secondary</code> and{" "}
                  <code>text-secondary-foreground</code>
                </p>
              </div>

              <div className="space-y-2">
                <Badge variant="outline" className="w-full justify-center">
                  Accent Badge
                </Badge>
                <p className="text-sm text-muted-foreground">
                  This badge uses <code>bg-accent</code> and{" "}
                  <code>text-accent-foreground</code>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Text Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Text Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-foreground font-medium">Foreground Text</p>
                <p className="text-sm text-muted-foreground">
                  Uses <code>text-foreground</code>
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-muted-foreground font-medium">Muted Text</p>
                <p className="text-sm text-muted-foreground">
                  Uses <code>text-muted-foreground</code>
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-primary font-medium">Primary Text</p>
                <p className="text-sm text-muted-foreground">
                  Uses <code>text-primary</code>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Color Info */}
        <Card>
          <CardHeader>
            <CardTitle>Current Color Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Selected Color</p>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-8 h-8 rounded border-2 border-border"
                    style={{ backgroundColor: `#${currentColor}` }}
                  />
                  <code className="text-sm">#{currentColor}</code>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">URL Parameter</p>
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  ?color={currentColor}
                </code>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">CSS Variables</p>
                <div className="text-xs space-y-1">
                  <div>--primary: hsl(var(--primary))</div>
                  <div>--accent: hsl(var(--accent))</div>
                  <div>--ring: hsl(var(--ring))</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">1. Color Selection</h4>
              <p className="text-sm text-muted-foreground">
                Click on any color above to change the theme. The URL will
                update with the <code>color</code> parameter.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">2. Dynamic CSS Variables</h4>
              <p className="text-sm text-muted-foreground">
                The <code>ColorProvider</code> component converts the hex color
                to HSL format and sets CSS custom properties like{" "}
                <code>--primary</code>, <code>--accent</code>, etc.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">3. Tailwind Integration</h4>
              <p className="text-sm text-muted-foreground">
                Tailwind CSS uses these CSS variables to generate utility
                classes like <code>bg-primary</code>, <code>text-primary</code>,
                etc.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
