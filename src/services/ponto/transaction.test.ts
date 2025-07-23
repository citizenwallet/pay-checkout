import { extractIdFromMessage } from "./transaction";

describe("extractIdFromMessage", () => {
  const testCases = [
    // Basic cases
    {
      input: "123",
      expected: "123",
      description: "Simple numeric string",
    },
    {
      input: "Order #123",
      expected: "123",
      description: "Numeric ID with text prefix",
    },
    {
      input: "Transaction 456 completed",
      expected: "456",
      description: "Numeric ID embedded in text",
    },
    {
      input: "ID: 789 - Payment processed",
      expected: "789",
      description: "Numeric ID with surrounding text",
    },

    // Multiple numbers
    {
      input: "Order 123, Amount: 456",
      expected: "123456",
      description: "Multiple numbers concatenated",
    },
    {
      input: "Ref: 111-222-333",
      expected: "111222333",
      description: "Numbers separated by hyphens",
    },
    {
      input: "ID: 123.456.789",
      expected: "123456789",
      description: "Numbers separated by dots",
    },

    // Special characters
    {
      input: "Order#123!@#$%",
      expected: "123",
      description: "Numbers with special characters",
    },
    {
      input: "ID: 456 & Amount: 789",
      expected: "456789",
      description: "Numbers with ampersand and text",
    },
    {
      input: "Transaction (123) - [456]",
      expected: "123456",
      description: "Numbers in parentheses and brackets",
    },

    // Whitespace handling
    {
      input: "  123  ",
      expected: "123",
      description: "Numbers with leading/trailing whitespace",
    },
    {
      input: "Order\t123\n456",
      expected: "123456",
      description: "Numbers with tabs and newlines",
    },

    // Edge cases
    {
      input: "",
      expected: "",
      description: "Empty string",
    },
    {
      input: "   ",
      expected: "",
      description: "Whitespace only",
    },
    {
      input: "No numbers here",
      expected: "",
      description: "No numbers in string",
    },
    {
      input: "ABC123DEF456",
      expected: "123456",
      description: "Numbers embedded in letters",
    },

    // Complex cases
    {
      input: "Order #123-456-789 (Amount: $100.50)",
      expected: "12345678910050",
      description: "Complex string with multiple number formats",
    },
    {
      input: "ID: 001, Ref: 002, Seq: 003",
      expected: "001002003",
      description: "Multiple IDs with leading zeros",
    },
    {
      input: "Transaction ID: 12345 | Amount: 678.90 | Fee: 1.23",
      expected: "1234567890123",
      description: "Multiple decimal numbers",
    },

    // Real-world scenarios
    {
      input: "Payment for order #ORD-2024-001",
      expected: "2024001",
      description: "Order number with year format",
    },
    {
      input: "Transfer to account 1234567890",
      expected: "1234567890",
      description: "Account number",
    },
    {
      input: "Refund for transaction TXN-12345-67890",
      expected: "1234567890",
      description: "Transaction reference",
    },

    // Unicode and special characters
    {
      input: "Order №123 (№ is unicode)",
      expected: "123",
      description: "Unicode number symbol",
    },
    {
      input: "ID: 123④④④",
      expected: "123",
      description: "Unicode circled numbers",
    },

    // Very long numbers
    {
      input: "Account: 123456789012345678901234567890",
      expected: "123456789012345678901234567890",
      description: "Very long number",
    },

    // Mixed formats
    {
      input: "Order #123, Amount: €456.78, Fee: $12.34",
      expected: "123456781234",
      description: "Mixed currency symbols and decimals",
    },

    // With spaces
    {
      input: "000 0000 00505",
      expected: "000000000505",
      description: "With spaces",
    },
    {
      input: "000000000101",
      expected: "000000000101",
      description: "correct",
    },
    {
      input: "00/0000/000101",
      expected: "000000000101",
      description: "belgian style",
    },
    {
      input: "+++00/0000/000101+++",
      expected: "000000000101",
      description: "belgian style with special characters",
    },
  ];

  testCases.forEach(({ input, expected, description }) => {
    it(`should extract numbers from "${input}" - ${description}`, () => {
      const result = extractIdFromMessage(input);
      expect(result).toBe(expected);
    });
  });

  // Additional test for function behavior
  describe("function behavior", () => {
    it("should return the same result for multiple calls with same input", () => {
      const input = "Order #123 with amount $456.78";
      const result1 = extractIdFromMessage(input);
      const result2 = extractIdFromMessage(input);
      expect(result1).toBe(result2);
    });

    it("should handle null and undefined gracefully", () => {
      // @ts-expect-error - testing edge cases
      expect(() => extractIdFromMessage(null)).toThrow();
      // @ts-expect-error - testing edge cases
      expect(() => extractIdFromMessage(undefined)).toThrow();
    });

    it("should preserve leading zeros", () => {
      const input = "Order #001, Ref: 002";
      const result = extractIdFromMessage(input);
      expect(result).toBe("001002");
    });
  });
});
