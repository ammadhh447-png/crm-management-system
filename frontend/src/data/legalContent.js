export const LEGAL_NAV = [
  { key: 'faqs', label: 'FAQs', path: '/legal/faqs' },
  { key: 'privacy', label: 'Privacy Policy', path: '/legal/privacy' },
  { key: 'terms', label: 'Terms of Service', path: '/legal/terms' },
];

export const AI_ASSISTANT_HELP =
  'For immediate assistance, open the CRM AI Assistant using the floating button in the bottom-right corner of the dashboard. The assistant can guide you through contacts, deals, tasks, communications, settings, and other platform features.';

export const LEGAL_PAGES = {
  faqs: {
    title: 'Frequently Asked Questions',
    intro: 'This document answers common questions about CRM Management System. Use it as a reference for onboarding, daily workflows, and account administration.',
    sections: [
      {
        heading: 'Getting Started',
        items: [
          {
            q: 'What is CRM Management System?',
            a: 'CRM Management System is a cloud-based customer relationship management platform that helps teams manage contacts, track deals, assign tasks, log communications, and monitor performance from a single dashboard.',
          },
          {
            q: 'How do I sign in?',
            a: 'You can sign in using your email and password or with Google OAuth. After authentication, your profile is created automatically and you are directed to the dashboard.',
          },
          {
            q: 'Who can use the platform?',
            a: 'Access is role-based. Administrators, managers, sales representatives, support staff, and HR users each receive permissions appropriate to their responsibilities.',
          },
        ],
      },
      {
        heading: 'Contacts and Sales',
        items: [
          {
            q: 'How do I add and manage contacts?',
            a: 'Navigate to Contacts and Leads to create records manually, import CSV files, or export data. You can filter contacts, detect duplicates, and update lead status as prospects move through your funnel.',
          },
          {
            q: 'How does the sales pipeline work?',
            a: 'The Sales Pipeline provides a Kanban board where deals move through stages: Prospect, Qualified, Proposal, Negotiation, Won, and Lost. Drag and drop deals to update their stage instantly.',
          },
          {
            q: 'Can I track deal value and forecasts?',
            a: 'Yes. Each deal includes value, probability, and stage data. The Dashboard and Reports modules aggregate pipeline value, forecast revenue, and conversion metrics.',
          },
        ],
      },
      {
        heading: 'Tasks, Documents, and Communications',
        items: [
          {
            q: 'How do I assign tasks to team members?',
            a: 'Open Tasks and Calendar, create a task with title, due date, priority, and assignee. Overdue tasks appear on the dashboard and trigger notifications.',
          },
          {
            q: 'Can I upload and attach documents?',
            a: 'Yes. The Documents module supports file uploads to secure cloud storage. Files can be linked to contacts and deals for centralized record keeping.',
          },
          {
            q: 'How are emails and communications logged?',
            a: 'Use the Communications module to log calls, meetings, and emails. Email templates are available for consistent outreach through integrated delivery services.',
          },
        ],
      },
      {
        heading: 'Account and Security',
        items: [
          {
            q: 'How do I update my profile?',
            a: 'Go to Settings, then Profile, to update your name, phone, department, and profile photo. Google sign-in users automatically use their Google profile picture.',
          },
          {
            q: 'How is my data protected?',
            a: 'Authentication is handled through Supabase Auth with encrypted sessions. API access requires valid tokens, and role-based permissions restrict actions by user type.',
          },
          {
            q: 'Who manages users and roles?',
            a: 'Administrators and authorized managers can assign roles in Settings under Users and Roles. Users cannot change their own role. Only administrators can assign the admin role.',
          },
        ],
      },
      {
        heading: 'Help and Support',
        items: [
          {
            q: 'How do I get help with the platform?',
            a: AI_ASSISTANT_HELP,
          },
        ],
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    intro: 'This Privacy Policy describes how CRM Management System collects, uses, stores, and protects personal and business information. It applies to all users who access or use the platform.',
    sections: [
      {
        heading: 'Introduction',
        paragraphs: [
          'CRM Management System is committed to protecting your privacy. This policy explains our practices in clear terms and outlines your rights regarding personal data processed through the platform.',
          'By accessing or using the platform, you acknowledge that you have read and understood this Privacy Policy.',
        ],
      },
      {
        heading: 'Information We Collect',
        items: [
          {
            label: 'Account Information',
            text: 'Name, email address, phone number, department, profile photo, and authentication credentials managed through our identity provider.',
          },
          {
            label: 'Business Data',
            text: 'Contacts, deals, tasks, communications, documents, and activity logs that you or your organization enter into the system.',
          },
          {
            label: 'Technical Data',
            text: 'Session tokens, IP addresses, browser type, and usage logs required for security, authentication, and system performance.',
          },
        ],
      },
      {
        heading: 'How We Use Your Information',
        paragraphs: [
          'We use collected information to provide, operate, and maintain the CRM platform and its features.',
          'We authenticate users, enforce role-based access controls, and protect against unauthorized access.',
          'We deliver notifications related to leads, deals, tasks, and account activity.',
          'We improve platform reliability, troubleshoot issues, and maintain audit records for compliance purposes.',
        ],
      },
      {
        heading: 'Data Storage and Security',
        paragraphs: [
          'Data is stored in secure cloud infrastructure. Files and profile images are stored in encrypted object storage with access controls.',
          'We use industry-standard security measures including HTTPS encryption, token-based authentication, and permission-based API access.',
          'While we implement strong safeguards, no method of transmission over the internet is completely secure.',
        ],
      },
      {
        heading: 'Data Sharing',
        paragraphs: [
          'We do not sell your personal information. Data is shared only with trusted service providers necessary to operate the platform, such as authentication, email delivery, and cloud storage providers.',
          'We may disclose information when required by law or to protect the rights, safety, and integrity of the platform and its users.',
        ],
      },
      {
        heading: 'Your Rights',
        paragraphs: [
          'You may access and update your profile information through Settings at any time.',
          'You may request correction or deletion of your account data by contacting your organization administrator.',
          'You may change your language preference and notification settings within the application.',
        ],
      },
      {
        heading: 'Support',
        paragraphs: [
          'For privacy-related questions, contact your system administrator. For platform guidance, use the CRM AI Assistant available from the dashboard.',
        ],
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    intro: 'These Terms of Service constitute a binding agreement between you and CRM Management System. Please read them carefully before using the platform.',
    sections: [
      {
        heading: 'Agreement to Terms',
        paragraphs: [
          'These Terms of Service govern your access to and use of CRM Management System. By creating an account or using the platform, you agree to be bound by these terms.',
          'If you do not agree to these terms, you must not access or use the platform.',
        ],
      },
      {
        heading: 'Eligibility and Accounts',
        paragraphs: [
          'You must be authorized by your organization to use the platform. You are responsible for maintaining the confidentiality of your login credentials.',
          'You agree to provide accurate registration information and to keep your profile up to date.',
          'You must notify your administrator immediately of any unauthorized access to your account.',
        ],
      },
      {
        heading: 'Acceptable Use',
        paragraphs: [
          'You may use the platform only for lawful business purposes related to customer relationship management.',
          'You must not attempt to gain unauthorized access, interfere with system operations, upload malicious content, or misuse data belonging to other users.',
          'You must not reverse engineer, scrape, or exploit the platform in ways not expressly permitted.',
        ],
      },
      {
        heading: 'User Content and Data',
        paragraphs: [
          'Your organization retains ownership of business data entered into the platform, including contacts, deals, and documents.',
          'You grant the platform a limited license to host, process, and display your data solely to provide the service.',
          'You are responsible for ensuring that data you upload complies with applicable laws and does not infringe third-party rights.',
        ],
      },
      {
        heading: 'Roles and Permissions',
        paragraphs: [
          'Access to features is determined by assigned roles such as Admin, Manager, Sales Rep, Support, and HR.',
          'Administrators may manage users, settings, and organizational configuration. Users may not escalate their own privileges.',
          'We reserve the right to suspend or modify access if these terms are violated.',
        ],
      },
      {
        heading: 'Service Availability',
        paragraphs: [
          'We strive to maintain reliable uptime but do not guarantee uninterrupted access. Maintenance, updates, or unforeseen outages may occur.',
          'We may update features, modify interfaces, or discontinue functionality with reasonable notice when possible.',
        ],
      },
      {
        heading: 'Limitation of Liability',
        paragraphs: [
          'The platform is provided as is without warranties of any kind. To the fullest extent permitted by law, we are not liable for indirect, incidental, or consequential damages arising from use of the service.',
          'Your organization is responsible for decisions made based on data and reports generated within the platform.',
        ],
      },
      {
        heading: 'Termination',
        paragraphs: [
          'Your organization or platform administrators may deactivate accounts at any time. Upon termination, access to the platform and associated data may be revoked according to organizational policy.',
        ],
      },
      {
        heading: 'Support',
        paragraphs: [
          'Questions regarding these Terms of Service may be directed to your organization administrator. For in-app guidance, use the CRM AI Assistant on the dashboard.',
        ],
      },
    ],
  },
};
