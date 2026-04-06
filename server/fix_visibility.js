const mongoose = require('mongoose');
require('dotenv').config();
const Program = require('./models/Program');
const Scholarship = require('./models/Scholarship');

async function fixStatus() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const pResult = await Program.updateMany({ status: 'draft' }, { $set: { status: 'active' } });
    console.log(`Updated ${pResult.modifiedCount} programs to active`);

    const sResult = await Scholarship.updateMany({ status: 'draft' }, { $set: { status: 'active' } });
    console.log(`Updated ${sResult.modifiedCount} scholarships to active`);

    await mongoose.connection.close();
  } catch (error) {
    console.error(error);
  }
}
fixStatus();
