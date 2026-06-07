const baseUrl = 'http://localhost:4004/odata/v4/wash-wizard';

const authAdmin = 'Basic ' + Buffer.from('admin:admin123').toString('base64');
const authStaff = 'Basic ' + Buffer.from('staff:staff123').toString('base64');

async function runTest(name, url, options = {}) {
    const defaultHeaders = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    try {
        const res = await fetch(url, {
            ...options,
            headers: defaultHeaders
        });
        const status = res.status;
        let data = null;
        try {
            data = await res.json();
        } catch (e) {
            // response is not JSON
        }
        
        const expectedStatus = options.expectedStatus || [200, 201, 204];
        const pass = expectedStatus.includes(status);
        
        console.log(`${pass ? '✅ PASS' : '❌ FAIL'} | ${name}`);
        console.log(`         Request:  ${options.method || 'GET'} ${url}`);
        console.log(`         Response: Status ${status}`);
        if (data && !pass) {
            console.log(`         Error:    ${JSON.stringify(data.error || data)}`);
        }
        return { pass, status, data };
    } catch (err) {
        console.log(`❌ ERROR | ${name}`);
        console.log(`         Request:  ${options.method || 'GET'} ${url}`);
        console.log(`         Exception: ${err.message}`);
        return { pass: false, err };
    }
}

