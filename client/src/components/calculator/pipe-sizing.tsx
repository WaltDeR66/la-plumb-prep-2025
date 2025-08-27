import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calculator, Info } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CalculationResult {
  recommendedSize: string;
  velocityCheck: boolean;
  pressureLoss: number;
  explanation: string;
}

export default function PipeSizingCalculator() {
  const [fixtureUnits, setFixtureUnits] = useState("");
  const [pipeLength, setPipeLength] = useState("");
  const [material, setMaterial] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const materials = [
    { value: "copper_l", label: "Copper Type L" },
    { value: "copper_m", label: "Copper Type M" },
    { value: "pex", label: "PEX" },
    { value: "cpvc", label: "CPVC" },
    { value: "pvc", label: "PVC" },
  ];

  const handleCalculate = async () => {
    setError("");
    setResult(null);

    if (!fixtureUnits || !pipeLength || !material) {
      setError("Please fill in all required fields");
      return;
    }

    if (parseFloat(fixtureUnits) <= 0 || parseFloat(pipeLength) <= 0) {
      setError("Values must be greater than zero");
      return;
    }

    setIsCalculating(true);

    try {
      const response = await apiRequest("POST", "/api/calculator/pipe-size", {
        fixtureUnits: parseInt(fixtureUnits),
        pipeLength: parseInt(pipeLength),
        material: material,
      });

      const calculationResult = await response.json();
      setResult(calculationResult);

      toast({
        title: "Calculation Complete",
        description: `Recommended pipe size: ${calculationResult.recommendedSize}`,
      });
    } catch (error: any) {
      setError(error.message || "Calculation failed. Please try again.");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleReset = () => {
    setFixtureUnits("");
    setPipeLength("");
    setMaterial("");
    setResult(null);
    setError("");
  };

  return (
    <div className="space-y-6" data-testid="pipe-sizing-calculator">
      {/* Input Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="fixtureUnits">Fixture Units (WFU)</Label>
          <Input
            id="fixtureUnits"
            type="number"
            value={fixtureUnits}
            onChange={(e) => setFixtureUnits(e.target.value)}
            placeholder="Enter fixture units"
            min="1"
            data-testid="input-fixture-units"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Total water fixture units for the system
          </p>
        </div>

        <div>
          <Label htmlFor="pipeLength">Pipe Length (ft)</Label>
          <Input
            id="pipeLength"
            type="number"
            value={pipeLength}
            onChange={(e) => setPipeLength(e.target.value)}
            placeholder="Enter pipe length"
            min="1"
            data-testid="input-pipe-length"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Total developed length of pipe run
          </p>
        </div>

        <div>
          <Label htmlFor="material">Pipe Material</Label>
          <Select value={material} onValueChange={setMaterial}>
            <SelectTrigger data-testid="select-pipe-material">
              <SelectValue placeholder="Select material" />
            </SelectTrigger>
            <SelectContent>
              {materials.map((mat) => (
                <SelectItem key={mat.value} value={mat.value}>
                  {mat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Choose the pipe material type
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <Button 
          onClick={handleCalculate}
          disabled={isCalculating}
          className="flex-1"
          data-testid="button-calculate"
        >
          <Calculator className="w-4 h-4 mr-2" />
          {isCalculating ? "Calculating..." : "Calculate Pipe Size"}
        </Button>
        <Button 
          variant="outline" 
          onClick={handleReset}
          data-testid="button-reset"
        >
          Reset
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Alert data-testid="calculation-error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results Display */}
      {result && (
        <Card className="bg-muted/50" data-testid="calculation-results">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Calculation Results</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-background rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Recommended Size</p>
                  <p className="text-2xl font-bold text-primary" data-testid="result-pipe-size">
                    {result.recommendedSize}
                  </p>
                </div>

                <div className="text-center p-4 bg-background rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Velocity Check</p>
                  <p className={`text-lg font-semibold ${result.velocityCheck ? 'text-green-600' : 'text-red-600'}`} data-testid="result-velocity-check">
                    {result.velocityCheck ? "✓ Pass" : "✗ Fail"}
                  </p>
                </div>

                <div className="text-center p-4 bg-background rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Pressure Loss</p>
                  <p className="text-lg font-semibold" data-testid="result-pressure-loss">
                    {result.pressureLoss} PSI
                  </p>
                </div>
              </div>

              {result.explanation && (
                <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                  <div className="flex items-start space-x-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Explanation</p>
                      <p className="text-sm text-blue-700 mt-1" data-testid="result-explanation">
                        {result.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reference Information */}
      <Card className="bg-blue-50" data-testid="reference-info">
        <CardContent className="p-4">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">Reference Information</p>
              <ul className="text-xs text-blue-700 mt-1 space-y-1">
                <li>• Calculations based on Louisiana Plumbing Code requirements</li>
                <li>• Maximum water velocity should not exceed 8 ft/s for noise control</li>
                <li>• Pressure loss calculations include friction losses through fittings</li>
                <li>• Results are for sizing guidance only - verify with local code requirements</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
