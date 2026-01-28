// import React, { useState } from "react";
// import "./ContactSupport.css";

// const ContactSupport = () => {
//     const [form, setForm] = useState({
//         subject: "",
//         message: "",
//     });
//     const [showToast, setShowToast] = useState(false);

//     const handleChange = (e) => {
//         setForm({ ...form, [e.target.name]: e.target.value });
//     };

//     const handleSubmit = (e) => {
//         e.preventDefault();

//         console.log("Support Ticket:", form);

//         // Show toast notification
//         setShowToast(true);
//         setTimeout(() => setShowToast(false), 2000);

//         // Reset form
//         setForm({ subject: "", message: "" });
//     };

//     return (
//         <div className="support-page">
//             <h1>Contact Support</h1>

//             <div className="support-card">
//                 <form onSubmit={handleSubmit} className="support-form">
//                     <div className="form-group">
//                         <input
//                             type="text"
//                             name="subject"
//                             value={form.subject}
//                             onChange={handleChange}
//                             required
//                             placeholder=" "
//                             autoComplete="off"        // disables browser autocomplete
//                             spellCheck="false"
//                         />
//                         <label>Subject</label>
//                     </div>

//                     <div className="form-group">
//                         <textarea
//                             name="message"
//                             rows="6"
//                             value={form.message}
//                             onChange={handleChange}
//                             required
//                             placeholder=" "
//                         />
//                         <label>Message</label>
//                     </div>

//                     <button type="submit" className="submit-btn">Submit</button>
//                 </form>
//             </div>

//             {showToast && <div className="toast">Support request submitted!</div>}
//         </div>
//     );
// };
// export default ContactSupport;




import React, { useState } from "react";
import emailjs from "@emailjs/browser";
import "./ContactSupport.css";

const ContactSupport = () => {
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
    });
    const [showToast, setShowToast] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);

        try {
            // Replace newlines in message with <br> for HTML formatting
            const formattedMessage = form.message.replace(/\n/g, "<br>");

            await emailjs.send(
                "service_rc05p5v",     // Gmail service
                "template_nh3migb",    // Email template
                {
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    subject: form.subject,
                    message: form.message.replace(/\n/g, "<br>"), // preserve line breaks
                },
                "SKmEoaGBdBM-RTXNA"     // Public key
            );

            setShowToast(true);
            setTimeout(() => setShowToast(false), 2000);
            setForm({ name: "", email: "", phone: "", subject: "", message: "" });

        } catch (error) {
            console.error("Email send failed:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="support-page">
            <h1>Contact Support</h1>

            <div className="support-card">
                <form onSubmit={handleSubmit} className="support-form">
                    {/* Name */}
                    <div className="form-group">
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            placeholder=" "
                            autoComplete="off"
                        />
                        <label>Name</label>
                    </div>

                    {/* Email */}
                    <div className="form-group">
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            placeholder=" "
                            autoComplete="off"
                        />
                        <label>Email</label>
                    </div>

                    {/* Phone */}
                    <div className="form-group">
                        <input
                            type="text"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder=" "
                            autoComplete="off"
                        />
                        <label>Phone</label>
                    </div>

                    {/* Subject */}
                    <div className="form-group">
                        <input
                            type="text"
                            name="subject"
                            value={form.subject}
                            onChange={handleChange}
                            required
                            placeholder=" "
                            autoComplete="off"
                            spellCheck="false"
                        />
                        <label>Subject</label>
                    </div>

                    {/* Message */}
                    <div className="form-group">
                        <textarea
                            name="message"
                            rows="6"
                            value={form.message}
                            onChange={handleChange}
                            required
                            placeholder=" "
                        />
                        <label>Message</label>
                    </div>

                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Sending..." : "Submit"}
                    </button>
                </form>
            </div>

            {showToast && <div className="toast">Support request submitted!</div>}
        </div>
    );
};

export default ContactSupport;
