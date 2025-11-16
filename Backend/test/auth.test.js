require('dotenv').config({ path: '.env.test' });

const mongoose = require('mongoose');
const chai = require('chai');
const chaiHttp = require('chai-http');
const ExcelJS = require('exceljs');
const app = require('../server.js');
const User = require('../models/userschema');

chai.use(chaiHttp);
const { expect } = chai;

// Store test results here
const testResults = [];

// Check if we're in test environment
const isTestEnv = process.env.NODE_ENV === 'test';

// Connect to DB before tests
before(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set.');

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(uri);
  
  // Log warning if not in test environment
  if (!isTestEnv) {
    console.warn('\x1b[33m%s\x1b[0m', 
      'WARNING: Tests are running outside test environment. ' +
      'User data will NOT be cleared. ' +
      'Set NODE_ENV=test to enable data clearing during tests.'
    );
  }
});

// Disconnect after all tests
after(async () => {
  await mongoose.disconnect();
});

// Clear users before each test ONLY if in test environment
beforeEach(async () => {
  if (isTestEnv) {
    console.log('Clearing users for test...');
    await User.deleteMany({});
  } else {
    console.log('Skipping user deletion (not in test environment)');
  }
});

// After all tests, write results to Excel
after(async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Auth Test Results');

  // Add header row
  sheet.addRow(['Test Name', 'Status', 'Error Message']);

  // Add rows for each test result
  testResults.forEach(({ title, state, err }) => {
    sheet.addRow([
      title,
      state,
      err ? err.message || JSON.stringify(err) : '',
    ]);
  });

  try {
    await workbook.xlsx.writeFile('test-results.xlsx');
    console.log('Test results written to test-results.xlsx');
  } catch (err) {
    console.error('Error writing Excel file:', err);
  }
});

describe('Auth API', () => {

  it('registers a new user', async function () {
    try {
      const res = await chai.request(app).post('/register').send({
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        password: 'password123',
        contactNumber: '+15555550123'
      });

      expect(res).to.have.status(201);
      expect(res.body).to.have.property('message', 'User registered successfully');

      testResults.push({ title: this.test.title, state: 'passed', err: null });
    } catch (err) {
      testResults.push({ title: this.test.title, state: 'failed', err });
      throw err;
    }
  });

  it('blocks duplicate registration', async function () {
    try {
      // first registration
      await chai.request(app).post('/register').send({
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        password: 'password123',
        contactNumber: '+15555550123'
      });

      // duplicate registration
      const res = await chai.request(app).post('/register').send({
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        password: 'password123',
        contactNumber: '+15555550123'
      });

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('message');

      testResults.push({ title: this.test.title, state: 'passed', err: null });
    } catch (err) {
      testResults.push({ title: this.test.title, state: 'failed', err });
      throw err;
    }
  });

  it('logs in with correct credentials', async function () {
    try {
      // register first
      await chai.request(app).post('/register').send({
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        password: 'password123',
        contactNumber: '+15555550123'
      });

      // login
      const res = await chai.request(app).post('/login').send({
        email: 'testuser@example.com',
        password: 'password123'
      });

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('token');

      testResults.push({ title: this.test.title, state: 'passed', err: null });
    } catch (err) {
      testResults.push({ title: this.test.title, state: 'failed', err });
      throw err;
    }
  });

  it('denies login with wrong password', async function () {
    try {
      // register first
      await chai.request(app).post('/register').send({
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        password: 'password123',
        contactNumber: '+15555550123'
      });

      // attempt wrong password
      const res = await chai.request(app).post('/login').send({
        email: 'testuser@example.com',
        password: 'wrongpassword'
      });

      expect(res).to.have.status(401);
      expect(res.body).to.have.property('message');

      testResults.push({ title: this.test.title, state: 'passed', err: null });
    } catch (err) {
      testResults.push({ title: this.test.title, state: 'failed', err });
      throw err;
    }
  });

});