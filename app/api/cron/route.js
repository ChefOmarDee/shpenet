import { NextResponse } from "next/server";
import { Connection } from "@/app/_lib/mongo/models/connection";
import nodemailer from 'nodemailer';
import { connectToDatabase } from "@/app/_lib/mongo/connection/connection";
import * as path from 'path';
import 'dotenv/config';

// Validate required environment variables
const requiredEnvVars = ['EMAIL_PASSWORD', 'CRON_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: "shpenetuserhelp@gmail.com",
    pass: process.env.EMAIL_PASSWORD
  }
});

// Function to create email content
function createEmailContent(connection) {
  return {
    from: "shpenetuserhelp@gmail.com",
    to: connection.email,
    subject: `Reminder: Connection with ${connection.firstName} ${connection.lastName}`,
    html: `
      <h2>Connection Reminder</h2>
      <p>Hello! This is a reminder about your connection with:</p>
      <ul>
        <li><strong>Name:</strong> ${connection.firstName} ${connection.lastName}</li>
        <li><strong>Position:</strong> ${connection.position}</li>
        <li><strong>Company:</strong> ${connection.companyName}</li>
        ${connection.companyURL ? `<li><strong>Company URL:</strong> <a href="${connection.companyURL}">${connection.companyURL}</a></li>` : ''}
      </ul>
      <p>Best regards,<br>Your Networking Assistant</p>
    `
  };
}

// Function to send reminder email with retry logic
async function sendReminderEmail(connection, maxRetries = 3) {
  const mailOptions = createEmailContent(connection);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`✓ Reminder email sent to ${connection.email} (attempt ${attempt})`);
      return true;
    } catch (error) {
      console.error(`× Email sending failed (attempt ${attempt}/${maxRetries}):`, error.message);
      if (attempt === maxRetries) {
        return false;
      }
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

// Process reminders function with batch processing
async function processReminders(batchSize = 50) {
  let processed = 0;
  let failed = 0;
  
  try {
    // Find all documents where remindTime is in the past and reminded is false
    const connectionsToRemind = await Connection.find({
      remindTime: { $lte: new Date() },
      reminded: false
    }).limit(batchSize);

    console.log(`Found ${connectionsToRemind.length} connections to process`);

    // Process connections in parallel with rate limiting
    const results = await Promise.all(
      connectionsToRemind.map(async (connection) => {
        try {
          const emailSent = await sendReminderEmail(connection);
          
          if (emailSent) {
            await Connection.findByIdAndUpdate(connection._id, {
              reminded: true,
              remindTime: null,
              lastReminderSent: new Date()
            });
            processed++;
            return { success: true, email: connection.email };
          } else {
            failed++;
            return { success: false, email: connection.email };
          }
        } catch (error) {
          failed++;
          console.error(`Error processing ${connection.email}:`, error.message);
          return { success: false, email: connection.email, error: error.message };
        }
      })
    );

    return { processed, failed, results };
  } catch (error) {
    console.error('Error in processReminders:', error);
    throw error;
  }
}

// API Route Handler
export async function GET(request) {
  // Verify the cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Connect to MongoDB
    await connectToDatabase();

    const startTime = new Date();
    console.log("📧 Reminder Cron Job Started:", startTime.toISOString());
    
    // Process reminders
    const results = await processReminders();
    
    const endTime = new Date();
    console.log("✓ Reminder Cron Job Completed:", endTime.toISOString());

    // Return detailed results
    return NextResponse.json({
      success: true,
      message: "Cron Job Completed",
      startTime,
      endTime,
      duration: endTime - startTime,
      stats: {
        processed: results.processed,
        failed: results.failed
      },
      results: results.results
    });

  } catch (error) {
    console.error("❌ Cron Job Error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal Server Error", 
        message: error.message 
      }, 
      { status: 500 }
    );
  }
}