import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Signup from "@/pages/auth/Signup";

describe("account signup", () => {
  it("shows only the essential self-certification fields", () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /sign up as agent/i }));

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/work email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mobile phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/license or mls number/i)).toBeInTheDocument();
    expect(screen.getByText(/license state/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/brokerage name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/i certify that my real estate license is active/i)).toBeInTheDocument();

    expect(screen.queryByLabelText(/brokerage address/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/brief bio/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/years of experience/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/property types you work with/i)).not.toBeInTheDocument();
  });

  it("uses one account path for investors and property owners", () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /investor \/ property owner/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /^i'm a property owner$/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /create investor \/ owner account/i }));

    expect(screen.getByRole("heading", { name: /create investor \/ property owner account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/company or investment entity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/license or mls number/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/brokerage name/i)).not.toBeInTheDocument();
  });
});
