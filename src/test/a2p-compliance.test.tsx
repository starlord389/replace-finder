import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import PrivacyPolicy from "@/pages/legal/PrivacyPolicy";
import Terms from "@/pages/legal/Terms";

describe("A2P public compliance disclosures", () => {
  it("publishes the required mobile-information privacy commitments", () => {
    render(
      <MemoryRouter>
        <PrivacyPolicy />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /sms and mobile information/i })).toBeInTheDocument();
    expect(screen.getByText(/entering a phone number by itself.*does not constitute sms consent/i)).toBeInTheDocument();
    expect(screen.getByText(/we do not share mobile phone numbers, sms opt-in data, or sms consent/i)).toBeInTheDocument();
    expect(document.body).toHaveTextContent(/reply stop to opt out/i);
    expect(screen.getByText(/message and data rates may apply/i)).toBeInTheDocument();
  });

  it("publishes complete text messaging terms", () => {
    render(
      <MemoryRouter>
        <Terms />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /text messaging terms/i })).toBeInTheDocument();
    expect(screen.getByText(/consent is optional and is not a condition/i)).toBeInTheDocument();
    expect(document.body).toHaveTextContent(/reply stop to opt out/i);
    expect(screen.getByText(/subscriber or customary user/i)).toBeInTheDocument();
  });
});
