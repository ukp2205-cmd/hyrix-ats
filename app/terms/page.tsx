import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service | Hyrix',
  description: 'Terms of Service for Hyrix AI-powered Applicant Tracking System.',
}

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Terms of Service</h1>
          <p className="text-sm text-gray-500">Effective Date: January 1, 2025 &nbsp;|&nbsp; Last Updated: March 1, 2025</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Agreement to Terms</h2>
            <p>
              These Terms of Service ("Terms") constitute a legally binding agreement between you and Career
              Guideline Pvt. Ltd. ("Hyrix", "Company", "we", "our", or "us") governing your access to and use of
              the Hyrix platform available at{' '}
              <a href="https://hyrix.ai" className="text-[#4F46E5] hover:underline">https://hyrix.ai</a>{' '}
              and all related services.
            </p>
            <p className="mt-3">
              By creating an account or using the platform, you confirm that you have read, understood, and agree to
              be bound by these Terms and our Privacy Policy. If you do not agree, you must not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
            <p>
              Hyrix is an AI-powered Applicant Tracking System (ATS) that enables organizations to manage their
              recruitment and hiring processes. Our platform includes features such as:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 mt-3">
              <li>Job posting creation and management</li>
              <li>Candidate application tracking and pipeline management</li>
              <li>AI-assisted resume screening and candidate ranking</li>
              <li>Interview scheduling and feedback collection</li>
              <li>Email integration for automatic resume import</li>
              <li>Reporting and analytics dashboards</li>
              <li>Team collaboration and role-based access controls</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Account Registration</h2>
            <p>To use Hyrix, you must:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 mt-3">
              <li>Be at least 18 years of age</li>
              <li>Provide accurate, current, and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access to your account</li>
              <li>Accept responsibility for all activities that occur under your account</li>
            </ul>
            <p className="mt-3 text-gray-600">
              You may not share your account credentials with others or create accounts for the purpose of
              circumventing usage limits or gaining unauthorized access.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Acceptable Use</h2>
            <p>You agree to use Hyrix only for lawful purposes and in accordance with these Terms. You must not:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 mt-3">
              <li>Use the platform to discriminate against candidates based on protected characteristics (race, gender, religion, national origin, disability, age, etc.)</li>
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Attempt to gain unauthorized access to our systems or other user accounts</li>
              <li>Use automated tools to scrape, crawl, or extract data from the platform</li>
              <li>Reverse engineer, decompile, or attempt to extract source code</li>
              <li>Impersonate another person or organization</li>
              <li>Use the platform to send unsolicited commercial communications (spam)</li>
              <li>Violate any applicable local, state, national, or international law or regulation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data and Candidate Privacy</h2>
            <p>
              When you use Hyrix to manage candidate data, you are the data controller and Hyrix acts as a data
              processor. You are responsible for:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 mt-3">
              <li>Obtaining valid consent from candidates before collecting their personal data</li>
              <li>Ensuring your use of candidate data complies with applicable privacy laws (including India's DPDP Act, GDPR where applicable)</li>
              <li>Responding to candidate requests regarding their personal data</li>
              <li>Ensuring your job postings comply with applicable employment laws</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Intellectual Property</h2>
            <p>
              The Hyrix platform, including its software, design, logos, trademarks, and content, is owned by
              Career Guideline Pvt. Ltd. and protected by applicable intellectual property laws.
            </p>
            <p className="mt-3 text-gray-600">
              We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the
              platform solely for your internal business purposes in accordance with these Terms.
            </p>
            <p className="mt-3 text-gray-600">
              You retain ownership of all data you upload to the platform. By uploading data, you grant us a
              limited license to process that data solely to provide our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Payment Terms</h2>
            <p>
              Certain features of Hyrix may require a paid subscription. By subscribing to a paid plan, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 mt-3">
              <li>Pay all applicable fees as described in the pricing page</li>
              <li>Provide accurate and current billing information</li>
              <li>Authorize us to charge your payment method on a recurring basis</li>
            </ul>
            <p className="mt-3 text-gray-600">
              All fees are non-refundable unless otherwise stated or required by applicable law. We reserve the
              right to modify pricing with 30 days written notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Service Availability and Modifications</h2>
            <p>
              We strive to maintain high availability of the Hyrix platform but do not guarantee uninterrupted
              access. We reserve the right to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 mt-3">
              <li>Modify, suspend, or discontinue any feature with or without notice</li>
              <li>Perform maintenance that may temporarily interrupt service</li>
              <li>Update these Terms at any time with notice to users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Disclaimer of Warranties</h2>
            <p>
              The Hyrix platform is provided "as is" and "as available" without warranties of any kind, express or
              implied. We do not warrant that the platform will be error-free, secure, or uninterrupted. AI-powered
              features are provided as tools to assist human decision-making and should not be the sole basis for
              hiring decisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, Hyrix shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages, including loss of profits, data, or business
              opportunities, arising from your use of the platform, even if we have been advised of the possibility
              of such damages.
            </p>
            <p className="mt-3 text-gray-600">
              Our total liability for any claim arising out of or relating to these Terms shall not exceed the
              amount paid by you to Hyrix in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Hyrix and its officers, directors, employees, and
              agents from any claims, liabilities, damages, losses, and expenses (including legal fees) arising from
              your use of the platform, violation of these Terms, or infringement of any third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Termination</h2>
            <p>
              Either party may terminate this agreement at any time. We may suspend or terminate your account
              immediately if you violate these Terms. Upon termination:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 mt-3">
              <li>Your right to access the platform ceases immediately</li>
              <li>We will retain your data for 30 days during which you may request an export</li>
              <li>After 30 days, your data will be permanently deleted from our systems</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Governing Law and Dispute Resolution</h2>
            <p>
              These Terms are governed by the laws of India. Any disputes arising from these Terms or your use of
              the platform shall be subject to the exclusive jurisdiction of the courts located in India. We
              encourage resolution of disputes through good-faith negotiation before pursuing legal action.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Changes to Terms</h2>
            <p>
              We may update these Terms periodically. We will notify you of significant changes via email or a
              prominent notice on the platform at least 14 days before the new terms take effect. Continued use of
              the platform after the effective date constitutes your acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">15. Contact Us</h2>
            <p>For questions about these Terms of Service, contact us at:</p>
            <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-gray-700 space-y-1">
              <p className="font-semibold">Career Guideline Pvt. Ltd. (Hyrix)</p>
              <p>Email: <a href="mailto:legal@hyrix.ai" className="text-[#4F46E5] hover:underline">legal@hyrix.ai</a></p>
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
            <Link href="/privacy-policy" className="hover:text-[#4F46E5] transition-colors">Privacy Policy</Link>
            <span className="text-gray-300">|</span>
            <Link href="/terms" className="hover:text-[#4F46E5] transition-colors font-medium text-[#4F46E5]">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
