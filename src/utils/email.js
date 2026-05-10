
import emailjs from '@emailjs/browser';

// Initialize EmailJS with your Public Key
const EMAILJS_SERVICE_ID = 'service_h3exkwm';
const EMAILJS_TEMPLATE_VERIFICATION = 'template_n6yjb5k'; 
const EMAILJS_TEMPLATE_CONTACT = 'template_syyn27e';
const EMAILJS_PUBLIC_KEY = 'W9PbvigHgxkCQCvET';

export const emailService = {
    /**
     * Send verification email using EmailJS
     * @param {string} toEmail 
     * @param {string} verificationToken 
     */
    async sendVerificationEmail(toEmail, verificationToken) {
        const verificationLink = `${window.location.origin}/verify-email?token=${verificationToken}`;
        
        const templateParams = {
            to_email: toEmail,
            verification_link: verificationLink,
            app_name: 'ClassMaster'
        };

        try {
            // Note: In production, you'd call emailjs.init(EMAILJS_PUBLIC_KEY) elsewhere or here
            const response = await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_VERIFICATION,
                templateParams,
                EMAILJS_PUBLIC_KEY
            );
            console.log('EmailJS Success:', response.status, response.text);
            return true;
        } catch (error) {
            console.error('EmailJS Error:', error);
            throw error;
        }
    },

    /**
     * Send contact form email using EmailJS
     * @param {Object} formData { name, email, message }
     */
    async sendContactEmail(formData) {
        const templateParams = {
            from_name: formData.name,
            from_email: formData.email,
            message: formData.message,
            to_email: 'sejanrandinu01@gmail.com'
        };

        try {
            const response = await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_CONTACT,
                templateParams,
                EMAILJS_PUBLIC_KEY
            );
            return response;
        } catch (error) {
            console.error('EmailJS Contact Error:', error);
            throw error;
        }
    }
};
