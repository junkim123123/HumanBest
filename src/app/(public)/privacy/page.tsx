export const metadata = {
  title: "Privacy | NexSupply",
};

const lastUpdated = "December 31, 2025";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
        <header className="space-y-2">
          <p className="text-sm text-slate-500">Last updated: {lastUpdated}</p>
          <h1 className="text-3xl font-bold">Privacy</h1>
          <p className="text-slate-600 text-sm">
            Plain-language notes on how we handle your data.
          </p>
        </header>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">What we collect</h2>
          <p className="text-slate-700 text-sm">
            Account details (like email), content you submit (orders, reports, messages, uploads), and basic usage logs to keep the service reliable.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Why we collect</h2>
          <p className="text-slate-700 text-sm">
            To provide your workspace, process sourcing requests, improve reliability, and support you when something breaks.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">What we don’t do</h2>
          <ul className="list-disc pl-5 text-slate-700 text-sm space-y-1">
            <li>We do not sell personal data.</li>
            <li>We do not use uploads to train models; they are only used to serve your account.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Data retention</h2>
          <p className="text-slate-700 text-sm">
            We keep account and order data while you use the product and delete or anonymize it when it is no longer needed for operations, security, or legal obligations.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Sharing</h2>
          <p className="text-slate-700 text-sm">
            We share data only with core vendors (hosting, storage, email, analytics) who help us run NexSupply and who are bound by confidentiality. We do not sell data.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="text-slate-700 text-sm">
            Questions? Email support@nexsupply.com and we will respond.
          </p>
        </section>

        <footer className="pt-6 border-t border-slate-200 text-sm text-slate-600 flex flex-wrap gap-4">
          <a href="/" className="hover:text-slate-900">Home</a>
          <a href="/contact" className="hover:text-slate-900">Contact</a>
        </footer>
      </div>
    </main>
  );
}
