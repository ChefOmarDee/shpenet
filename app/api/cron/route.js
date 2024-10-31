import { NextRequest, NextResponse } from "next/server";
import { Connection } from "@/app/_lib/mongo/models/connection";
import { connectToDatabase } from "@/app/_lib/mongo/connection/connection";
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
import path from "path";
import pLimit from 'p-limit';

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Create a rate limiter - limit to 5 concurrent operations
const limit = pLimit(5);

// Implement exponential backoff
async function withRetry(operation, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10 second delay
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function sendReminderEmail(connection) {
  const notesSection = connection.notes ? `<li><strong>Notes:</strong> ${connection.notes}</li>` : '';

  const msg = {
    from: "shpenetuserhelp@gmail.com",
    to: connection.email,
    subject: `Reminder: Connection with ${connection.firstName} ${connection.lastName}`,
    html: `
      <h2>Connection Reminder</h2>
      <p>Hello! This is a reminder about your connection with:</p>
      <ul>
        <li><strong>Name:</strong> ${connection.firstName} ${connection.lastName}</li>
        <li><strong>LinkedinURL:</strong> <a href="${connection.linkedinUrl}">${connection.linkedinUrl}</a></li>
        <li><strong>Position:</strong> ${connection.position}</li>
        <li><strong>Company:</strong> ${connection.companyName}</li>
        <li><strong>Company URL:</strong> <a href="${connection.companyURL}">${connection.companyURL}</a></li>
        ${notesSection}
      </ul>
      <p>Best regards,<br>Your Networking Assistant</p>
    `
  };

  return withRetry(async () => {
    try {
      await sgMail.send(msg);
      console.log(`Reminder email sent to ${connection.email}`);
      return true;
    } catch (error) {
      if (error.response?.body?.errors) {
        // Log specific SendGrid errors
        console.error('SendGrid errors:', error.response.body.errors);
        // Don't retry for permanent errors
        if (error.response.body.errors.some(e => e.message.includes('permanently rejected'))) {
          return false;
        }
      }
      throw error; // Re-throw for retry
    }
  });
}

async function processReminders() {
  let processedCount = 0;
  let failedCount = 0;

  try {
    // Use a batch size to process connections in chunks
    const batchSize = 50;
    let skip = 0;

    while (true) {
      const connectionsToRemind = await Connection.find({
        remindTime: { $lte: new Date() },
        reminded: false
      })
      .skip(skip)
      .limit(batchSize)
      .lean(); // Use lean() for better performance

      if (connectionsToRemind.length === 0) break;

      // Process connections in parallel with rate limiting
      const results = await Promise.allSettled(
        connectionsToRemind.map(connection => 
          limit(async () => {
            try {
              const emailSent = await sendReminderEmail(connection);
              
              if (emailSent) {
                await Connection.findByIdAndUpdate(connection._id, {
                  reminded: true,
                  remindTime: null
                });
                processedCount++;
              } else {
                failedCount++;
              }
            } catch (error) {
              console.error(`Error processing reminder for ${connection.email}:`, error);
              failedCount++;
            }
          })
        )
      );

      skip += batchSize;
    }

  } catch (error) {
    console.error('Error in processReminders:', error);
    throw error;
  }

  return { processedCount, failedCount };
}

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await connectToDatabase();

    const startTime = new Date();
    console.log("Cron Job Started at:", startTime);
    
    const { processedCount, failedCount } = await processReminders();
    
    const endTime = new Date();
    const duration = endTime - startTime;

    return NextResponse.json({
      message: "Cron Job Completed",
      startTime,
      endTime,
      duration: `${duration}ms`,
      processedCount,
      failedCount
    });

  } catch (error) {
    console.error("Cron Job Error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error.message
      },
      { status: 500 }
    );
  }
}
export const dynamic = "force-dynamic";


