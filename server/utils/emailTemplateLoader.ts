/**
 * Email Template Loader Utility
 * Loads HTML templates and replaces placeholders with dynamic values
 */

import { promises as fs } from 'fs';
import { join } from 'path';

const EMAIL_TEMPLATES_DIR = join(process.cwd(), 'emailTemplates');

export interface TemplateVariables {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Load and process an email template
 * @param templateName - Name of the template file (e.g., 'creatorSignup' for 'creatorSignup.html')
 * @param variables - Object containing key-value pairs to replace placeholders
 * @returns Processed HTML string with all placeholders replaced
 */
export async function loadEmailTemplate(
  templateName: string,
  variables: TemplateVariables
): Promise<string> {
  try {
    // Ensure template name ends with .html
    const fileName = templateName.endsWith('.html') ? templateName : `${templateName}.html`;
    const templatePath = join(EMAIL_TEMPLATES_DIR, fileName);

    // Read the template file
    let html = await fs.readFile(templatePath, 'utf-8');

    // Replace all placeholders with actual values
    // Support both {{variable}} and {{#if variable}}...{{/if}} syntax
    html = replacePlaceholders(html, variables);

    return html;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(`Email template "${templateName}" not found`);
    }
    throw new Error(`Failed to load email template: ${error.message}`);
  }
}

/**
 * Replace placeholders in HTML template
 * Supports:
 * - Simple placeholders: {{variable}}
 * - Conditional blocks: {{#if variable}}...{{/if}}
 */
function replacePlaceholders(html: string, variables: TemplateVariables): string {
  let processed = html;

  // Replace conditional blocks first
  processed = processConditionalBlocks(processed, variables);

  // Replace simple placeholders
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    const replacement = value !== undefined && value !== null ? String(value) : '';
    processed = processed.replace(placeholder, replacement);
  }

  // Replace any remaining placeholders with empty string
  processed = processed.replace(/\{\{[\w]+\}\}/g, '');

  return processed;
}

/**
 * Process conditional blocks like {{#if variable}}...{{/if}}
 */
function processConditionalBlocks(html: string, variables: TemplateVariables): string {
  let processed = html;
  const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;

  processed = processed.replace(conditionalRegex, (match, varName, content) => {
    const value = variables[varName];
    // Show content if variable exists and is truthy
    if (value !== undefined && value !== null && value !== false && value !== '') {
      return content;
    }
    return '';
  });

  return processed;
}

/**
 * Get list of available email templates
 */
export async function getAvailableTemplates(): Promise<string[]> {
  try {
    const files = await fs.readdir(EMAIL_TEMPLATES_DIR);
    return files.filter(file => file.endsWith('.html')).map(file => file.replace('.html', ''));
  } catch (error) {
    console.error('Failed to read email templates directory:', error);
    return [];
  }
}
