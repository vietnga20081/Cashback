import { Job } from 'bullmq';
import nodemailer from 'nodemailer';
import { env } from '../../core/config/env';
import logger from '../../core/logger';
import prisma from '../../core/database';
import type { EmailJobData } from '../../core/queue';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

function renderTemplate(body: string, variables: Record<string, string | number> = {}): string {
  let rendered = body;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  }
  return rendered;
}

export async function processEmailJob(job: Job<EmailJobData>) {
  const { to, templateName, subject, html, variables } = job.data;

  let finalSubject = subject;
  let finalHtml = html;

  if (templateName) {
    const template = await prisma.emailTemplate.findUnique({ where: { name: templateName } });
    if (!template) {
      logger.error(`Email template "${templateName}" not found`);
      throw new Error(`Template not found: ${templateName}`);
    }
    finalSubject = template.subject;
    finalHtml = renderTemplate(template.body, variables);
  }

  try {
    await transporter.sendMail({
      from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`,
      to,
      subject: finalSubject,
      html: finalHtml,
    });

    logger.info(`Email sent to ${to} (template: ${templateName || 'custom'})`);
  } catch (err) {
    logger.error(`Failed to send email to ${to}:`, err);
    throw err;
  }
}
