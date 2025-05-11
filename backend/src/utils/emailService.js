const nodemailer = require('nodemailer');

// Create reusable transporter using SMTP transport
let transporter;

// Initialize the transporter based on environment
const initTransporter = () => {
    // For production, use your actual SMTP credentials
    if (process.env.NODE_ENV === 'production') {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    } else {
        // For development, use a test account from Ethereal Email
        nodemailer.createTestAccount().then(testAccount => {
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
            
            console.log('📧 Test email account created:', testAccount.user);
        }).catch(error => {
            console.error('Failed to create test email account:', error);
        });
    }
};

// Initialize the transporter when the module is loaded
initTransporter();

/**
 * Send a password reset email
 * @param {string} to - Recipient email address
 * @param {string} resetLink - Password reset link with token
 * @returns {Promise} - Resolves with info about the sent email
 */
const sendPasswordResetEmail = async (to, resetLink) => {
    try {
        // Make sure transporter is initialized
        if (!transporter) {
            await initTransporter();
        }

        // Setup email data
        const mailOptions = {
            from: `"EduPlans Support" <${process.env.SMTP_USER || 'support@eduplan.com'}>`,
            to,
            subject: 'Reset Your EduPlans Password',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #DC143C; text-align: center;">Reset Your Password</h2>
                    <p>Hello,</p>
                    <p>We received a request to reset your password for your EduPlans account. Click the button below to set a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background-color: #DC143C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
                    </div>
                    <p>If you didn't request a password reset, you can safely ignore this email.</p>
                    <p>This link will expire in 1 hour.</p>
                    <p>Thank you,<br>The EduPlans Team</p>
                </div>
            `
        };

        // Send mail
        const info = await transporter.sendMail(mailOptions);
        
        // Log message URL for development/testing
        if (process.env.NODE_ENV !== 'production') {
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        }
        
        return info;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw error;
    }
};

module.exports = {
    sendPasswordResetEmail
}; 