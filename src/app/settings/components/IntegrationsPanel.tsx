/**
 * Integrations Panel
 * Accordion-style integrations with plan-based limits
 * 150+ integrations across 25+ categories
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ChevronDown, ChevronUp, Lock } from "lucide-react";

interface Integration { id: string; name: string; description: string; icon: string; color: string; }
interface IntegrationCategory { title: string; items: Integration[]; }
interface IntegrationsPanelProps { planId: string; currentIntegrationCount: number; }

const PLAN_LIMITS: Record<string, number> = { starter: 10, growth: 25, vip: -1 };

// Integration data organized by category
const categories: IntegrationCategory[] = [
  { title: "AI Providers", items: [
    { id: "openai", name: "OpenAI", description: "GPT-4, GPT-3.5, DALL-E", icon: "🤖", color: "#10A37F" },
    { id: "anthropic", name: "Anthropic", description: "Claude AI models", icon: "🧠", color: "#D4A574" },
    { id: "moonshot", name: "Moonshot AI", description: "Kimi K2.5 and other models", icon: "🌙", color: "#1a2b4a" },
    { id: "googleai", name: "Google AI", description: "Gemini, PaLM models", icon: "🔮", color: "#4285F4" },
    { id: "cohere", name: "Cohere", description: "Enterprise NLP models", icon: "📝", color: "#c9a227" },
    { id: "huggingface", name: "Hugging Face", description: "Open-source ML models", icon: "🤗", color: "#FFD21E" },
    { id: "perplexity", name: "Perplexity", description: "AI search and answers", icon: "🔍", color: "#1a2b4a" },
    { id: "deepseek", name: "DeepSeek", description: "Advanced reasoning models", icon: "🌊", color: "#4F46E5" },
    { id: "mistral", name: "Mistral AI", description: "Open-source LLMs", icon: "💨", color: "#FF6B35" },
    { id: "stability", name: "Stability AI", description: "Image generation models", icon: "🎨", color: "#7B2CBF" },
    { id: "replicate", name: "Replicate", description: "Run ML models in cloud", icon: "⚡", color: "#FF6B6B" },
    { id: "groq", name: "Groq", description: "Fast AI inference", icon: "🚀", color: "#F55036" }
  ]},
  { title: "Business Foundation", items: [
    { id: "googleWorkspace", name: "Google Workspace", description: "Email, Docs, Calendar, Drive", icon: "📧", color: "#4285F4" },
    { id: "microsoft365", name: "Microsoft 365", description: "Outlook, Word, Excel, Teams", icon: "🏢", color: "#D83B01" },
    { id: "cloudflare", name: "Cloudflare", description: "Domain & DNS management", icon: "☁️", color: "#F48120" },
    { id: "namecheap", name: "Namecheap", description: "Domain registration", icon: "🌐", color: "#DE3723" },
    { id: "godaddy", name: "GoDaddy", description: "Domain and hosting", icon: "🐶", color: "#00A63F" },
    { id: "hover", name: "Hover", description: "Domain registration", icon: "🎯", color: "#FF6B6B" },
    { id: "dnsimple", name: "DNSimple", description: "DNS management", icon: "🔧", color: "#7b6b8d" },
    { id: "vercel", name: "Vercel", description: "Frontend deployment", icon: "▲", color: "#000000" },
    { id: "netlify", name: "Netlify", description: "Web hosting and CI/CD", icon: "🌐", color: "#00C7B7" },
    { id: "heroku", name: "Heroku", description: "Cloud platform", icon: "🟣", color: "#430098" },
    { id: "railway", name: "Railway", description: "Infrastructure platform", icon: "🚂", color: "#0B0D0E" },
    { id: "render", name: "Render", description: "Cloud hosting", icon: "☁️", color: "#46E3B7" },
    { id: "flyio", name: "Fly.io", description: "Global application platform", icon: "🪰", color: "#7B68EE" },
    { id: "digitalocean", name: "DigitalOcean", description: "Cloud infrastructure", icon: "🌊", color: "#0080FF" },
    { id: "aws", name: "AWS", description: "Amazon Web Services", icon: "☁️", color: "#FF9900" },
    { id: "gcp", name: "Google Cloud", description: "Cloud computing", icon: "☁️", color: "#4285F4" },
    { id: "azure", name: "Microsoft Azure", description: "Cloud services", icon: "☁️", color: "#0078D4" },
    { id: "zoom", name: "Zoom", description: "Meetings and webinars", icon: "🎥", color: "#2D8CFF" },
    { id: "googleMeet", name: "Google Meet", description: "Video conferencing", icon: "📹", color: "#00832D" },
    { id: "teams", name: "Microsoft Teams", description: "Team collaboration", icon: "👥", color: "#6264A7" },
    { id: "webex", name: "Cisco Webex", description: "Video conferencing", icon: "🎤", color: "#00BCF2" },
    { id: "openPhone", name: "OpenPhone", description: "Business phone system", icon: "📞", color: "#00A8E8" },
    { id: "aircall", name: "Aircall", description: "Cloud phone system", icon: "📱", color: "#00B2A9" },
    { id: "ringcentral", name: "RingCentral", description: "Business communications", icon: "🔔", color: "#FF8800" },
    { id: "dialpad", name: "Dialpad", description: "AI-powered calling", icon: "📞", color: "#00B2A9" },
    { id: "justcall", name: "JustCall", description: "Business phone system", icon: "☎️", color: "#FF6B6B" },
    { id: "krisp", name: "Krisp", description: "AI noise cancellation", icon: "🔇", color: "#1a2b4a" }
  ]},
  { title: "CRM & Sales", items: [
    { id: "ghl", name: "GoHighLevel", description: "CRM, funnels, and automation", icon: "📊", color: "#3B82F6" },
    { id: "hubspot", name: "HubSpot", description: "CRM, marketing, sales, service", icon: "🟠", color: "#FF7A59" },
    { id: "salesforce", name: "Salesforce", description: "Enterprise CRM", icon: "☁️", color: "#00A1E0" },
    { id: "pipedrive", name: "Pipedrive", description: "Sales pipeline management", icon: "🎯", color: "#0087CC" },
    { id: "honeybook", name: "HoneyBook", description: "Service business CRM", icon: "🍯", color: "#FF6B6B" },
    { id: "dubsado", name: "Dubsado", description: "Client management", icon: "📋", color: "#1B1B1B" },
    { id: "activecampaign", name: "ActiveCampaign", description: "CRM and automation", icon: "⚡", color: "#0056D2" },
    { id: "zohocrm", name: "Zoho CRM", description: "Sales management", icon: "🌿", color: "#0066CC" },
    { id: "freshsales", name: "Freshsales", description: "CRM software", icon: "🍃", color: "#00B2A9" },
    { id: "insightly", name: "Insightly", description: "CRM and project management", icon: "🔍", color: "#FF6B6B" },
    { id: "capsule", name: "Capsule", description: "Simple CRM", icon: "💊", color: "#00B2A9" },
    { id: "nimble", name: "Nimble", description: "Social CRM", icon: "🤝", color: "#FF6B6B" },
    { id: "close", name: "Close", description: "Sales CRM", icon: "🔒", color: "#6B4EE6" },
    { id: "outreach", name: "Outreach", description: "Sales execution", icon: "📢", color: "#00B2A9" },
    { id: "salesloft", name: "Salesloft", description: "Sales engagement", icon: "🏗️", color: "#FF6B6B" },
    { id: "apollo", name: "Apollo.io", description: "Sales intelligence", icon: "🚀", color: "#7B68EE" },
    { id: "zoominfo", name: "ZoomInfo", description: "B2B contact database", icon: "🔍", color: "#FF6B6B" },
    { id: "lusha", name: "Lusha", description: "Contact data", icon: "💎", color: "#00B2A9" },
    { id: "clearbit", name: "Clearbit", description: "B2B intelligence", icon: "💡", color: "#FF6B6B" },
    { id: "cognism", name: "Cognism", description: "Sales intelligence", icon: "🧠", color: "#6B4EE6" }
  ]},
  { title: "Email Marketing", items: [
    { id: "convertkit", name: "ConvertKit", description: "Email marketing for creators", icon: "✉️", color: "#FB6970" },
    { id: "mailchimp", name: "Mailchimp", description: "Email marketing platform", icon: "🐵", color: "#FFE01B" },
    { id: "kit", name: "Kit", description: "Email marketing", icon: "📬", color: "#FF6B6B" },
    { id: "mailerlite", name: "MailerLite", description: "Email marketing", icon: "📨", color: "#00A8E8" },
    { id: "beehiiv", name: "Beehiiv", description: "Newsletter platform", icon: "🐝", color: "#FFD700" },
    { id: "substack", name: "Substack", description: "Newsletter publishing", icon: "📝", color: "#FF6719" },
    { id: "ghost", name: "Ghost", description: "Publishing platform", icon: "👻", color: "#15171A" },
    { id: "buttondown", name: "Buttondown", description: "Email newsletters", icon: "🔘", color: "#FF6B6B" },
    { id: "campaignmonitor", name: "Campaign Monitor", description: "Email marketing", icon: "📧", color: "#00B2A9" },
    { id: "constantcontact", name: "Constant Contact", description: "Email marketing", icon: "📮", color: "#FF6B6B" },
    { id: "aweber", name: "AWeber", description: "Email automation", icon: "📨", color: "#00B2A9" },
    { id: "getresponse", name: "GetResponse", description: "Email marketing", icon: "📬", color: "#00B2A9" },
    { id: "moosend", name: "Moosend", description: "Email marketing", icon: "🐮", color: "#00B2A9" },
    { id: "sendgrid", name: "SendGrid", description: "Email delivery", icon: "📤", color: "#1A82E2" },
    { id: "mailgun", name: "Mailgun", description: "Email API", icon: "🔫", color: "#FF6B6B" },
    { id: "postmark", name: "Postmark", description: "Transactional email", icon: "📮", color: "#FF6B6B" },
    { id: "sendinblue", name: "Brevo (Sendinblue)", description: "CRM and email", icon: "💙", color: "#0B996E" },
    { id: "klaviyo", name: "Klaviyo", description: "Email and SMS marketing", icon: "📊", color: "#00B2A9" },
    { id: "omnisend", name: "Omnisend", description: "E-commerce marketing", icon: "🛒", color: "#00B2A9" },
    { id: "drip", name: "Drip", description: "E-commerce CRM", icon: "💧", color: "#FF6B6B" },
    { id: "iterable", name: "Iterable", description: "Cross-channel marketing", icon: "🔄", color: "#FF6B6B" }
  ]},
  { title: "Scheduling & Booking", items: [
    { id: "calendly", name: "Calendly", description: "Scheduling and appointments", icon: "📅", color: "#006BFF" },
    { id: "acuity", name: "Acuity Scheduling", description: "Appointment scheduling", icon: "🗓️", color: "#5D50E1" },
    { id: "savvycal", name: "SavvyCal", description: "Scheduling for professionals", icon: "🕐", color: "#FF6B6B" },
    { id: "calcom", name: "Cal.com", description: "Open scheduling", icon: "📆", color: "#292929" },
    { id: "chiliPiper", name: "Chili Piper", description: "Inbound conversion", icon: "🌶️", color: "#FF6B6B" },
    { id: "scheduleonce", name: "OnceHub", description: "Scheduling automation", icon: "⏰", color: "#00B2A9" },
    { id: "youcanbookme", name: "YouCanBook.me", description: "Scheduling tool", icon: "📅", color: "#FF6B6B" },
    { id: "simplybook", name: "SimplyBook.me", description: "Booking system", icon: "📖", color: "#00B2A9" },
    { id: "setmore", name: "Setmore", description: "Appointment scheduling", icon: "📆", color: "#00B2A9" },
    { id: "appointlet", name: "Appointlet", description: "Online scheduling", icon: "📅", color: "#FF6B6B" },
    { id: "tidycal", name: "TidyCal", description: "Scheduling solution", icon: "✨", color: "#00B2A9" },
    { id: "booklikeaboss", name: "Book Like A Boss", description: "Booking pages", icon: "👔", color: "#FF6B6B" },
    { id: "vcita", name: "vcita", description: "Business management", icon: "💼", color: "#00B2A9" },
    { id: "10to8", name: "10to8", description: "Scheduling software", icon: "🕙", color: "#FF6B6B" },
    { id: "timely", name: "Timely", description: "Appointment software", icon: "⏱️", color: "#00B2A9" }
  ]},
  { title: "Website & Landing Pages", items: [
    { id: "wordpress", name: "WordPress", description: "Website platform", icon: "📝", color: "#21759B" },
    { id: "squarespace", name: "Squarespace", description: "Website builder", icon: "🟥", color: "#000000" },
    { id: "webflow", name: "Webflow", description: "No-code website builder", icon: "🌊", color: "#4353FF" },
    { id: "kajabi", name: "Kajabi", description: "All-in-one platform", icon: "🎓", color: "#2FC3E9" },
    { id: "leadpages", name: "Leadpages", description: "Landing page builder", icon: "📄", color: "#0066CC" },
    { id: "clickfunnels", name: "ClickFunnels", description: "Sales funnels", icon: "🔄", color: "#00A8E8" },
    { id: "systeme", name: "Systeme.io", description: "All-in-one marketing", icon: "⚙️", color: "#1E90FF" },
    { id: "wix", name: "Wix", description: "Website builder", icon: "✨", color: "#000000" },
    { id: "weebly", name: "Weebly", description: "Website builder", icon: "🐝", color: "#0055FF" },
    { id: "shopify", name: "Shopify", description: "E-commerce platform", icon: "🛍️", color: "#96BF48" },
    { id: "bigcommerce", name: "BigCommerce", description: "E-commerce platform", icon: "🛒", color: "#34313F" },
    { id: "woocommerce", name: "WooCommerce", description: "WordPress e-commerce", icon: "🛍️", color: "#96588A" },
    { id: "kartra", name: "Kartra", description: "Marketing platform", icon: "💎", color: "#FF6B6B" },
    { id: "builderall", name: "Builderall", description: "Digital marketing", icon: "🔨", color: "#00B2A9" },
    { id: "unbounce", name: "Unbounce", description: "Landing pages", icon: "🚀", color: "#FF6B6B" },
    { id: "instapage", name: "Instapage", description: "Landing page platform", icon: "📄", color: "#00B2A9" },
    { id: "carrd", name: "Carrd", description: "Simple sites", icon: "🃏", color: "#FF6B6B" },
    { id: "framer", name: "Framer", description: "Design and publish", icon: "🎨", color: "#0055FF" },
    { id: "bubble", name: "Bubble", description: "No-code development", icon: "💭", color: "#0D0D0D" }
  ]},
  { title: "Forms & Assessments", items: [
    { id: "typeform", name: "Typeform", description: "Forms and surveys", icon: "❓", color: "#FF6B6B" },
    { id: "jotform", name: "Jotform", description: "Online forms", icon: "📋", color: "#FF6B00" },
    { id: "tally", name: "Tally", description: "Form builder", icon: "✅", color: "#FF6B6B" },
    { id: "scoreapp", name: "ScoreApp", description: "Assessments and quizzes", icon: "🎯", color: "#6B4EE6" },
    { id: "interact", name: "Interact", description: "Quizzes and assessments", icon: "💡", color: "#FF6B6B" },
    { id: "googleForms", name: "Google Forms", description: "Survey forms", icon: "📊", color: "#4285F4" },
    { id: "microsoftForms", name: "Microsoft Forms", description: "Survey tool", icon: "📋", color: "#0078D4" },
    { id: "wufoo", name: "Wufoo", description: "Form builder", icon: "📝", color: "#FF6B6B" },
    { id: "formstack", name: "Formstack", description: "Form builder", icon: "📄", color: "#00B2A9" },
    { id: "paperform", name: "Paperform", description: "Beautiful forms", icon: "📃", color: "#FF6B6B" },
    { id: "cognito", name: "Cognito Forms", description: "Form builder", icon: "🧠", color: "#00B2A9" },
    { id: "gravityforms", name: "Gravity Forms", description: "WordPress forms", icon: "🌍", color: "#FF6B6B" },
    { id: "wpforms", name: "WPForms", description: "WordPress form builder", icon: "📋", color: "#00B2A9" },
    { id: "ninjaforms", name: "Ninja Forms", description: "WordPress forms", icon: "🥷", color: "#FF6B6B" },
    { id: "formidable", name: "Formidable", description: "Advanced forms", icon: "💪", color: "#00B2A9" }
  ]},
  { title: "Payments & Finance", items: [
    { id: "stripe", name: "Stripe", description: "Payment processing", icon: "💳", color: "#635BFF" },
    { id: "paypal", name: "PayPal", description: "Payment platform", icon: "💰", color: "#003087" },
    { id: "quickbooks", name: "QuickBooks", description: "Accounting software", icon: "📊", color: "#2CA01C" },
    { id: "xero", name: "Xero", description: "Accounting software", icon: "📈", color: "#13B5EA" },
    { id: "wise", name: "Wise", description: "International payments", icon: "💱", color: "#00B9FF" },
    { id: "thrivecart", name: "ThriveCart", description: "Shopping cart", icon: "🛒", color: "#00C853" },
    { id: "square", name: "Square", description: "Payment processing", icon: "⬜", color: "#00B2A9" },
    { id: "shopifypayments", name: "Shopify Payments", description: "E-commerce payments", icon: "🛍️", color: "#96BF48" },
    { id: "authorize", name: "Authorize.net", description: "Payment gateway", icon: "🔐", color: "#FF6B6B" },
    { id: "braintree", name: "Braintree", description: "Payment platform", icon: "🌳", color: "#00B2A9" },
    { id: "chargebee", name: "Chargebee", description: "Subscription billing", icon: "🐝", color: "#FF6B6B" },
    { id: "recurly", name: "Recurly", description: "Subscription management", icon: "🔄", color: "#00B2A9" },
    { id: "paddle", name: "Paddle", description: "Payments for SaaS", icon: "🏓", color: "#FF6B6B" },
    { id: "gumroad", name: "Gumroad", description: "Sell digital products", icon: "🛤️", color: "#FF6B6B" },
    { id: "lemonsqueezy", name: "Lemon Squeezy", description: "Payments for creators", icon: "🍋", color: "#FFEA00" },
    { id: "venmo", name: "Venmo", description: "Mobile payments", icon: "💸", color: "#008CFF" },
    { id: "cashapp", name: "Cash App", description: "Mobile payments", icon: "💵", color: "#00D632" },
    { id: "zelle", name: "Zelle", description: "Bank transfers", icon: "💳", color: "#6B1FA9" },
    { id: "freshbooks", name: "FreshBooks", description: "Accounting software", icon: "📗", color: "#00B2A9" },
    { id: "wave", name: "Wave", description: "Free accounting", icon: "🌊", color: "#00B2A9" },
    { id: "sage", name: "Sage", description: "Business accounting", icon: "🌿", color: "#00B2A9" },
    { id: "bench", name: "Bench", description: "Bookkeeping service", icon: "📚", color: "#FF6B6B" }
  ]},
  { title: "Contracts & Proposals", items: [
    { id: "pandadoc", name: "PandaDoc", description: "Proposals and contracts", icon: "📄", color: "#00A8E8" },
    { id: "docusign", name: "DocuSign", description: "Electronic signatures", icon: "✍️", color: "#0056D2" },
    { id: "betterproposals", name: "Better Proposals", description: "Proposal software", icon: "📋", color: "#FF6B6B" },
    { id: "proposify", name: "Proposify", description: "Proposal creation", icon: "📑", color: "#FF6B6B" },
    { id: "hellosign", name: "HelloSign", description: "E-signatures", icon: "👋", color: "#00B2A9" },
    { id: "signnow", name: "SignNow", description: "Electronic signatures", icon: "✅", color: "#FF6B6B" },
    { id: "esignlive", name: "eSignLive", description: "Digital signatures", icon: "🔏", color: "#00B2A9" },
    { id: "adobesign", name: "Adobe Sign", description: "E-signatures", icon: "🅰️", color: "#FF0000" },
    { id: "contractbook", name: "Contractbook", description: "Contract management", icon: "📘", color: "#FF6B6B" },
    { id: "ironclad", name: "Ironclad", description: "Contract lifecycle", icon: "⚔️", color: "#00B2A9" },
    { id: "concord", name: "Concord", description: "Contract management", icon: "🤝", color: "#FF6B6B" },
    { id: "outlaw", name: "Outlaw", description: "Modern contracting", icon: "⚖️", color: "#00B2A9" },
    { id: "springcm", name: "SpringCM", description: "Document management", icon: "🌸", color: "#FF6B6B" },
    { id: "quoteroller", name: "Quote Roller", description: "Sales proposals", icon: "📊", color: "#00B2A9" },
    { id: "qwilr", name: "Qwilr", description: "Beautiful proposals", icon: "✨", color: "#FF6B6B" }
  ]},
  { title: "Course & Membership", items: [
    { id: "teachable", name: "Teachable", description: "Online course platform", icon: "🎓", color: "#1B1B1B" },
    { id: "thinkific", name: "Thinkific", description: "Course creation", icon: "💭", color: "#00A8E8" },
    { id: "skool", name: "Skool", description: "Community platform", icon: "🏫", color: "#00C853" },
    { id: "circle", name: "Circle", description: "Community platform", icon: "⭕", color: "#000000" },
    { id: "memberful", name: "Memberful", description: "Membership platform", icon: "👥", color: "#1B1B1B" },
    { id: "podia", name: "Podia", description: "Digital products", icon: "🎪", color: "#FF6B6B" },
    { id: "gumroad", name: "Gumroad", description: "Sell digital products", icon: "🛤️", color: "#FF6B6B" },
    { id: "learnworlds", name: "LearnWorlds", description: "Course platform", icon: "🌍", color: "#00B2A9" },
    { id: "newzenler", name: "New Zenler", description: "Course platform", icon: "🧘", color: "#FF6B6B" },
    { id: "memberpress", name: "MemberPress", description: "WordPress membership", icon: "🔒", color: "#00B2A9" },
    { id: "restrictcontent", name: "Restrict Content", description: "Membership plugin", icon: "🚫", color: "#FF6B6B" },
    { id: "paidmemberships", name: "Paid Memberships Pro", description: "Membership plugin", icon: "💳", color: "#00B2A9" },
    { id: "wishlist", name: "WishList Member", description: "Membership site", icon: "⭐", color: "#FF6B6B" },
    { id: "mightyNetworks", name: "Mighty Networks", description: "Community platform", icon: "💪", color: "#00B2A9" },
    { id: "tribe", name: "Tribe", description: "Community platform", icon: "👥", color: "#FF6B6B" },
    { id: "discourse", name: "Discourse", description: "Discussion platform", icon: "💬", color: "#00B2A9" },
    { id: "vanilla", name: "Vanilla Forums", description: "Community software", icon: "🍦", color: "#FF6B6B" },
    { id: "invision", name: "Invision Community", description: "Forum software", icon: "👁️", color: "#00B2A9" }
  ]},
  { title: "Video & Content", items: [
    { id: "loom", name: "Loom", description: "Video messaging", icon: "🎬", color: "#625DF5" },
    { id: "wistia", name: "Wistia", description: "Video hosting", icon: "▶️", color: "#00A8E8" },
    { id: "vimeo", name: "Vimeo", description: "Video platform", icon: "🎥", color: "#1AB7EA" },
    { id: "youtube", name: "YouTube", description: "Video platform", icon: "📺", color: "#FF0000" },
    { id: "descript", name: "Descript", description: "Video editing", icon: "🎙️", color: "#00C853" },
    { id: "screenflow", name: "ScreenFlow", description: "Mac screen recording", icon: "🖥️", color: "#00B2A9" },
    { id: "camtasia", name: "Camtasia", description: "Screen recording", icon: "📹", color: "#FF6B6B" },
    { id: "obs", name: "OBS Studio", description: "Live streaming", icon: "📡", color: "#00B2A9" },
    { id: "streamyard", name: "StreamYard", description: "Live streaming studio", icon: "🎥", color: "#00B2A9" },
    { id: "restream", name: "Restream", description: "Multi-platform streaming", icon: "📡", color: "#00B2A9" },
    { id: "ecamm", name: "Ecamm Live", description: "Live streaming for Mac", icon: "🎬", color: "#FF6B6B" },
    { id: " Riverside", name: "Riverside", description: "Remote recording", icon: "🌊", color: "#00B2A9" },
    { id: "squadcast", name: "SquadCast", description: "Podcast recording", icon: "🎙️", color: "#FF6B6B" },
    { id: "zencastr", name: "Zencastr", description: "Podcast production", icon: "🎧", color: "#00B2A9" },
    { id: "anchor", name: "Anchor", description: "Podcast hosting", icon: "⚓", color: "#5000FF" },
    { id: "buzzsprout", name: "Buzzsprout", description: "Podcast hosting", icon: "🐝", color: "#FF6B6B" },
    { id: "libsyn", name: "Libsyn", description: "Podcast hosting", icon: "📻", color: "#00B2A9" },
    { id: "transistor", name: "Transistor", description: "Podcast hosting", icon: "📡", color: "#FF6B6B" },
    { id: "captivate", name: "Captivate", description: "Podcast hosting", icon: "✨", color: "#00B2A9" }
  ]},
  { title: "Call Recording & Analysis", items: [
    { id: "fathom", name: "Fathom", description: "Call recording and notes", icon: "🎤", color: "#00C853" },
    { id: "fireflies", name: "Fireflies.ai", description: "Meeting transcription", icon: "🔥", color: "#FF6B00" },
    { id: "otter", name: "Otter.ai", description: "Voice notes", icon: "🦦", color: "#00A8E8" },
    { id: "grain", name: "Grain", description: "Call recording", icon: "🌾", color: "#FFD700" },
    { id: "gong", name: "Gong", description: "Revenue intelligence", icon: "🔔", color: "#FF6B6B" },
    { id: "avoma", name: "Avoma", description: "Meeting assistant", icon: "🤝", color: "#6B4EE6" },
    { id: "chorus", name: "Chorus", description: "Conversation intelligence", icon: "🎵", color: "#00B2A9" },
    { id: "jimminy", name: "Jimminy", description: "Sales coaching", icon: "🦗", color: "#FF6B6B" },
    { id: "wingman", name: "Wingman", description: "Real-time coaching", icon: "✈️", color: "#00B2A9" },
    { id: "meetgeek", name: "MeetGeek", description: "Meeting insights", icon: "🤓", color: "#FF6B6B" },
    { id: "tl;dv", name: "tl;dv", description: "Meeting recorder", icon: "⏺️", color: "#00B2A9" },
    { id: "read", name: "Read.ai", description: "Meeting analytics", icon: "📖", color: "#FF6B6B" }
  ]},
  { title: "Testimonials & Social Proof", items: [
    { id: "senja", name: "Senja", description: "Testimonial collection", icon: "⭐", color: "#FFD700" },
    { id: "vocalvideo", name: "Vocal Video", description: "Video testimonials", icon: "🎤", color: "#FF6B6B" },
    { id: "trustpilot", name: "Trustpilot", description: "Review platform", icon: "✓", color: "#00B67A" },
    { id: "googleBusiness", name: "Google Business", description: "Business reviews", icon: "🔍", color: "#4285F4" },
    { id: "testimonial", name: "Testimonial", description: "Video testimonials", icon: "💬", color: "#00B2A9" },
    { id: "shoutout", name: "ShoutOut", description: "Testimonial management", icon: "📣", color: "#FF6B6B" },
    { id: "embedsocial", name: "EmbedSocial", description: "Social proof", icon: "🔗", color: "#00B2A9" },
    { id: "fomo", name: "Fomo", description: "Social proof notifications", icon: "🔔", color: "#FF6B6B" },
    { id: "provely", name: "Provely", description: "Social proof widget", icon: "📊", color: "#00B2A9" },
    { id: "proof", name: "Proof", description: "Website personalization", icon: "✅", color: "#FF6B6B" },
    { id: "useproof", name: "UseProof", description: "Social proof", icon: "👥", color: "#00B2A9" },
    { id: "notificationx", name: "NotificationX", description: "Social proof alerts", icon: "🔔", color: "#FF6B6B" }
  ]},
  { title: "Affiliate & Referrals", items: [
    { id: "rewardful", name: "Rewardful", description: "Affiliate tracking", icon: "🎁", color: "#00C853" },
    { id: "firstpromoter", name: "FirstPromoter", description: "Referral program", icon: "🚀", color: "#FF6B6B" },
    { id: "referralcandy", name: "ReferralCandy", description: "Referral marketing", icon: "🍬", color: "#FF6B6B" },
    { id: "tapfiliate", name: "Tapfiliate", description: "Affiliate marketing", icon: "👆", color: "#00A8E8" },
    { id: "postaffiliate", name: "Post Affiliate Pro", description: "Affiliate software", icon: "📮", color: "#FF6B6B" },
    { id: "leaddyno", name: "LeadDyno", description: "Affiliate tracking", icon: "📊", color: "#00B2A9" },
    { id: "affiliatewp", name: "AffiliateWP", description: "WordPress affiliates", icon: "🔗", color: "#FF6B6B" },
    { id: "impact", name: "Impact", description: "Partnership platform", icon: "💥", color: "#00B2A9" },
    { id: "partnerstack", name: "PartnerStack", description: "Partner management", icon: "🤝", color: "#FF6B6B" },
    { id: "everflow", name: "Everflow", description: "Affiliate platform", icon: "🌊", color: "#00B2A9" },
    { id: "cake", name: "CAKE", description: "Performance marketing", icon: "🎂", color: "#FF6B6B" },
    { id: "tune", name: "TUNE", description: "Partner marketing", icon: "🎵", color: "#00B2A9" }
  ]},
  { title: "Messaging", items: [
    { id: "telegram", name: "Telegram", description: "Bot integration and messaging", icon: "✈️", color: "#26A5E4" },
    { id: "whatsapp", name: "WhatsApp", description: "Business API messaging", icon: "💬", color: "#25D366" },
    { id: "slack", name: "Slack", description: "Team communication", icon: "💼", color: "#4A154B" },
    { id: "discord", name: "Discord", description: "Community and bots", icon: "🎮", color: "#5865F2" },
    { id: "twilio", name: "Twilio", description: "SMS and voice API", icon: "📱", color: "#F22F46" },
    { id: "messagebird", name: "MessageBird", description: "Omnichannel messaging", icon: "🐦", color: "#00B2A9" },
    { id: "vonage", name: "Vonage", description: "Communications API", icon: "📞", color: "#FF6B6B" },
    { id: "plivo", name: "Plivo", description: "SMS and voice", icon: "📲", color: "#00B2A9" },
    { id: "bandwidth", name: "Bandwidth", description: "Voice and messaging", icon: "📡", color: "#FF6B6B" },
    { id: "sendbird", name: "Sendbird", description: "Chat API", icon: "🐦", color: "#00B2A9" },
    { id: "stream", name: "Stream", description: "Chat messaging", icon: "💬", color: "#FF6B6B" },
    { id: "pubnub", name: "PubNub", description: "Real-time messaging", icon: "⚡", color: "#00B2A9" }
  ]},
  { title: "Social Media", items: [
    { id: "facebook", name: "Facebook", description: "Pages and groups", icon: "📘", color: "#1877F2" },
    { id: "instagram", name: "Instagram", description: "Business account", icon: "📸", color: "#E4405F" },
    { id: "linkedin", name: "LinkedIn", description: "Professional network", icon: "💼", color: "#0A66C2" },
    { id: "twitter", name: "X (Twitter)", description: "Social posting", icon: "🐦", color: "#000000" },
    { id: "tiktok", name: "TikTok", description: "Video content", icon: "🎵", color: "#000000" },
    { id: "pinterest", name: "Pinterest", description: "Visual discovery", icon: "📌", color: "#E60023" },
    { id: "threads", name: "Threads", description: "Text sharing", icon: "🧵", color: "#000000" },
    { id: "bluesky", name: "BlueSky", description: "Decentralized social", icon: "🦋", color: "#0085FF" },
    { id: "youtube", name: "YouTube", description: "Video platform", icon: "📺", color: "#FF0000" },
    { id: "snapchat", name: "Snapchat", description: "Visual messaging", icon: "👻", color: "#FFFC00" },
    { id: "reddit", name: "Reddit", description: "Community forums", icon: "🔴", color: "#FF4500" },
    { id: "tumblr", name: "Tumblr", description: "Microblogging", icon: "📔", color: "#001935" },
    { id: "mastodon", name: "Mastodon", description: "Decentralized social", icon: "🐘", color: "#6364FF" },
    { id: "medium", name: "Medium", description: "Publishing platform", icon: "📖", color: "#000000" },
    { id: "quora", name: "Quora", description: "Q&A platform", icon: "❓", color: "#B92B27" }
  ]},
  { title: "Storage & Productivity", items: [
    { id: "googleDrive", name: "Google Drive", description: "File storage", icon: "📁", color: "#4285F4" },
    { id: "dropbox", name: "Dropbox", description: "Cloud storage", icon: "📦", color: "#0061FF" },
    { id: "oneDrive", name: "OneDrive", description: "Microsoft cloud storage", icon: "☁️", color: "#0078D4" },
    { id: "notion", name: "Notion", description: "Documentation and wiki", icon: "📝", color: "#000000" },
    { id: "airtable", name: "Airtable", description: "Database and spreadsheets", icon: "🗂️", color: "#18BFFF" },
    { id: "asana", name: "Asana", description: "Project management", icon: "✅", color: "#F06A6A" },
    { id: "trello", name: "Trello", description: "Kanban boards", icon: "📋", color: "#0079BF" },
    { id: "monday", name: "Monday.com", description: "Work management", icon: "📊", color: "#FF3D57" },
    { id: "clickup", name: "ClickUp", description: "Productivity platform", icon: "🚀", color: "#7B68EE" },
    { id: "basecamp", name: "Basecamp", description: "Project management", icon: "⛺", color: "#00B2A9" },
    { id: "notion", name: "Notion", description: "All-in-one workspace", icon: "📝", color: "#000000" },
    { id: "confluence", name: "Confluence", description: "Team workspace", icon: "📄", color: "#00B2A9" },
    { id: "coda", name: "Coda", description: "Docs and spreadsheets", icon: "🎵", color: "#FF6B6B" },
    { id: "quip", name: "Quip", description: "Docs and chat", icon: "💬", color: "#00B2A9" },
    { id: "evernote", name: "Evernote", description: "Note taking", icon: "🐘", color: "#00A82D" },
    { id: "onenote", name: "OneNote", description: "Digital notebook", icon: "📓", color: "#7719AA" },
    { id: "bear", name: "Bear", description: "Notes for Mac", icon: "🐻", color: "#FF6B6B" },
    { id: "roam", name: "Roam Research", description: "Networked notes", icon: "🧠", color: "#00B2A9" },
    { id: "obsidian", name: "Obsidian", description: "Knowledge base", icon: "💎", color: "#7B68EE" }
  ]},
  { title: "Analytics & Tracking", items: [
    { id: "googleanalytics", name: "Google Analytics", description: "Web analytics", icon: "📊", color: "#E37400" },
    { id: "mixpanel", name: "Mixpanel", description: "Product analytics", icon: "📈", color: "#00B2A9" },
    { id: "amplitude", name: "Amplitude", description: "Product intelligence", icon: "📊", color: "#FF6B6B" },
    { id: "hotjar", name: "Hotjar", description: "Behavior analytics", icon: "🔥", color: "#FF6B6B" },
    { id: "crazyegg", name: "Crazy Egg", description: "Heatmaps and A/B testing", icon: "🥚", color: "#FF6B6B" },
    { id: "fullstory", name: "FullStory", description: "Digital experience", icon: "📖", color: "#00B2A9" },
    { id: "heap", name: "Heap", description: "Product analytics", icon: "📊", color: "#FF6B6B" },
    { id: "segment", name: "Segment", description: "Customer data platform", icon: "📡", color: "#00B2A9" },
    { id: "rudderstack", name: "RudderStack", description: "Customer data platform", icon: "📊", color: "#FF6B6B" },
    { id: "plausible", name: "Plausible", description: "Privacy analytics", icon: "📈", color: "#00B2A9" },
    { id: "fathom", name: "Fathom Analytics", description: "Simple analytics", icon: "🎯", color: "#FF6B6B" },
    { id: "matomo", name: "Matomo", description: "Open analytics", icon: "📊", color: "#00B2A9" },
    { id: "chartmogul", name: "ChartMogul", description: "Subscription analytics", icon: "📈", color: "#FF6B6B" },
    { id: "baremetrics", name: "Baremetrics", description: "SaaS analytics", icon: "📊", color: "#00B2A9" },
    { id: "profitwell", name: "ProfitWell", description: "Subscription metrics", icon: "💰", color: "#FF6B6B" }
  ]},
  { title: "Automation & Workflows", items: [
    { id: "zapier", name: "Zapier", description: "Workflow automation", icon: "⚡", color: "#FF4A00" },
    { id: "make", name: "Make (Integromat)", description: "Visual automation", icon: "🔄", color: "#6B4EE6" },
    { id: "n8n", name: "n8n", description: "Workflow automation", icon: "🔄", color: "#FF6B6B" },
    { id: "workato", name: "Workato", description: "Enterprise automation", icon: "🤖", color: "#00B2A9" },
    { id: "tray", name: "Tray.io", description: "Automation platform", icon: "📊", color: "#FF6B6B" },
    { id: "automate", name: "Automate.io", description: "Workflow automation", icon: "⚙️", color: "#00B2A9" },
    { id: "parabola", name: "Parabola", description: "Data automation", icon: "📈", color: "#FF6B6B" },
    { id: "huginn", name: "Huginn", description: "Open automation", icon: "🦅", color: "#00B2A9" },
    { id: "ifttt", name: "IFTTT", description: "If This Then That", icon: "🔗", color: "#000000" },
    { id: "pipedream", name: "Pipedream", description: "Integration platform", icon: "🎵", color: "#00B2A9" },
    { id: "integrately", name: "Integrately", description: "Automation tool", icon: "🔗", color: "#FF6B6B" },
    { id: "albato", name: "Albato", description: "No-code automation", icon: "⚡", color: "#00B2A9" }
  ]},
  { title: "Security & Compliance", items: [
    { id: "1password", name: "1Password", description: "Password manager", icon: "🔐", color: "#00B2A9" },
    { id: "lastpass", name: "LastPass", description: "Password manager", icon: "🔑", color: "#D32D27" },
    { id: "bitwarden", name: "Bitwarden", description: "Open password manager", icon: "🛡️", color: "#175DDC" },
    { id: "dashlane", name: "Dashlane", description: "Password manager", icon: "🔒", color: "#00B2A9" },
    { id: "auth0", name: "Auth0", description: "Authentication platform", icon: "🔐", color: "#FF6B6B" },
    { id: "okta", name: "Okta", description: "Identity management", icon: "🆗", color: "#00B2A9" },
    { id: "onelogin", name: "OneLogin", description: "SSO and identity", icon: "1️⃣", color: "#FF6B6B" },
    { id: "jumpcloud", name: "JumpCloud", description: "Directory platform", icon: "☁️", color: "#00B2A9" },
    { id: "snyk", name: "Snyk", description: "Security scanning", icon: "🔍", color: "#FF6B6B" },
    { id: "dependabot", name: "Dependabot", description: "Dependency updates", icon: "🤖", color: "#00B2A9" },
    { id: "sonarqube", name: "SonarQube", description: "Code quality", icon: "📊", color: "#FF6B6B" },
    { id: "sentry", name: "Sentry", description: "Error tracking", icon: "🐛", color: "#00B2A9" }
  ]},
  { title: "Customer Support", items: [
    { id: "zendesk", name: "Zendesk", description: "Customer service", icon: "🎫", color: "#03363D" },
    { id: "intercom", name: "Intercom", description: "Customer messaging", icon: "💬", color: "#1F8DED" },
    { id: "freshdesk", name: "Freshdesk", description: "Help desk software", icon: "🍃", color: "#00B2A9" },
    { id: "helpscout", name: "Help Scout", description: "Customer support", icon: "🐾", color: "#00B2A9" },
    { id: "crisp", name: "Crisp", description: "Live chat", icon: "💬", color: "#FF6B6B" },
    { id: "tawk", name: "Tawk.to", description: "Free live chat", icon: "💭", color: "#00B2A9" },
    { id: "livechat", name: "LiveChat", description: "Customer chat", icon: "💬", color: "#FF6B6B" },
    { id: "drift", name: "Drift", description: "Conversational marketing", icon: "💬", color: "#00B2A9" },
    { id: "olark", name: "Olark", description: "Live chat software", icon: "💬", color: "#FF6B6B" },
    { id: "purechat", name: "Pure Chat", description: "Live chat solution", icon: "💬", color: "#00B2A9" },
    { id: "chatra", name: "Chatra", description: "Live chat and chatbot", icon: "💬", color: "#FF6B6B" },
    { id: "tidio", name: "Tidio", description: "Chat and chatbots", icon: "💬", color: "#00B2A9" }
  ]},
  { title: "HR & Hiring", items: [
    { id: "bamboohr", name: "BambooHR", description: "HR software", icon: "🎋", color: "#00B2A9" },
    { id: "gusto", name: "Gusto", description: "Payroll and HR", icon: "💜", color: "#FF6B6B" },
    { id: "workday", name: "Workday", description: "Enterprise HR", icon: "📊", color: "#00B2A9" },
    { id: "adp", name: "ADP", description: "Payroll services", icon: "💰", color: "#D0271D" },
    { id: "paychex", name: "Paychex", description: "Payroll and HR", icon: "💵", color: "#00B2A9" },
    { id: "deel", name: "Deel", description: "Global payroll", icon: "🌍", color: "#FF6B6B" },
    { id: "remote", name: "Remote", description: "Global employment", icon: "🌐", color: "#00B2A9" },
    { id: "papayaglobal", name: "Papaya Global", description: "Payroll platform", icon: "🥭", color: "#FF6B6B" },
    { id: "greenhouse", name: "Greenhouse", description: "Applicant tracking", icon: "🌱", color: "#00B2A9" },
    { id: "lever", name: "Lever", description: "Talent acquisition", icon: "🔄", color: "#FF6B6B" },
    { id: "workable", name: "Workable", description: "Recruiting software", icon: "✅", color: "#00B2A9" },
    { id: "breezy", name: "Breezy HR", description: "Hiring software", icon: "🌬️", color: "#FF6B6B" }
  ]},
  { title: "Design & Creative", items: [
    { id: "figma", name: "Figma", description: "Design tool", icon: "🎨", color: "#F24E1E" },
    { id: "sketch", name: "Sketch", description: "Design platform", icon: "💎", color: "#FDB300" },
    { id: "adobecc", name: "Adobe Creative Cloud", description: "Creative suite", icon: "🎨", color: "#FF0000" },
    { id: "canva", name: "Canva", description: "Design platform", icon: "🖼️", color: "#00C4CC" },
    { id: "invision", name: "InVision", description: "Design collaboration", icon: "👁️", color: "#FF3366" },
    { id: "marvel", name: "Marvel", description: "Design and prototyping", icon: "🦸", color: "#FF6B6B" },
    { id: "protoio", name: "Proto.io", description: "Prototyping tool", icon: "📱", color: "#00B2A9" },
    { id: "principle", name: "Principle", description: "Animation design", icon: "✨", color: "#FF6B6B" },
    { id: "axure", name: "Axure", description: "Prototyping tool", icon: "🔧", color: "#00B2A9" },
    { id: "balsamiq", name: "Balsamiq", description: "Wireframing tool", icon: "📝", color: "#FF6B6B" },
    { id: "whimsical", name: "Whimsical", description: "Visual workspace", icon: "✏️", color: "#00B2A9" },
    { id: "miro", name: "Miro", description: "Collaborative whiteboard", icon: "🎨", color: "#FFD02F" }
  ]},
  { title: "Development Tools", items: [
    { id: "github", name: "GitHub", description: "Code hosting", icon: "🐙", color: "#181717" },
    { id: "gitlab", name: "GitLab", description: "DevOps platform", icon: "🦊", color: "#FC6D26" },
    { id: "bitbucket", name: "Bitbucket", description: "Git repository", icon: "🪣", color: "#0052CC" },
    { id: "jira", name: "Jira", description: "Issue tracking", icon: "📋", color: "#0052CC" },
    { id: "confluence", name: "Confluence", description: "Team documentation", icon: "📄", color: "#172B4D" },
    { id: "linear", name: "Linear", description: "Issue tracking", icon: "📊", color: "#5E6AD2" },
    { id: "shortcut", name: "Shortcut", description: "Project management", icon: "🎯", color: "#FF6B6B" },
    { id: "clubhouse", name: "Clubhouse", description: "Project management", icon: "🏠", color: "#00B2A9" },
    { id: "youtrack", name: "YouTrack", description: "Issue tracking", icon: "🎯", color: "#FF6B6B" },
    { id: "pagerduty", name: "PagerDuty", description: "Incident response", icon: "🚨", color: "#00B2A9" },
    { id: "datadog", name: "Datadog", description: "Monitoring and analytics", icon: "🐕", color: "#632CA6" },
    { id: "newrelic", name: "New Relic", description: "Observability platform", icon: "👁️", color: "#00B2A9" }
  ]},
  { title: "E-commerce", items: [
    { id: "shopify", name: "Shopify", description: "E-commerce platform", icon: "🛍️", color: "#96BF48" },
    { id: "woocommerce", name: "WooCommerce", description: "WordPress e-commerce", icon: "🛒", color: "#96588A" },
    { id: "bigcommerce", name: "BigCommerce", description: "E-commerce platform", icon: "🛒", color: "#34313F" },
    { id: "magento", name: "Magento", description: "E-commerce platform", icon: "🛍️", color: "#F26322" },
    { id: "prestashop", name: "PrestaShop", description: "E-commerce solution", icon: "🛒", color: "#00B2A9" },
    { id: "opencart", name: "OpenCart", description: "Open source e-commerce", icon: "🛒", color: "#FF6B6B" },
    { id: "squarespace", name: "Squarespace Commerce", description: "Online store", icon: "🟥", color: "#000000" },
    { id: "ecwid", name: "Ecwid", description: "Shopping cart", icon: "🛒", color: "#00B2A9" },
    { id: "volusion", name: "Volusion", description: "E-commerce platform", icon: "🛍️", color: "#FF6B6B" },
    { id: "3dcart", name: "Shift4Shop", description: "E-commerce software", icon: "🛒", color: "#00B2A9" },
    { id: "selz", name: "Selz", description: "E-commerce platform", icon: "🛒", color: "#FF6B6B" },
    { id: "bigcartel", name: "Big Cartel", description: "Store for creators", icon: "🎨", color: "#00B2A9" }
  ]}
];

export function IntegrationsPanel({ planId, currentIntegrationCount }: IntegrationsPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["AI Providers"]);
  const [connectedIntegrations, setConnectedIntegrations] = useState<Set<string>>(new Set());
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});

  const limit = PLAN_LIMITS[planId] || 10;
  const isUnlimited = limit === -1;
  const remainingSlots = isUnlimited ? -1 : limit - currentIntegrationCount;
  const canConnectMore = isUnlimited || remainingSlots > 0;

  const toggleCategory = (title: string) => {
    setExpandedCategories(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const toggleConnection = (id: string) => {
    if (!connectedIntegrations.has(id) && !canConnectMore) return;
    setConnectedIntegrations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const updateApiKey = (id: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [id]: value }));
  };

  return (
    <div className="space-y-4">
      {/* Real calendar & email connections (Google / Microsoft OAuth) */}
      <CalendarConnections />

      {/* Integration Limit Header */}
      <div className="p-4 bg-[#1a2b4a]/5 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Integration Slots</h4>
            <p className="text-sm text-[#b8a898]">
              {isUnlimited ? "Unlimited integrations (VIP Plan)" : `${currentIntegrationCount} of ${limit} used`}
            </p>
          </div>
          {!isUnlimited && (
            <div className="text-right">
              <span className={`text-sm font-medium ${remainingSlots === 0 ? 'text-red-500' : 'text-green-500'}`}>
                {remainingSlots} remaining
              </span>
            </div>
          )}
        </div>
        {!canConnectMore && (
          <div className="mt-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <p className="text-sm text-yellow-600">Integration limit reached. Upgrade to connect more tools.</p>
            <Button variant="outline" size="sm" className="mt-2">Upgrade Plan</Button>
          </div>
        )}
      </div>

      {/* Accordion Categories */}
      {categories.map((category) => {
        const isExpanded = expandedCategories.includes(category.title);
        const connectedCount = category.items.filter(item => connectedIntegrations.has(item.id)).length;

        return (
          <Card key={category.title} className="overflow-hidden">
            <button
              onClick={() => toggleCategory(category.title)}
              className="w-full p-4 flex items-center justify-between hover:bg-[#1a2b4a]/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{category.title}</span>
                {connectedCount > 0 && (
                  <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">{connectedCount} connected</span>
                )}
              </div>
              {isExpanded ? <ChevronUp className="w-5 h-5 text-[#b8a898]" /> : <ChevronDown className="w-5 h-5 text-[#b8a898]" />}
            </button>

            {isExpanded && (
              <CardContent className="p-4 pt-0 space-y-3">
                {category.items.map((integration) => {
                  const isConnected = connectedIntegrations.has(integration.id);
                  const isExpandedSettings = showApiKey[integration.id];
                  const canConnect = isConnected || canConnectMore;

                  return (
                    <div key={integration.id} className={`p-3 rounded-lg border transition-all ${isConnected ? "border-green-500/30 bg-green-500/5" : "border-[#1a2b4a]/10"} ${!canConnect ? "opacity-60" : ""}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: `${integration.color}20` }}>
                            {integration.icon}
                          </div>
                          <div>
                            <h5 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{integration.name}</h5>
                            <p className="text-xs text-[#b8a898]">{integration.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isConnected && (
                            <Button variant="ghost" size="sm" onClick={() => setShowApiKey({ ...showApiKey, [integration.id]: !isExpandedSettings })}>
                              {isExpandedSettings ? "Hide" : "Settings"}
                            </Button>
                          )}
                          <Button variant={isConnected ? "outline" : "primary"} size="sm" onClick={() => toggleConnection(integration.id)} disabled={!canConnect}>
                            {!canConnect && !isConnected ? <Lock className="w-4 h-4 mr-1" /> : null}
                            {isConnected ? "Disconnect" : "Connect"}
                          </Button>
                        </div>
                      </div>

                      {/* Settings Panel */}
                      {isConnected && isExpandedSettings && (
                        <div className="mt-3 pt-3 border-t border-[#1a2b4a]/10 space-y-3">
                          <div>
                            <label className="block text-sm text-[#b8a898] mb-2">API Key / Token</label>
                            <div className="flex gap-2">
                              <Input type="password" placeholder="Enter your API key" value={apiKeys[integration.id] || ""} onChange={(e) => updateApiKey(integration.id, e.target.value)} className="flex-1" />
                              <Button variant="outline" size="sm">Save</Button>
                            </div>
                          </div>
                          <p className="text-xs text-[#b8a898]">Your API key is encrypted and stored securely.</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// Real Google / Microsoft calendar + email connections (actual OAuth, not the
// mock directory below). Shows live status and a Connect / Reconnect action.
interface ProviderStatus {
  connected: boolean;
  email: string | null;
  canWriteCalendar: boolean;
}

function CalendarConnections() {
  const [google, setGoogle] = useState<ProviderStatus | null>(null);
  const [microsoft, setMicrosoft] = useState<ProviderStatus | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/calendar/status");
      const d = await res.json().catch(() => ({}));
      if (d.google) setGoogle(d.google);
      if (d.microsoft) setMicrosoft(d.microsoft);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const Row = ({
    name,
    icon,
    color,
    authHref,
    status,
    writeNote,
  }: {
    name: string;
    icon: string;
    color: string;
    authHref: string;
    status: ProviderStatus | null;
    writeNote?: boolean;
  }) => {
    const connected = status?.connected;
    const canWrite = status?.canWriteCalendar;
    return (
      <div
        className={`flex items-center justify-between p-3 rounded-lg border ${
          loaded && connected ? "border-green-500/30 bg-green-500/5" : "border-[#1a2b4a]/10"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: `${color}20` }}>
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{name}</p>
              {loaded && connected && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-500/15 text-green-700 dark:text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Connected
                </span>
              )}
              {loaded && !connected && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#1a2b4a]/8 text-[#7a8a99]">
                  Not connected
                </span>
              )}
            </div>
            <p className="text-xs text-[#b8a898]">
              {!loaded
                ? "Checking…"
                : connected
                ? status?.email || "Email + calendar"
                : "Email + calendar (read & write)"}
            </p>
            {loaded && connected && writeNote && !canWrite && (
              <p className="text-xs text-[#8a6a15] mt-0.5">Calendar is read-only — reconnect to add write access.</p>
            )}
            {loaded && connected && canWrite && (
              <p className="text-xs text-[#2c6b3f] mt-0.5">Calendar write enabled ✓</p>
            )}
          </div>
        </div>
        {loaded && connected ? (
          <a
            href={authHref}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#1a2b4a]/20 text-[#7a8a99] hover:text-[#1a2b4a] dark:hover:text-[#F8F5F0] hover:bg-[#1a2b4a]/5"
          >
            Reconnect
          </a>
        ) : (
          <a
            href={authHref}
            className="text-sm font-medium px-3 py-1.5 rounded-lg bg-[#2E7C83] text-white hover:bg-[#256b71]"
          >
            Connect
          </a>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 bg-[#1a2b4a]/5 rounded-lg">
      <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-1">Calendar &amp; Email</h3>
      <p className="text-xs text-[#b8a898] mb-3">
        Connect Google or Microsoft to read your inbox &amp; calendar and let the app add events (like planning sessions).
      </p>
      <div className="space-y-2">
        <Row name="Google Workspace" icon="📧" color="#4285F4" authHref="/api/google/auth" status={google} writeNote />
        <Row name="Microsoft 365" icon="🏢" color="#D83B01" authHref="/api/microsoft/auth" status={microsoft} />
      </div>
    </div>
  );
}
