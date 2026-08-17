import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Realvian collects, uses and protects your data.",
  alternates: { canonical: "/legal/privacy" },
  robots: { index: true, follow: false },
};

export default function PrivacyPage() {
  return (
    <LegalLayout eyebrow="Legal" title="Privacy Policy" lastUpdated="16 August 2026">
      <p>
        This policy explains what personal data Realvian collects, why, and
        what rights you have over it, in line with UK GDPR and the Data
        Protection Act 2018.
      </p>

      <h2>Who we are</h2>
      <p>
        Realvian ("we", "us") is the data controller for personal data
        collected through realvian.co.uk.{" "}
        <span className="placeholder">[Insert registered company name,
        company number and registered office address]</span>.
      </p>

      <h2>What we collect, and why</h2>
      <p><strong>Business listing submissions.</strong> If you submit a business
      via "List your business", we collect the business name, category,
      description, website, phone number and email address you provide.
      This is used to review and, if approved, publish the listing publicly
      on relevant area pages. Legal basis: your consent, given at the point
      of submission, and our legitimate interest in operating a business
      directory.</p>

      <p><strong>Admin accounts.</strong> Staff accounts store an email address
      and a securely hashed password. This is internal and never public.
      Legal basis: legitimate interest in operating the platform securely.</p>

      <p><strong>Theme preference.</strong> A cookie remembers whether you're
      using light or dark mode. It contains no personal data. Legal basis:
      strictly necessary for the Site to function as you'd expect.</p>

      <p><strong>Outbound link clicks.</strong> When you click an affiliate
      link or business listing link, we record which link was clicked, the
      page it was clicked from, and a coarse device category (mobile,
      desktop, or bot). <strong>We do not store your IP address or any
      individual identifier</strong> — the record uses a salted hash that
      rotates daily, specifically so it cannot identify you personally or be
      linked back to you across days. Legal basis: legitimate interest in
      understanding which content and partners are useful to visitors.</p>

      <h2>What we don't currently do</h2>
      <p>
        As of the date at the top of this page, the Site has no user account
        system, no payment processing, no email newsletter, and no
        third-party analytics or advertising trackers. If any of that
        changes, this policy will be updated first and the change will be
        reflected in the "last updated" date.
      </p>

      <h2>How business listing data is shared</h2>
      <p>
        If your listing is approved, the business name, category, description,
        and the contact details you chose to make public are shown on the
        relevant area page(s) for anyone to see — that's the point of a
        directory listing. Do not submit information you don't want to be
        public. You can request removal at any time — see "Your rights"
        below.
      </p>

      <h2>Data retention</h2>
      <ul>
        <li>Business listings: retained while the listing is active, plus a reasonable period after removal for record-keeping, then deleted.</li>
        <li>Rejected listing submissions: deleted within 90 days.</li>
        <li>Click records: retained in aggregate for reporting; the underlying rows are not linked to any individual and are periodically purged.</li>
        <li>Admin accounts: retained for the duration of employment or engagement, then disabled and later deleted.</li>
      </ul>

      <h2>Your rights</h2>
      <p>Under UK GDPR, you have the right to:</p>
      <ul>
        <li>Ask what personal data we hold about you</li>
        <li>Ask us to correct inaccurate data</li>
        <li>Ask us to delete your data (for example, to remove a business listing)</li>
        <li>Object to how we're using your data</li>
        <li>Ask for a copy of your data in a portable format</li>
        <li>Complain to the <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">Information Commissioner's Office (ICO)</a> if you think we've got something wrong</li>
      </ul>
      <p>
        To exercise any of these, email{" "}
        <a href="mailto:data@realvian.co.uk">data@realvian.co.uk</a>. We'll
        respond within one month.
      </p>

      <h2>International transfers</h2>
      <p>
        Our infrastructure is currently hosted within the UK/EEA. If this
        changes, we'll update this policy and ensure appropriate safeguards
        are in place.
      </p>

      <h2>Children</h2>
      <p>The Site is not directed at, and we do not knowingly collect data from, anyone under 18.</p>

      <h2>Changes to this policy</h2>
      <p>
        We'll update the date at the top of this page whenever this policy
        changes materially.
      </p>

      <h2>Contact</h2>
      <p>
        <a href="mailto:data@realvian.co.uk">data@realvian.co.uk</a>
      </p>
    </LegalLayout>
  );
}
