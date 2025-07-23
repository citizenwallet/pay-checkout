import { render, screen } from "@testing-library/react";
import { Button } from "./button";

describe("Button", () => {
  it("renders with default variant", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it("renders with custom className", () => {
    render(<Button className="custom-class">Custom Button</Button>);
    const button = screen.getByRole("button", { name: /custom button/i });
    expect(button).toHaveClass("custom-class");
  });

  it("handles click events", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    button.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("can be disabled", () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByRole("button", { name: /disabled button/i });
    expect(button).toBeDisabled();
  });
});
