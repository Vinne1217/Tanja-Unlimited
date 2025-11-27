/**
 * Test script for variant inventory
 * 
 * Usage:
 *   node scripts/test-variant-inventory.mjs
 * 
 * This script:
 * 1. Simulates adding variant inventory via webhook
 * 2. Tests querying variant inventory via API
 */

import { updateInventory } from '../lib/inventory.ts';

// Simulate webhook data for LJCfilG variants
const testVariants = [
  { key: 'XS', sku: 'LJCfilG-XS', stripePriceId: 'price_1SX5xtP6vvUUervC7sVlRnoi', stock: 10 },
  { key: 'S', sku: 'LJCfilG-S', stripePriceId: 'price_1SX5yeP6vvUUervC41kmP3Oo', stock: 10 },
  { key: 'M', sku: 'LJCfilG-M', stripePriceId: 'price_1SX5z2P6vvUUervCn7DBjW4V', stock: 10 },
  { key: 'L', sku: 'LJCfilG-L', stripePriceId: 'price_1SX5zJP6vvUUervCvIIk1R0u', stock: 10 },
  { key: 'XL', sku: 'LJCfilG-XL', stripePriceId: 'price_1SX5zUP6vvUUervCyLcMME9z', stock: 10 },
];

console.log('🧪 Testing Variant Inventory\n');

// Simulate adding inventory
console.log('1. Simulating webhook to add variant inventory...\n');
for (const variant of testVariants) {
  {
  const inventoryId = `price_${variant.stripePriceId}`;
  await updateInventory(inventoryId, {
    stock: variant.stock,
    status: 'in_stock',
    lowStock: false,
    outOfStock: false,
    name: `Long Jacket Cotton Fitted Imperial Line Gold (LJCfilG) - ${variant.key}`,
    sku: variant.sku,
    lastUpdated: new Date().toISOString()
  });
  console.log(`✅ Added inventory for ${variant.key}: ${inventoryId} (stock: ${variant.stock})`);
}

console.log('\n2. Testing API endpoint...\n');

// Test API endpoint (if server is running)
const API_URL = process.env.API_URL || 'http://localhost:3000';
const productId = 'ljcfilg-001';

for (const variant of testVariants) {
  const url = `${API_URL}/api/inventory/status?productId=${encodeURIComponent(productId)}&stripePriceId=${encodeURIComponent(variant.stripePriceId)}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`📦 Variant ${variant.key}:`);
    console.log(`   Stock: ${data.stock}`);
    console.log(`   Status: ${data.status}`);
    console.log(`   Out of Stock: ${data.outOfStock}`);
    console.log(`   Has Data: ${data.hasData}`);
    console.log('');
  } catch (error) {
    console.error(`❌ Error testing variant ${variant.key}:`, error.message);
  }
}

console.log('✅ Test complete!');

