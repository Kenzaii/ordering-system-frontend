import fetch from 'node-fetch';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { orderSummary, totalAmount } = req.body;

        // Admin email address to receive order summaries
        const adminEmail = "ljwong@3echo.ai";  // Replace with your actual email address

        const emailData = {
            personalizations: [
                {
                    to: [{ email: adminEmail }],
                    subject: 'New Customer Order - Order Summary'
                }
            ],
            from: { email: process.env.EMAIL_USERNAME },  // Use your verified SendGrid sender email
            content: [
                {
                    type: 'text/plain',
                    value: `New order received!\n\nOrder summary:\n${orderSummary}\n\nTotal: $${totalAmount}\n\n`
                }
            ]
        };

        try {
            const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emailData)
            });

            if (response.ok) {
                res.status(200).json({ message: 'Order tracking email sent to admin!' });
            } else {
                const errorText = await response.text();
                console.error('Error sending email:', errorText);
                res.status(500).json({ message: 'Failed to send email' });
            }
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ message: 'Failed to send email' });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }

        function confirmOrder() {
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        if (cart.length === 0) return alert("Your cart is empty!");
    
        const orderSummary = cart.map(item => `${item.productName}: Quantity ${item.quantity}, Total $${item.total}`).join('\n');
        const totalAmount = cart.reduce((sum, item) => sum + parseFloat(item.total), 0).toFixed(2);
    
        // Add to order history in local storage
        const orderHistory = JSON.parse(localStorage.getItem("orderHistory")) || [];
        orderHistory.push({
            date: new Date().toLocaleString(),
            items: cart,
            totalAmount
        });
        localStorage.setItem("orderHistory", JSON.stringify(orderHistory));
    
        // Send order tracking email to admin using Vercel's API
        fetch('https://ordering-system-frontend-three.vercel.app/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderSummary,
                totalAmount
            })
        })
        .then(response => {
            if (response.ok) {
                alert("Order confirmed! An email has been sent to the admin for tracking.");
            } else {
                alert("Order confirmed, but failed to send tracking email.");
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert("Order confirmed, but there was an error sending the tracking email.");
        });
    
        loadOrderHistory();
        showSection('order-history');
        localStorage.removeItem("cart"); // Clear cart after confirming order
    }
}
