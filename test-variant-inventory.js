/**
 * Test script for variant inventory API
 * Run with: node test-variant-inventory.js
 * 
 * This simulates testing the variant inventory endpoint
 * Replace the URL with your actual deployment URL
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function testVariantInventory() {
  console.log('🧪 Testing Variant Inventory API\n');
  
  const productId = 'ljcfilg-001';
  const variants = [
    { key: 'XS', stripePriceId: 'price_1SX5xtP6vvUUervC7sVlRnoi' },
    { key: 'S', stripePriceId: 'price_1SX5yeP6vvUUervC41kmP3Oo' },
    { key: 'M', stripePriceId: 'price_1SX5z2P6vvUUervCn7DBjW4V' },
    { key: 'L', stripePriceId: 'price_1SX5zJP6vvUUervCvIIk1R0u' },
    { key: 'XL', stripePriceId: 'price_1SX5zUP6vvUUervCyLcMME9z' },
  ];

  console.log(`Testing product: ${productId}\n`);

  for (const variant of variants) {
    const url = `${API_URL}/api/inventory/status?productId=${encodeURIComponent(productId)}&stripePriceId=${encodeURIComponent(variant.stripePriceId)}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      console.log(`📦 Variant ${variant.key} (${variant.stripePriceId}):`);
      console.log(`   Stock: ${data.stock ?? 'null (assuming in stock)'}`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Out of Stock: ${data.outOfStock}`);
      console.log(`   Has Data: ${data.hasData}`);
      console.log(`   Source: ${data.source}`);
      console.log('');
    } catch (error) {
      console.error(`❌ Error testing variant ${variant.key}:`, error.message);
    }
  }
}

// Run test
testVariantInventory().catch(console.error);

