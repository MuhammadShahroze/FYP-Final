const mongoose = require('mongoose');
require('dotenv').config();
const Program = require('./models/Program');

async function checkPrograms() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const programs = await Program.find({});
    console.log(`Programs in DB: ${programs.length}`);
    programs.forEach(p => console.log(`- ${p.title} | Status: ${p.status} | College: ${p.university}`));
    await mongoose.connection.close();
  } catch (error) {
    console.error(error);
  }
}
checkPrograms();
