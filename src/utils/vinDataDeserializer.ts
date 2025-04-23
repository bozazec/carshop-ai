interface NhtsaVinResult {
    ABS: string;
    AdaptiveCruiseControl: string;
    // Add other raw fields if needed, but we primarily care about the ones below
    Make: string;
    MakeID: string;
    Manufacturer: string;
    ManufacturerId: string;
    Model: string;
    ModelID: string;
    ModelYear: string;
    VehicleType: string;
    BodyClass: string; // Often useful
    DriveType: string;
    EngineCylinders: string;
    DisplacementL: string;
    EngineHP: string;
    FuelTypePrimary: string;
    Doors: string;
    Seats: string;
    VIN: string;
    ErrorCode: string;
    ErrorText: string;
    // ... potentially many other fields
    [key: string]: any; // Allow other fields
  }
  
  interface NhtsaApiResponse {
    Count: number;
    Message: string;
    SearchCriteria: string;
    Results: NhtsaVinResult[];
  }
  
  interface MainVehicleData {
    vin: string | null;
    make: string | null;
    manufacturer: string | null;
    model: string | null;
    modelYear: string | null; // Keep as string, might not always be a valid number
    vehicleType: string | null;
    bodyClass: string | null;
    driveType: string | null;
    engineCylinders: number | null;
    engineDisplacementL: number | null;
    engineHP: number | null;
    fuelType: string | null;
    doors: number | null;
    errorCode: string | null; // Keep error info
    errorText: string | null; // Keep error info
  }
  
  /**
   * Deserializes the NHTSA VIN API response to extract main vehicle data.
   * Handles multiple results if present, though typically there's only one.
   * Converts empty strings "" to null for easier handling.
   * Attempts to parse numeric fields.
   *
   * @param apiResponse The parsed JSON object from the VIN API.
   * @returns An array of MainVehicleData objects, or an empty array if no results.
   */
  export function deserializeVinData(apiResponse: NhtsaApiResponse): MainVehicleData[] {
    if (!apiResponse || !apiResponse.Results || apiResponse.Count === 0) {
      console.warn('No results found in the API response.');
      return [];
    }
  
    return apiResponse.Results.map((result) => {
      // Helper to convert empty string to null, otherwise return the value
      const getValueOrNull = (value: string | undefined | null): string | null => {
        return value === '' || value === undefined || value === null ? null : value;
      };
  
      // Helper to parse number, returning null if invalid or empty
      const getNumberOrNull = (value: string | undefined | null): number | null => {
          const strValue = getValueOrNull(value);
          if (strValue === null) return null;
          const num = Number(strValue);
          return isNaN(num) ? null : num;
      };
  
      return {
        vin: getValueOrNull(result.VIN),
        make: getValueOrNull(result.Make),
        manufacturer: getValueOrNull(result.Manufacturer),
        model: getValueOrNull(result.Model),
        modelYear: getValueOrNull(result.ModelYear),
        vehicleType: getValueOrNull(result.VehicleType),
        bodyClass: getValueOrNull(result.BodyClass),
        driveType: getValueOrNull(result.DriveType),
        engineCylinders: getNumberOrNull(result.EngineCylinders),
        engineDisplacementL: getNumberOrNull(result.DisplacementL),
        engineHP: getNumberOrNull(result.EngineHP),
        fuelType: getValueOrNull(result.FuelTypePrimary),
        doors: getNumberOrNull(result.Doors),
        errorCode: getValueOrNull(result.ErrorCode),
        errorText: getValueOrNull(result.ErrorText),
      };
    });
  }