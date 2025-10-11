// Test inventory status update to Missing
const testInventoryStatusUpdate = async () => {
  try {
    // Try to login with existing user
    const loginResponse = await fetch('http://localhost:3000/api/user-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'aaa',
        password: 'aaa'
      })
    });

    if (!loginResponse.ok) {
      console.error('Login failed');
      return;
    }

    const loginData = await loginResponse.json();
    console.log('Login result:', loginData);

    if (!loginData.success || !loginData.token) {
      console.error('Login failed:', loginData);
      return;
    }

    const token = loginData.token;

    // Get inventories
    const inventoryResponse = await fetch('http://localhost:3000/api/inventories', {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!inventoryResponse.ok) {
      console.error('Failed to fetch inventory items');
      return;
    }

    const inventoryData = await inventoryResponse.json();
    console.log('Inventory items count:', inventoryData.inventories?.length || 0);

    if (!inventoryData.inventories || inventoryData.inventories.length === 0) {
      console.log('No inventory items found');
      return;
    }

    // Find an item with status != 4 to test with
    const testItem = inventoryData.inventories.find(item => item.status !== 4);
    if (!testItem) {
      console.log('All items are already missing status, using first item');
      testItem = inventoryData.inventories[0];
    }

    console.log('Testing with item:', { id: testItem.id, currentStatus: testItem.status, barcode: testItem.barcode });

    // Update status to Missing (4)
    const updateResponse = await fetch(`http://localhost:3000/api/inventories/${testItem.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 4 // Missing status
      })
    });

    const updateResult = await updateResponse.json();
    console.log('Update result:', updateResult);

    // Check missing items
    const missingItemsResponse = await fetch('http://localhost:3000/api/missing-items', {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    const missingItemsData = await missingItemsResponse.json();
    console.log('Missing items after update:', missingItemsData);

  } catch (error) {
    console.error('Test error:', error);
  }
};

testInventoryStatusUpdate();
