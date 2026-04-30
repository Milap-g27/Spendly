export function TermsScreen({ navigate }) {
  return (
    <div className="policy-page">
      <div className="screen policy-screen">
        <div className="page-title-row policy-title-row">
          <button type="button" className="policy-back-btn" onClick={() => navigate("profile")}>
            Back
          </button>
          <h2 className="page-title">Terms of Service</h2>
        </div>

        <section className="card policy-card">
          <p className="policy-copy">
            Spendly is provided for personal finance tracking and budgeting. Use the app responsibly and keep your sign-in details secure.
          </p>
          <p className="policy-copy">
            You are responsible for the accuracy of the transactions and profile information you enter. Features may change as the app evolves.
          </p>
          <p className="policy-copy">
            Continued use of the app means you agree to these terms and to any future updates published in the application.
          </p>
        </section>
      </div>
    </div>
  );
}
