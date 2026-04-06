const mongoose = require('mongoose');
require('dotenv').config();
const Program = require('./models/Program');
const Scholarship = require('./models/Scholarship');

const degreeMap = {
  'bachelors': "Bachelor's",
  'masters': "Master's",
  'phd': "PhD"
};

async function fixData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const programs = await Program.find({});
    for (const p of programs) {
      if (degreeMap[p.degreeLevel]) {
        p.degreeLevel = degreeMap[p.degreeLevel];
        await p.save();
        console.log(`Updated program ${p.title} to degreeLevel: ${p.degreeLevel}`);
      }
    }

    const scholarships = await Scholarship.find({});
    for (const s of scholarships) {
      if (degreeMap[s.degreeLevel]) {
        s.degreeLevel = degreeMap[s.degreeLevel];
        await s.save();
        console.log(`Updated scholarship ${s.title} to degreeLevel: ${s.degreeLevel}`);
      }
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error(error);
  }
}
fixData();
