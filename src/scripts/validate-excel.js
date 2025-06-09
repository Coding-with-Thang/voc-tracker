import xlsx from "xlsx";
import path from "path";

const REQUIRED_COLUMNS = ["CSAT", "comment", "date"];

function validateExcelFile(filePath) {
  try {
    console.log(`Validating Excel file: ${filePath}`);

    // Read the Excel file
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON for easier processing
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      throw new Error("Excel file is empty");
    }

    console.log(`Found ${data.length} rows of data`);

    // Check for required columns (case-insensitive)
    const headers = Object.keys(data[0]).map((h) => h.toLowerCase());
    console.log("Available columns:", Object.keys(data[0]));
    const missingColumns = REQUIRED_COLUMNS.filter(
      (col) => !headers.includes(col.toLowerCase())
    );

    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(", ")}`);
    }

    // Validate data types for each row
    let emptyComments = 0;
    let invalidDates = 0;
    let invalidCSATs = 0;

    data.forEach((row, index) => {
      // CSAT should be a number between 1 and 5
      const csat = parseFloat(row.CSAT);
      if (isNaN(csat) || csat < 1 || csat > 5) {
        invalidCSATs++;
        console.log(`Row ${index + 2}: Invalid CSAT value: ${row.CSAT}`);
      }

      // Track empty comments but don't fail validation
      if (
        !row.comment ||
        typeof row.comment !== "string" ||
        row.comment.trim() === ""
      ) {
        emptyComments++;
      }

      // Date should be a valid date
      const date = new Date(row.date);
      if (isNaN(date.getTime())) {
        invalidDates++;
        console.log(`Row ${index + 2}: Invalid date: ${row.date}`);
      }
    });

    console.log("\nValidation Summary:");
    console.log(`- Total rows: ${data.length}`);
    console.log(`- Empty comments: ${emptyComments}`);
    console.log(`- Invalid dates: ${invalidDates}`);
    console.log(`- Invalid CSAT values: ${invalidCSATs}`);

    if (invalidDates > 0 || invalidCSATs > 0) {
      throw new Error(
        `Validation failed with ${invalidDates} invalid dates and ${invalidCSATs} invalid CSAT values`
      );
    }

    console.log("\n✅ File validation successful!");
    return true;
  } catch (error) {
    console.error("❌ Validation failed:", error.message);
    return false;
  }
}

// Get the file path from command line arguments
const filePath = process.argv[2];

if (!filePath) {
  console.error("Please provide the Excel file path as an argument");
  process.exit(1);
}

// Run validation
validateExcelFile(filePath);