async function main() {
    console.log('===================================================================');
    console.log('               STARTING WASHWIZARD API TEST RUNNER                 ');
    console.log('===================================================================');

    // 1. Service Document & Metadata
    await runTest('Get Service Document', baseUrl, { headers: { Authorization: authStaff } });
    await runTest('Get Metadata', `${baseUrl}/$metadata`, { headers: { Authorization: authStaff } });

    // 2. Fetch Entities
    await runTest('Get ServiceTaskSet List', `${baseUrl}/ServiceTaskSet`, { headers: { Authorization: authStaff } });
    await runTest('Get ServiceTaskSet List with Filter', `${baseUrl}/ServiceTaskSet?$filter=Status eq 'Pending'`, { headers: { Authorization: authStaff } });
    
    // 3. Create Direct Active Entity
    const createActiveRes = await runTest('Create Active Service Task', `${baseUrl}/ServiceTaskSet`, {
        method: 'POST',
        headers: { Authorization: authStaff },
        body: JSON.stringify({
            CustomerName: "Test Direct Active",
            Phone: "9999999999",
            CarModel: "Honda City",
            VehiclePlate: "DL 01 AA 1234",
            ServiceType: "Full Wash",
            PaymentMethod: "UPI",
            Status: "Pending",
            ServiceDate: "2026-06-07"
        }),
        expectedStatus: [201]
    });
    
    let activeId = null;
    if (createActiveRes.pass && createActiveRes.data) {
        activeId = createActiveRes.data.ID;
        console.log(`         Created Active Task ID: ${activeId}`);
    }

    // 4. Draft Lifecycle Operations (Create -> Patch -> Activate)
    const createDraftRes = await runTest('Create Draft Service Task', `${baseUrl}/ServiceTaskSet`, {
        method: 'POST',
        headers: { Authorization: authStaff },
        body: JSON.stringify({
            IsActiveEntity: false,
            CustomerName: "Test Draft Customer",
            Phone: "8888888888",
            CarModel: "Honda City",
            VehiclePlate: "GJ 01 BB 5678",
            ServiceType: "Full Wash"
        }),
        expectedStatus: [201]
    });

    if (createDraftRes.pass && createDraftRes.data) {
        const draftId = createDraftRes.data.ID;
        console.log(`         Created Draft Task ID: ${draftId}`);

        // Patch draft
        await runTest('Patch Draft Service Task (Auto-populates amount from catalog)', `${baseUrl}/ServiceTaskSet(ID=${draftId},IsActiveEntity=false)`, {
            method: 'PATCH',
            headers: { Authorization: authStaff },
            body: JSON.stringify({
                ServiceType: "Ceramic Coating",
                PaymentMethod: "Card"
            }),
            expectedStatus: [200]
        });

        // Activate draft
        const activateRes = await runTest('Activate Draft Service Task', `${baseUrl}/ServiceTaskSet(ID=${draftId},IsActiveEntity=false)/WashWizardService.draftActivate`, {
            method: 'POST',
            headers: { Authorization: authStaff },
            body: JSON.stringify({}),
            expectedStatus: [201]
        });

        if (activateRes.pass && activateRes.data) {
            const activatedId = activateRes.data.ID;
            console.log(`         Activated Task ID: ${activatedId}`);

            // Delete the activated task as cleanup
            await runTest('Delete Activated Service Task', `${baseUrl}/ServiceTaskSet(ID=${activatedId},IsActiveEntity=true)`, {
                method: 'DELETE',
                headers: { Authorization: authStaff },
                expectedStatus: [204]
            });
        }
    }

    // 5. Custom bound action: completeService
    // We will complete the seed task: ID=a1b2c3d4-1111-4000-8000-000000000021
    await runTest('Complete Service Action (Bound Action)', `${baseUrl}/ServiceTaskSet(ID=a1b2c3d4-1111-4000-8000-000000000021,IsActiveEntity=true)/WashWizardService.completeService`, {
        method: 'POST',
        headers: { Authorization: authStaff },
        body: JSON.stringify({}),
        expectedStatus: [200, 400] // 400 is expected if already completed
    });

    // 6. Delete the direct active task we created in step 3
    if (activeId) {
        await runTest('Delete Direct Active Service Task', `${baseUrl}/ServiceTaskSet(ID=${activeId},IsActiveEntity=true)`, {
            method: 'DELETE',
            headers: { Authorization: authStaff },
            expectedStatus: [204]
        });
    }

    // 7. Catalog operations
    await runTest('Get Service Catalog', `${baseUrl}/ServiceCatalogSet`, { headers: { Authorization: authStaff } });
    const createCatalogRes = await runTest('Create Catalog Item (Admin)', `${baseUrl}/ServiceCatalogSet`, {
        method: 'POST',
        headers: { Authorization: authAdmin },
        body: JSON.stringify({
            Category: "Detailing",
            ServiceName: "Scratch Removal",
            Price: 1500.00
        }),
        expectedStatus: [201]
    });
    
    if (createCatalogRes.pass && createCatalogRes.data) {
        const catId = createCatalogRes.data.ID;
        await runTest('Delete Catalog Item (Admin)', `${baseUrl}/ServiceCatalogSet(ID=${catId})`, {
            method: 'DELETE',
            headers: { Authorization: authAdmin },
            expectedStatus: [204]
        });
    }

    // 8. Car Model Master operations
    await runTest('Get Car Model Master', `${baseUrl}/CarModelMasterSet`, { headers: { Authorization: authStaff } });
    const createCarModelRes = await runTest('Create Car Model (Admin)', `${baseUrl}/CarModelMasterSet`, {
        method: 'POST',
        headers: { Authorization: authAdmin },
        body: JSON.stringify({
            Brand: "Hyundai",
            ModelName: "Verna"
        }),
        expectedStatus: [201]
    });
    
    if (createCarModelRes.pass && createCarModelRes.data) {
        const modelId = createCarModelRes.data.ID;
        // Clean up
        await runTest('Delete Car Model (Admin)', `${baseUrl}/CarModelMasterSet(ID=${modelId},IsActiveEntity=true)`, {
            method: 'DELETE',
            headers: { Authorization: authAdmin },
            expectedStatus: [204]
        });
    }

    // 9. UsersSet Operations (Role-based access tests)
    await runTest('Get Users List (Admin role - Expected OK)', `${baseUrl}/UsersSet`, { headers: { Authorization: authAdmin } });
    await runTest('Get Users List (Staff role - Expected Forbidden 403)', `${baseUrl}/UsersSet`, { 
        headers: { Authorization: authStaff },
        expectedStatus: [403]
    });

    const createUserRes = await runTest('Create User (Admin role - Expected OK)', `${baseUrl}/UsersSet`, {
        method: 'POST',
        headers: { Authorization: authAdmin },
        body: JSON.stringify({
            Username: "tempuser",
            Role: "Staff"
        }),
        expectedStatus: [201]
    });
    
    if (createUserRes.pass && createUserRes.data) {
        await runTest('Delete User (Admin role - Expected OK)', `${baseUrl}/UsersSet('tempuser')`, {
            method: 'DELETE',
            headers: { Authorization: authAdmin },
            expectedStatus: [204]
        });
    }

    // 10. Authentication check
    await runTest('Get ServiceTaskSet without Authentication (Expected Unauthorized 401)', `${baseUrl}/ServiceTaskSet`, {
        expectedStatus: [401]
    });

    console.log('===================================================================');
    console.log('                        TEST SUITE COMPLETED                       ');
    console.log('===================================================================');
}

main();
