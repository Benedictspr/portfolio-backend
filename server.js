const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');
const cors = require('cors'); // ✅ Added CORS

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Allow requests only from your GitHub Pages domain
app.use(cors({ origin: 'https://benedictspr.github.io' }));

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Serve the contact page
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Get a Project.html'));
});

// Handle form submission
app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'benedictadurosakin@gmail.com',
      pass: 'nuvgwflmkytutguf' // Gmail App Password
    }
  });

  const mailOptions = {
    from: `"${name}" <${email}>`,
    to: 'benedictadurosakin@gmail.com',
    subject: `📬 New Project Request from ${name}`,
    text: message,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #1a73e8;">📩 New Project Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #1a73e8;">${email}</a></p>
        <p><strong>Message:</strong></p>
        <div style="background-color: #f9f9f9; padding: 10px; border-left: 3px solid #1a73e8; white-space: pre-wrap;">
          ${message.replace(/\n/g, '<br />')}
        </div>
        <br />
        <p style="font-size: 12px; color: #888;">Sent via TheXVIIth Contact Form</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);

    // ✅ Send success page with GIF
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Message Sent</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f4f4f4;
            padding: 50px;
            text-align: center;
            color: #2c3e50;
          }
          .box {
            max-width: 500px;
            margin: 0 auto;
            background: #fff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          .box img {
            width: 100px;
            margin-bottom: 20px;
          }
          .box h2 {
            margin-bottom: 10px;
            color: #004a63;
          }
          .box p {
            font-size: 18px;
          }
          .back-btn {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 20px;
            background-color: #004a63;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
          }
          .back-btn:hover {
            background-color: #006c90;
          }
        </style>
      </head>
      <body>
        <div class="box">
          <img src="/images/sent.gif" alt="Sent Animation" />
          <h2>Message Sent Successfully!</h2>
          <p>Thanks, <strong>${name}</strong>. Your project request has been delivered.</p>
          <a class="back-btn" href="index.html">Home</a>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send('❌ Error sending email. Please try again later.');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
