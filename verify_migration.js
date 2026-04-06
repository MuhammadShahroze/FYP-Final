const axios = require('axios');

async function testFlow() {
  const baseUrl = 'http://localhost:5000/api';
  console.log('--- Starting Verification Flow ---');

  try {
    // 1. Register a student
    console.log('\n1. Registering a student...');
    const registerRes = await axios.post(`${baseUrl}/auth/register`, {
      name: 'Test Student',
      email: `student_${Date.now()}@test.com`,
      password: 'password123',
      role: 'student'
    });
    const studentToken = registerRes.data.token;
    console.log('Student registered successfully.');

    // 2. Register a university
    console.log('\n2. Registering a university...');
    const uniRegisterRes = await axios.post(`${baseUrl}/auth/register`, {
      name: 'Test University',
      email: `uni_${Date.now()}@test.com`,
      password: 'password123',
      role: 'university'
    });
    const uniToken = uniRegisterRes.data.token;
    console.log('University registered successfully.');

    // 3. University creates a program
    console.log('\n3. Creating a program as university...');
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
    console.log(`Program created with ID: ${programId}`);

    // 4. Student applies to the program
    console.log('\n4. Applying to program as student...');
    const applyRes = await axios.post(`${baseUrl}/applications`, {
      targetId: programId,
      targetType: 'program',
      documents: [{ name: 'CV', url: 'http://test.com/cv.pdf' }]
    }, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    console.log('Application submitted successfully.');

    // 5. Verify university sees the application
    console.log('\n5. Verifying university sees the application...');
    const uniAppsRes = await axios.get(`${baseUrl}/applications/institution`, {
      headers: { Authorization: `Bearer ${uniToken}` }
    });
    const apps = uniAppsRes.data.data;
    console.log(`Found ${apps.length} applications for university.`);
    if (apps.some(a => a.targetId === programId)) {
      console.log('SUCCESS: University found the student application.');
    } else {
      console.log('FAILURE: Student application not found in university dashboard.');
    }

    console.log('\n--- Verification Flow Completed ---');
  } catch (error) {
    console.error('\nVerification failed:', error.response ? error.response.data : error.message);
  }
}

testFlow();
