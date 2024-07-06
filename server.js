const express = require('express');
const bodyParser = require('body-parser');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

app.use(bodyParser.json());

// Endpoint to handle referral form submission
app.post('/api/referrals', async (req, res) => {
  const { referrerName, referrerEmail, refereeName, refereeEmail } = req.body;

  // Basic validation
  if (!referrerName || !referrerEmail || !refereeName || !refereeEmail) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const nameRegex = /^[a-zA-Z\s]*$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!nameRegex.test(referrerName) || referrerName.length <= 2) {
    return res.status(400).json({ error: 'Invalid referrer name.' });
  }

  if (!emailRegex.test(referrerEmail) || !referrerEmail.endsWith('.com')) {
    return res.status(400).json({ error: 'Invalid referrer email.' });
  }

  if (!nameRegex.test(refereeName) || refereeName.length <= 2) {
    return res.status(400).json({ error: 'Invalid referee name.' });
  }

  if (!emailRegex.test(refereeEmail) || !refereeEmail.endsWith('.com')) {
    return res.status(400).json({ error: 'Invalid referee email.' });
  }

  try {
    // Save referral data to the database
    const referral = await prisma.referral.create({
      data: { referrerName, referrerEmail, refereeName, refereeEmail },
    });

    // Send referral email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: refereeEmail,
      subject: 'You have been referred!',
      text: `Hi ${refereeName},\n\nYou have been referred by ${referrerName} (${referrerEmail}) to check out our course.\n\nBest regards,\nYour Company`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ error: 'Failed to send email.' });
      } else {
        res.status(201).json(referral);
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save referral.' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
