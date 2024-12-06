describe("File Upload System", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("should render file upload zone", () => {
    cy.get('[data-testid="file-upload-zone"]').should("be.visible");
  });

  it("should allow CSV file selection via drag and drop", () => {
    const fileName = "test-data.csv";
    const fileType = "text/csv";

    cy.fixture(fileName).then((fileContent) => {
      cy.get('[data-testid="file-upload-zone"]').trigger("drop", {
        dataTransfer: {
          files: [new File([fileContent], fileName, { type: fileType })],
        },
      });
    });

    cy.get('[data-testid="file-upload-list"]')
      .should("be.visible")
      .and("contain", "test-data.csv");
  });

  it("should prevent non-CSV file uploads", () => {
    const fileName = "test-image.png";
    const fileType = "image/png";

    cy.fixture(fileName).then((fileContent) => {
      cy.get('[data-testid="file-upload-zone"]').trigger("drop", {
        dataTransfer: {
          files: [new File([fileContent], fileName, { type: fileType })],
        },
      });
    });

    cy.on("window:alert", (str) => {
      expect(str).to.equal("Please upload only CSV files");
    });

    cy.get('[data-testid="file-upload-list"]').should("not.exist");
  });

  it("should allow multiple CSV file uploads", () => {
    const files = [
      { name: "data1.csv", type: "text/csv" },
      { name: "data2.csv", type: "text/csv" },
    ];

    files.forEach((file) => {
      cy.fixture(file.name).then((fileContent) => {
        cy.get('[data-testid="file-upload-zone"]').trigger("drop", {
          dataTransfer: {
            files: [new File([fileContent], file.name, { type: file.type })],
          },
        });
      });
    });

    cy.get('[data-testid="file-upload-list"] > li')
      .should("have.length", 2)
      .and("contain", "data1.csv")
      .and("contain", "data2.csv");
  });

  it("should show upload progress", () => {
    const fileName = "test-data.csv";
    const fileType = "text/csv";

    cy.fixture(fileName).then((fileContent) => {
      cy.get('[data-testid="file-upload-zone"]').trigger("drop", {
        dataTransfer: {
          files: [new File([fileContent], fileName, { type: fileType })],
        },
      });
    });

    cy.get('[data-testid="upload-button"]').should("be.enabled").click();

    cy.get('[data-testid="progress-bar"]')
      .should("be.visible")
      .and("have.attr", "aria-valuenow");
  });

  it("should handle file removal", () => {
    const fileName = "test-data.csv";
    const fileType = "text/csv";

    cy.fixture(fileName).then((fileContent) => {
      cy.get('[data-testid="file-upload-zone"]').trigger("drop", {
        dataTransfer: {
          files: [new File([fileContent], fileName, { type: fileType })],
        },
      });
    });

    cy.get('[data-testid="remove-file-button"]').should("be.visible").click();

    cy.get('[data-testid="file-upload-list"]').should("not.exist");
  });
});
