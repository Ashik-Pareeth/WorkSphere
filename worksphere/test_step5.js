// Native fetch is available in Node 18+

async function run() {
    let auth, res, data;
    const baseUrl = 'http://localhost:8080';

    // Helper to extract JSON from response
    async function fetchJson(url, options) {
        let r = await fetch(url, options);
        if (!r.ok) {
            let text = await r.text();
            throw new Error(`HTTP ${r.status}: ${text}`);
        }
        if (r.status === 204) return null;
        return r.json();
    }

    try {
        console.log("--- Starting Step 5: Attendance Flow Tests ---");

        // 1. Log in as EMPLOYEE
        console.log("\nLogging in as EMPLOYEE (ashik)...");
        auth = await fetchJson(`${baseUrl}/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({userName: 'ashik', password: 'password'})
        });
        const employeeToken = auth.token;
        console.log("EMPLOYEE Login Successful");

        // 2. Fetch today's attendance record (5.1 Clock In Prep)
        console.log("\n5.1 Testing Clock In...");
        let today = new Date().toISOString().split('T')[0];
        let clockInReq = {
            clockInTime: new Date().toISOString(),
            status: "PRESENT",
            date: today,
            notes: "Automated clock-in test"
        };
        
        let attendanceRecord = await fetchJson(`${baseUrl}/api/attendance/clock-in`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${employeeToken}`
            },
            body: JSON.stringify(clockInReq)
        });
        console.log("Clock In Successful. Record ID:", attendanceRecord.id);

        // 3. Test Clock Out (5.2)
        console.log("\n5.2 Testing Clock Out...");
        let clockOutReq = {
            clockOutTime: new Date().toISOString(),
            notes: "Automated clock-out test"
        };
        
        attendanceRecord = await fetchJson(`${baseUrl}/api/attendance/${attendanceRecord.id}/clock-out`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${employeeToken}`
            },
            body: JSON.stringify(clockOutReq)
        });
        console.log("Clock Out Successful. Hours Worked:", attendanceRecord.hoursWorked);

        // 4. Log in as MANAGER
        console.log("\nLogging in as MANAGER (manager)...");
        auth = await fetchJson(`${baseUrl}/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({userName: 'manager', password: 'password'})
        });
        const managerToken = auth.token;
        console.log("MANAGER Login Successful");

        // 5. MANAGER fetching roster/team attendance (5.3)
        console.log("\n5.3 MANAGER confirms daily roster...");
        let teamAttendance = await fetchJson(`${baseUrl}/api/attendance/team?date=${today}`, {
            headers: {'Authorization': `Bearer ${managerToken}`}
        });
        console.log(`Team Attendance Fetched. Found ${teamAttendance.length} records.`);
        
        const myEmployeeRecord = teamAttendance.find(a => a.id === attendanceRecord.id);
        console.log("Is Employee's record in Manager's roster?", !!myEmployeeRecord);

        // 6. MANAGER manual adjustment (5.4)
        console.log("\n5.4 MANAGER manual adjustment...");
        let managerAdjustReq = {
            notes: "Manager adjusting times for testing",
            status: "HALF_DAY"
        };
        
        attendanceRecord = await fetchJson(`${baseUrl}/api/attendance/${attendanceRecord.id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${managerToken}`
            },
            body: JSON.stringify(managerAdjustReq)
        });
        console.log("Manager Adjustment Successful. New Status:", attendanceRecord.status);

        console.log("\n--- Step 5 Tests Completed Successfully! ---");

    } catch (e) {
        console.error("Error during execution:");
        console.error(e);
    }
}

run();
