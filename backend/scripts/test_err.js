const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function trigger() {
  try {
    // Attempt to log in to get an owner token, or just run a direct db insert snippet
    // Actually, it's easier to just patch the places.js to log errors to a file!
  } catch (e) {
    console.error(e);
  }
}
trigger();
