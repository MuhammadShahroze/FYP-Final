const axios = require('axios');
const fs = require('fs');

function log(msg) {
  console.log(msg);
  fs.appendFileSync('verification_log.txt', msg + '\n');
}

async function testFlow() {
  if (fs.existsSync('verification_log.txt')) fs.unlinkSync('verification_log.txt');
  const baseUrl = 'http://localhost:5000/api';
  log('--- Starting Verification Flow ---');

  try {
    // 1. Register a student
    log('\n1. Registering a student...');
    const registerRes = await axios.post(`${baseUrl}/auth/register`, {
      name: 'Test Student',
      email: `student_${Date.now()}@test.com`,
      password: 'password123',
      role: 'student'
    });
    const studentToken = registerRes.data.token;
    log('Student registered successfully.');

    // 2. Register a university
    log('\n2. Registering a university...');
    const uniRegisterRes = await axios.post(`${baseUrl}/auth/register`, {
      name: 'Test University',
      email: `uni_${Date.now()}@test.com`,
      password: 'password123',
      role: 'university'
    });
    const uniToken = uniRegisterRes.data.token;
    log('University registered successfully.');

    // 3. University creates a program
    log('\n3. Creating a program as university...');
    const programRes = await axios.post(`${baseUrl}/programs`, {
      title: 'MSc Computer Science',
      semester: 'Winter 2026',
      deadline: '2025-12-31',
      courseCode: 'CS101',
      cgpaRequirement: '3.0',
      description: 'Test program description',
      requirements: 'Test requirements',
      subjectGroups: 'CS',
      courseType: 'masters',
      semesterFee: '500',
      courseDuration: '2 years',
      courseLanguage: 'English',
      location: 'Test City'
    }, {
      headers: { Authorization: `Bearer ${uniToken}` }
    });
    const programId = programRes.data.data._id;
    log(`Program created with ID: ${programId}`);

    // 4. Student applies to the program
    log('\n4. Applying to program as student...');
    const applyRes = await axios.post(`${baseUrl}/applications`, {
      targetId: programId,
      targetType: 'program',
      documents: [{ name: 'CV', url: 'http://test.com/cv.pdf' }]
    }, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    log('Application submitted successfully.');

    // 5. Verify university sees the application
    log('\n5. Verifying university sees the application...');
    const uniAppsRes = await axios.get(`${baseUrl}/applications/institution`, {
      headers: { Authorization: `Bearer ${uniToken}` }
    });
    const apps = uniAppsRes.data.data;
    log(`Found ${apps.length} applications for university.`);
    if (apps.some(a => a.targetId === programId)) {
      log('SUCCESS: University found the student application.');
    } else {
      log('FAILURE: Student application not found in university dashboard.');
    }

    log('\n--- Verification Flow Completed ---');
  } catch (error) {
    log('\nVerification failed!');
    if (error.response) {
      log('Status: ' + error.response.status);
      log('Data: ' + JSON.stringify(error.response.data, null, 2));
    } else {
      log('Error: ' + error.message);
    }
    process.exit(1);
  }
}

testFlow();
