export function PrivacyPolicyScreen({ navigate }) {
  return (
    <div className="policy-page">
      <div className="screen policy-screen">
        <div className="page-title-row policy-title-row">
          <button type="button" className="policy-back-btn" onClick={() => navigate("profile")}>
            Back
          </button>
          <h2 className="page-title">Privacy Policy</h2>
        </div>

        <section className="card policy-card">
          <p className="policy-copy">
            Spendly keeps your financial activity private and only uses your data to show your budget, transactions, and insights inside the app.
          </p>
          <p className="policy-copy">
            We do not sell your personal information. Transaction data is stored to power your account, and profile details are only used for sign-in and display purposes.
          </p>
          <p className="policy-copy">
            If you have questions about your data, contact your account administrator or update your profile settings from the app.
          </p>
        </section>
      </div>
    </div>
  );
}
