import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Route for sending Wahala reports to admin
  app.post("/api/send-wahala", async (req, res) => {
    const { userEmail, userComplaint, aiShortResponse, aiGeneratedScript } = req.body;

    console.log("Received Wahala Report:", { userEmail, userComplaint });

    // Admin email from user context
    const adminEmail = "aninzechidera7@gmail.com";

    // Configure Nodemailer
    // NOTE: In a real app, you'd use a service like Resend, SendGrid, or a real SMTP server.
    // For now, we'll log the intent and provide a placeholder for the user to configure.
    const transporter = nodemailer.createTransport({
      // Placeholder: You would replace this with real SMTP or API transport
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || "placeholder@example.com",
        pass: process.env.EMAIL_PASS || "placeholder_pass",
      },
    });

    const mailOptions = {
      from: '"Wahala Scientist System" <system@wahalascientist.com>',
      to: adminEmail,
      subject: `NEW WAHALA REPORT: ${userEmail}`,
      text: `
        User Email: ${userEmail}
        
        Complaint:
        ${userComplaint}
        
        AI Short Response (Sent to User):
        ${aiShortResponse}
        
        AI Generated Comic Script:
        ${aiGeneratedScript}
      `,
      html: `
        <h2>New Wahala Report</h2>
        <p><strong>User Email:</strong> ${userEmail}</p>
        <hr />
        <h3>Complaint:</h3>
        <p>${userComplaint}</p>
        <hr />
        <h3>AI Short Response:</h3>
        <p><em>${aiShortResponse}</em></p>
        <hr />
        <h3>AI Generated Comic Script:</h3>
        <pre style="background: #f4f4f4; padding: 10px; border-radius: 5px;">${aiGeneratedScript}</pre>
      `,
    };

    try {
      // In this environment, we might not have real mail delivery set up.
      // We'll log it clearly so the user knows it's working.
      console.log("Attempting to send email to admin...");
      
      // If credentials exist, try to send
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully.");
      } else {
        console.log("Email credentials missing. Email content logged above.");
      }

      res.status(200).json({ success: true, message: "Wahala report received and logged." });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ success: false, error: "Failed to process report." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
