import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { HoneycombBackgroundLoader } from "@/components/HoneycombBackgroundLoader";
import { Footer } from "@/sections/Footer";

export const metadata: Metadata = {
  title: "Acceptable Use Policy — mukoko",
  description:
    "Our community standards rooted in Ubuntu: I am because we are.",
};

export default function AcceptableUsePage() {
  return (
    <>
      <HoneycombBackgroundLoader />
      <Header />
      <main id="main-content">
        <article className="legal-page">
          <div className="legal-page__inner">
            <p className="legal-page__eyebrow">Community Standards</p>
            <h1 className="legal-page__title">Acceptable Use Policy</h1>
            <p className="legal-page__updated">Last updated: March 2026</p>

            <section className="legal-section">
              <h2>The Ubuntu Foundation</h2>
              <p>
                mukoko is built on the Ubuntu principle: <em>&ldquo;Munhu munhu muvanhu&rdquo;</em> —
                a person is a person through other persons. Every interaction on this platform must
                honour the dignity of every community member.
              </p>
              <p>
                This is not a list of rules to memorise. It is a way of being. Before you post,
                comment, create, or engage, ask yourself the five questions of the Ubuntu Test:
              </p>
              <ul>
                <li>Does this strengthen community?</li>
                <li>Does this respect human dignity?</li>
                <li>Does this serve the collective good?</li>
                <li>Would I explain this proudly to my elders?</li>
                <li>Does this align with &ldquo;I am because we are&rdquo;?</li>
              </ul>
              <p>
                If the answer to any of these is no, reconsider.
              </p>
            </section>

            <section className="legal-section">
              <h2>What We Encourage</h2>
              <ul>
                <li><strong>Authentic engagement</strong> — Share genuine experiences, ideas, and stories that reflect who you are</li>
                <li><strong>Constructive discourse</strong> — Disagree with respect. Challenge ideas, not people</li>
                <li><strong>Cultural celebration</strong> — Share your heritage, language, traditions, and art. This is a home for African expression</li>
                <li><strong>Knowledge sharing</strong> — Help others learn. Mentorship and collaboration are the heart of the hive</li>
                <li><strong>Creator support</strong> — Uplift authors, artists, event organisers, and community builders</li>
                <li><strong>Local language</strong> — Post in Shona, Ndebele, Swahili, Yoruba, Zulu, or any of Africa&apos;s languages. We celebrate linguistic diversity</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>What We Do Not Tolerate</h2>
              <p>
                The following behaviours violate the Ubuntu principle and will result in action —
                from content removal to permanent account suspension:
              </p>

              <h3>Harm to Persons</h3>
              <ul>
                <li>Harassment, bullying, or targeted abuse of any individual</li>
                <li>Threats of violence, doxxing, or encouraging self-harm</li>
                <li>Hate speech based on ethnicity, gender, religion, sexual orientation, disability, or nationality</li>
                <li>Content that sexualises minors in any form</li>
              </ul>

              <h3>Harm to Community</h3>
              <ul>
                <li>Deliberate misinformation designed to deceive or cause panic</li>
                <li>Spam, bot-driven content, or coordinated inauthentic behaviour</li>
                <li>Scams, phishing, or financial exploitation of community members</li>
                <li>Impersonation of individuals, organisations, or government entities</li>
              </ul>

              <h3>Harm to the Platform</h3>
              <ul>
                <li>Attempting to access other users&apos; data, accounts, or private content</li>
                <li>Automated scraping, data harvesting, or reverse engineering</li>
                <li>Distributing malware or attempting to compromise platform security</li>
                <li>Circumventing moderation, bans, or safety features</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>Content Standards</h2>

              <h3>Clips (News)</h3>
              <p>
                Content shared in Clips must be factual and sourced. Opinion pieces must be clearly
                labelled. Clickbait headlines that misrepresent content are not permitted.
              </p>

              <h3>Novels</h3>
              <p>
                Authors retain full creative freedom within legal boundaries. Content warnings must
                be applied for mature themes. Plagiarism will result in immediate content removal
                and potential account action.
              </p>

              <h3>Connect (Circles)</h3>
              <p>
                Circle moderators are empowered to set community-specific rules that build on
                (not override) this policy. Moderators who abuse their position will have
                moderation privileges revoked.
              </p>

              <h3>Events</h3>
              <p>
                Event listings must accurately represent the event. Ticket prices must be
                transparent. Fraudulent events will result in permanent suspension and
                reporting to relevant authorities.
              </p>
            </section>

            <section className="legal-section">
              <h2>Enforcement</h2>
              <p>We take a graduated approach to enforcement:</p>
              <ul>
                <li><strong>Education first</strong> — For minor or first-time violations, we explain what went wrong and why</li>
                <li><strong>Content removal</strong> — Violating content is removed with an explanation</li>
                <li><strong>Temporary restriction</strong> — Repeated violations result in reduced platform capabilities</li>
                <li><strong>Suspension</strong> — Serious or persistent violations result in account suspension</li>
                <li><strong>Permanent ban</strong> — Actions that cause severe harm or demonstrate a pattern of abuse</li>
              </ul>
              <p>
                Severe violations (threats, exploitation, illegal activity) bypass the graduated
                process and may result in immediate permanent suspension and referral to
                law enforcement.
              </p>
            </section>

            <section className="legal-section">
              <h2>Appeals</h2>
              <p>
                We believe in fairness. If you believe an enforcement action was taken in error,
                you have the right to appeal. Appeals are reviewed by a different team member
                than the one who made the original decision.
              </p>
              <p>
                Submit appeals to{" "}
                <a href="mailto:appeals@mukoko.com">appeals@mukoko.com</a> within 30 days
                of the action.
              </p>
            </section>

            <section className="legal-section">
              <h2>Reporting</h2>
              <p>
                If you witness behaviour that violates this policy, please report it. Every report
                is reviewed. You can report content directly within the app, or email{" "}
                <a href="mailto:safety@mukoko.com">safety@mukoko.com</a>.
              </p>
              <p>
                We do not retaliate against good-faith reports. Reporting is an act of
                community care — it is Ubuntu in practice.
              </p>
            </section>

            <section className="legal-section">
              <h2>Our Commitment</h2>
              <p>
                We hold ourselves to the same standard. Nyuchi Africa and the mukoko team will:
              </p>
              <ul>
                <li>Never use your data to manipulate your behaviour or emotions</li>
                <li>Never optimise for outrage, addiction, or engagement at the expense of wellbeing</li>
                <li>Never sell your personal data to advertisers or third parties</li>
                <li>Always explain enforcement decisions transparently</li>
                <li>Always listen to community feedback on policy changes</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>Contact</h2>
              <p>
                For questions about this policy, contact us at{" "}
                <a href="mailto:policy@mukoko.com">policy@mukoko.com</a>.
              </p>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
