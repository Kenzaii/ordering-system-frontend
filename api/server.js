const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Configure nodemailer transport
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Endpoint to send order confirmation email
app.post('/send-email', async (req, res) => {
    const { to, orderSummary, totalAmount } = req.body;

    const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to,
        subject: 'Order Confirmation - Your Order Summary',
        text: `Thank you for your order!\n\nHere is your order summary:\n${orderSummary}\n\nTotal: $${totalAmount}\n\nWe appreciate your business!`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).send('Order confirmation email sent!');
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).send('Failed to send email');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
