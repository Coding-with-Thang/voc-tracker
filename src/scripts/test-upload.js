import { read, utils } from "xlsx";
import * as fs from "fs/promises";
import path from "path";

async function validateExcelFile(filePath) {
  try {
    console.log("Reading file:", filePath);
    const buffer = await fs.readFile(filePath);

    // Try to read the workbook
    console.log("Parsing Excel file...");
    const workbook = read(buffer);

    if (!workbook.SheetNames.length) {
      throw new Error("Excel file has no sheets");
    }

    console.log("Sheets found:", workbook.SheetNames);

    // Read the first sheet
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = utils.sheet_to_json(worksheet);

    if (!data.length) {
      throw new Error("No data found in the first sheet");
    }

    console.log("\nTotal rows found:", data.length);
    console.log("First row sample:", JSON.stringify(data[0], null, 2));

    // Validate required fields
    console.log("\nValidating data structure...");
    const invalidRows = [];
    data.forEach((row, index) => {
      const rowNum = index + 2; // Add 2 for 1-based index and header row
      const issues = [];

      // Check required fields
      if (!row.voiceName) issues.push("Missing voiceName");
      if (!row.AHT) issues.push("Missing AHT");
      if (row.CSAT === undefined) issues.push("Missing CSAT");
      if (!row.date) issues.push("Missing date");

      // Validate CSAT if present
      if (row.CSAT !== undefined) {
        const csatValue = parseFloat(row.CSAT);
        if (isNaN(csatValue) || csatValue < 1 || csatValue > 5) {
          issues.push(
            `Invalid CSAT value: ${row.CSAT} (must be between 1 and 5)`
          );
        }
      }

      // Validate date if present
      if (row.date) {
        const dateValue = new Date(row.date);
        if (isNaN(dateValue.getTime())) {
          issues.push(`Invalid date format: ${row.date}`);
        }
      }

      if (issues.length > 0) {
        invalidRows.push({
          row: rowNum,
          issues,
          data: row,
        });
      }
    });

    if (invalidRows.length > 0) {
      console.log("\nFound", invalidRows.length, "rows with issues:");
      invalidRows.forEach(({ row, issues, data }) => {
        console.log(`\nRow ${row}:`);
        console.log("Issues:", issues.join(", "));
        console.log("Data:", data);
      });
    } else {
      console.log("\nAll rows are valid!");
    }

    // Show data structure statistics
    console.log("\nData structure analysis:");
    const fields = new Set();
    data.forEach((row) => Object.keys(row).forEach((key) => fields.add(key)));

    console.log("Fields found:", Array.from(fields));

    // Show value ranges for numeric fields
    const stats = {
      CSAT: { min: Infinity, max: -Infinity },
      dates: { min: null, max: null },
    };

    data.forEach((row) => {
      if (row.CSAT !== undefined) {
        const csat = parseFloat(row.CSAT);
        if (!isNaN(csat)) {
          stats.CSAT.min = Math.min(stats.CSAT.min, csat);
          stats.CSAT.max = Math.max(stats.CSAT.max, csat);
        }
      }
      if (row.date) {
        const date = new Date(row.date);
        if (!isNaN(date.getTime())) {
          if (!stats.dates.min || date < stats.dates.min)
            stats.dates.min = date;
          if (!stats.dates.max || date > stats.dates.max)
            stats.dates.max = date;
        }
      }
    });

    console.log("\nValue ranges:");
    console.log("CSAT:", stats.CSAT);
    console.log("Dates:", {
      min: stats.dates.min?.toISOString(),
      max: stats.dates.max?.toISOString(),
    });
  } catch (error) {
    console.error("Validation failed:", error);
    throw error;
  }
}

// Check if file path is provided
const filePath = process.argv[2];
if (!filePath) {
  console.error("Please provide the path to the Excel file as an argument");
  process.exit(1);
}

validateExcelFile(filePath).catch((error) => {
  console.error("Validation failed:", error);
  process.exit(1);
});
