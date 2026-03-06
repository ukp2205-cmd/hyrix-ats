import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | Hyrix',
  description: 'Privacy Policy for Hyrix AI-powered Applicant Tracking System.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED]">
              <span className="text-white font-bold text-base">HX</span>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent">
              Hyrix
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-[#4F46E5] transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Privacy Policy</h1>
          <p className="text-sm text-gray-500">Effective Date: January 1, 2025 &nbsp;|&nbsp; Last Updated: March 1, 2025</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
            <p>
              Welcome to Hyrix ("Company", "we", "our", or "us"). Hyrix is an AI-powered Applicant Tracking System
              (ATS) operated by Career Guideline Pvt. Ltd., headquartered in India. This Privacy Policy describes how
              we collect, use, disclose, and safeguard your information when you use our platform available at{' '}
              <a href="https://hyrix.ai" className="text-[#4F46E5] hover:underline">https://hyrix.ai</a>.
            </p>
            <p className="mt-3">
              By accessing or using Hyrix, you agree to this Privacy Policy. If you do not agree, please discontinue
              use of the platform immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
            <h3 className="text-base font-semibold text-gray-800 mb-2">2.1 Information You Provide Directly</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Account registration details (name, email address, password)</li>
              <li>Organization information (company name, size, industry)</li>
              <li>Job posting content (job titles, descriptions, requirements)</li>
              <li>Candidate information uploaded or imported (resumes, cover letters, contact details)</li>
              <li>Communication preferences and notification settings</li>
              <li>Payment information (processed securely by third-party providers)</li>
            </ul>

            <h3 className="text-base font-semibold text-gray-800 mb-2 mt-4">2.2 Information Collected Automatically</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Log data (IP address, browser type, pages visited, time and date of visits)</li>
              <li>Device information (operating system, hardware model, unique device identifiers)</li>
              <li>Usage data (features used, clicks, session duration)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h3 className="text-base font-semibold text-gray-800 mb-2 mt-4">2.3 Candidate Data</h3>
            <p className="text-gray-600">
              As an ATS platform, Hyrix processes personal data about job candidates on behalf of our organizational
              customers (data controllers). This includes resumes, contact details, interview notes, assessment
              results, and hiring decisions. We process this data solely as a data processor under the instructions
              of our customers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>To provide, operate, and maintain the Hyrix platform</li>
              <li>To process job applications and manage recruitment workflows</li>
              <li>To send transactional emails (account verification, password resets, notifications)</li>
              <li>To improve and personalize your experience using AI-powered features</li>
              <li>To analyze usage patterns and improve platform performance</li>
              <li>To comply with legal obligations and enforce our Terms of Service</li>
              <li>To detect and prevent fraud, abuse, and security incidents</li>
              <li>To send product updates and marketing communications (with consent)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. AI-Powered Features</h2>
            <p>
              Hyrix uses artificial intelligence and machine learning to provide resume screening, candidate ranking,
              and hiring insights. Our AI systems analyze candidate data to assist recruiters in making informed
              decisions. We do not use AI to make fully automated hiring decisions without human oversight.
            </p>
            <p className="mt-3">
              Candidate data used for AI processing is pseudonymized where technically feasible. We do not use
              candidate data to train AI models for use by other organizations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Sharing and Disclosure</h2>
            <p>We do not sell your personal information. We may share data with:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 mt-3">
              <li><strong>Service Providers:</strong> Cloud hosting (Amazon Lightsail), database services, email delivery providers, and analytics tools under data processing agreements</li>
              <li><strong>Your Organization:</strong> If you are a candidate, your data is shared with the organization that received your application</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or government authority</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, with prior notice to users</li>
              <li><strong>With Your Consent:</strong> For any other purpose with your explicit consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data Storage and Security</h2>
            <p>
              Your data is stored on Amazon Web Services (AWS) infrastructure located in India (ap-south-1 region).
              We implement industry-standard security measures including:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 mt-3">
              <li>AES-256 encryption for sensitive data at rest</li>
              <li>TLS 1.2+ encryption for data in transit</li>
              <li>Role-based access controls (RBAC) with least-privilege principles</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Secure password hashing using bcrypt</li>
            </ul>
            <p className="mt-3 text-gray-600">
              Despite these measures, no method of transmission over the internet is 100% secure. We cannot
              guarantee absolute security of your data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Data Retention</h2>
            <p>We retain your data for as long as:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 mt-3">
              <li>Your account remains active</li>
              <li>Necessary to provide our services</li>
              <li>Required by applicable law or regulation</li>
              <li>Needed to resolve disputes or enforce agreements</li>
            </ul>
            <p className="mt-3 text-gray-600">
              Candidate data is retained for a maximum of 3 years from the last activity unless the organization
              requests earlier deletion. Account data is deleted within 30 days of account closure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Your Rights</h2>
            <p>Depending on your location, you may have the following rights:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 mt-3">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong>Rectification:</strong> Request correction of inaccurate or incomplete data</li>
              <li><strong>Erasure:</strong> Request deletion of your personal data ("right to be forgotten")</li>
              <li><strong>Portability:</strong> Request your data in a machine-readable format</li>
              <li><strong>Objection:</strong> Object to processing of your data for marketing purposes</li>
              <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
            </ul>
            <p className="mt-3 text-gray-600">
              To exercise these rights, contact us at{' '}
              <a href="mailto:privacy@hyrix.ai" className="text-[#4F46E5] hover:underline">privacy@hyrix.ai</a>.
              We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Cookies</h2>
            <p>
              We use cookies and similar technologies to maintain session state, remember preferences, and analyze
              platform usage. Essential cookies are required for the platform to function. You can control
              non-essential cookies through your browser settings. Disabling cookies may affect certain features.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Third-Party Integrations</h2>
            <p>
              Hyrix may integrate with third-party services such as Google OAuth for authentication and email
              providers for communication. When you connect a third-party account, that provider's privacy policy
              also applies. We only request the minimum permissions necessary to provide the integration features.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Children's Privacy</h2>
            <p>
              Hyrix is not intended for use by individuals under the age of 18. We do not knowingly collect personal
              data from minors. If you believe we have inadvertently collected such data, please contact us
              immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of significant changes via email
              or a prominent notice on our platform at least 14 days before the changes take effect. Continued use
              of the platform after the effective date constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Contact Us</h2>
            <p>If you have questions, concerns, or requests regarding this Privacy Policy, contact us at:</p>
            <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-gray-700 space-y-1">
              <p className="font-semibold">Career Guideline Pvt. Ltd. (Hyrix)</p>
              <p>Email: <a href="mailto:privacy@hyrix.ai" className="text-[#4F46E5] hover:underline">privacy@hyrix.ai</a></p>
              <p>Website: <a href="https://hyrix.ai" className="text-[#4F46E5] hover:underline">https://hyrix.ai</a></p>
              <p>India</p>
            </div>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-200 bg-gray-50 mt-16">
        <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Hyrix. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="hover:text-[#4F46E5] transition-colors font-medium text-[#4F46E5]">Privacy Policy</Link>
            <span className="text-gray-300">|</span>
            <Link href="/terms" className="hover:text-[#4F46E5] transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
