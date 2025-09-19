import { NextRequest, NextResponse } from 'next/server';

interface CSVRow {
  [key: string]: string;
}

interface HeaderMapping {
  sku: string;
  caseBarcode: string;
  caseQuantity: string;
}

interface ProcessedProduct {
  sku: string;
  case_barcode: string;
  case_quantity: number;
  row_number: number;
}

export async function POST(request: NextRequest) {
  try {
    const { data, mapping, accountId } = await request.json() as {
      data: CSVRow[];
      mapping: HeaderMapping;
      accountId?: string;
    };

    if (!data || !mapping) {
      return NextResponse.json(
        { error: 'Missing required data or mapping' },
        { status: 400 }
      );
    }

    // Get access token from Authorization header
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token provided' },
        { status: 401 }
      );
    }

    // Process CSV data
    const processedProducts: ProcessedProduct[] = [];
    const errors: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const sku = row[mapping.sku]?.trim();
      const caseBarcode = row[mapping.caseBarcode]?.trim();
      const caseQuantityStr = row[mapping.caseQuantity]?.trim();

      if (!sku || !caseBarcode || !caseQuantityStr) {
        errors.push(`Row ${i + 2}: Missing required fields (SKU: ${sku || 'empty'}, Case Barcode: ${caseBarcode || 'empty'}, Case Quantity: ${caseQuantityStr || 'empty'})`);
        continue;
      }

      const caseQuantity = parseInt(caseQuantityStr, 10);
      if (isNaN(caseQuantity) || caseQuantity <= 0) {
        errors.push(`Row ${i + 2}: Invalid case quantity "${caseQuantityStr}" (must be a positive number)`);
        continue;
      }

      processedProducts.push({
        sku,
        case_barcode: caseBarcode,
        case_quantity: caseQuantity,
        row_number: i + 2, // +2 to account for header row and 0-based indexing
      });
    }

    if (processedProducts.length === 0) {
      return NextResponse.json(
        { error: 'No valid products to process' },
        { status: 400 }
      );
    }

    // Process products in batches
    const batchSize = 10; // Process 10 products at a time
    const batches = [];
    for (let i = 0; i < processedProducts.length; i += batchSize) {
      batches.push(processedProducts.slice(i, i + batchSize));
    }

    let successCount = 0;
    let errorCount = errors.length;

    // Process each batch
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      try {
        const batchResults = await processBatch(batch, accessToken, accountId);
        successCount += batchResults.successCount;
        errorCount += batchResults.errorCount;
        errors.push(...batchResults.errors);
        
        console.log(`Batch ${i + 1} results:`, {
          successCount: batchResults.successCount,
          errorCount: batchResults.errorCount,
          errors: batchResults.errors
        });
      } catch (error) {
        errorCount += batch.length;
        errors.push(`Batch error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      successCount,
      errorCount,
      totalProcessed: processedProducts.length,
      errors: errors.slice(0, 10), // Limit error messages
    });
  } catch (error) {
    console.error('CSV processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processBatch(products: ProcessedProduct[], accessToken: string, accountId?: string) {
  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  // ShipHero GraphQL endpoint
  const shipheroUrl = 'https://public-api.shiphero.com/graphql';

  // Process each product in the batch
  for (const product of products) {
    try {
      // First try to update existing product
      const updateMutation = `
        mutation product_update($data: UpdateProductInput!) {
          product_update(data: $data) {
            request_id
            complexity
            product {
              sku
              name
            }
          }
        }
      `;

      // Build the mutation data - no customer_account_id needed when using child account token
      const updateVariables = {
        data: {
          sku: product.sku,
          cases: [{
            case_barcode: product.case_barcode,
            case_quantity: product.case_quantity
          }]
        }
      };

      console.log(`Updating product ${product.sku} with:`, JSON.stringify(updateVariables, null, 2));

      const response = await fetch(shipheroUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          query: updateMutation,
          variables: updateVariables,
        }),
      });

      console.log(`Response status for ${product.sku}:`, response.status);
      console.log(`Response headers for ${product.sku}:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error response for ${product.sku}:`, errorText);
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`Full response for ${product.sku}:`, JSON.stringify(result, null, 2));

      if (result.errors) {
        console.error(`=== DETAILED GRAPHQL ERROR FOR ${product.sku} ===`);
        console.error(`Error details:`, JSON.stringify(result.errors, null, 2));
        console.error(`Error count:`, result.errors.length);
        console.error(`First error message:`, result.errors[0]?.message);
        console.error(`First error code:`, result.errors[0]?.code);
        console.error(`First error operation:`, result.errors[0]?.operation);
        console.error(`First error field:`, result.errors[0]?.field);
        console.error(`=== END ERROR DETAILS ===`);
        throw new Error(result.errors[0]?.message || 'GraphQL error');
      }

      successCount++;
      console.log(`Successfully updated product ${product.sku} (Row ${product.row_number})`);

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      errorCount++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error processing product ${product.sku}:`, errorMessage);
      errors.push(`Row ${product.row_number} (SKU: ${product.sku}): ${errorMessage}`);
    }
  }

  return {
    successCount,
    errorCount,
    errors,
  };
}
