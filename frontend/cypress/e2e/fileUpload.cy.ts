/// <reference types="cypress" />

describe("File Upload Features", () => {
  beforeEach(() => {
    cy.visit("/");
    // Reset API state if needed
    cy.intercept("GET", "**/api/files", { fixture: "emptyFiles.json" }).as(
      "getFiles"
    );
  });

  const createTestFile = (
    fileName: string,
    content: string,
    mimeType: string
  ) => {
    // Create a Blob and convert it to a FileList-like object
    const blob = new Blob([content], { type: "text/csv" });
    return {
      fileName: fileName,
      contents: blob,
      mimeType,
    };
  };
  describe("1- Multiple File Upload", () => {
    it("should upload multiple CSV files successfully", () => {
      // Create test files using Cypress fixture method

      // Create test files in Cypress FileReference format
      const testFiles = [
        createTestFile("test1.csv", "test1,data", "text/csv"),
        createTestFile("test2.csv", "test2,data", "text/csv"),
      ];
      // Stub file upload endpoints
      cy.intercept("POST", "**/api/upload/init", (req) => {
        // Log request details
        console.log("Intercepted upload init:", {
          url: req.url,
          method: req.method,
          query: req.query,
        });

        // Validate request parameters
        expect(req.query).to.have.property("filename");
        expect(req.query).to.have.property("filesize");
        expect(req.query).to.have.property("totalChunks");

        // Respond with mock data
        req.reply({
          statusCode: 200,
          body: { uploadId: "test-upload-id" },
        });
      }).as("uploadInit");

      // Create test files

      // Trigger file upload
      cy.get('[data-testid="upload-zone"]').selectFile(testFiles, {
        force: true,
      });

      // Verify files are added to the list
      cy.get('[data-testid="upload-list"]')
        .should("contain", "test1.csv")
        .and("contain", "test2.csv");

      // Click upload button
      cy.get('[data-testid="upload-button"]').click();
    });

    it("should show error for non-CSV files", () => {
      // Create test files in Cypress FileReference format
      const invalidFile = createTestFile(
        "invalid.jpg",
        "test,data",
        "image/jpeg"
      );

      cy.get('[data-testid="upload-zone"]').selectFile(invalidFile).wait(2000);
      console.log("Invalid file selected:", invalidFile);

      cy.contains("Invalid file type").should("be.visible");
    });
  });

  describe("2- Upload Progress", () => {
    it("should display progress bars during upload", () => {
      // Stub progress events
      cy.intercept("POST", "**/api/upload/**", (req) => {
        req.reply({
          statusCode: 200,
          body: { progress: 50 },
        });
      }).as("uploadProgress");

      const testFile = createTestFile("test.csv", "test,data", "text/csv");

      cy.get('[data-testid="upload-zone"]').selectFile(testFile, {
        force: true,
      });
      cy.get('[data-testid="upload-button"]').click();

      // Verify progress bar exists and shows progress
      cy.get('[data-testid="progress-bar"]')
        .should("exist")
        .and("have.attr", "aria-valuenow", "1");
    });
  });

  describe("3- File Metadata Display", () => {
    it("should display uploaded files metadata", () => {
      // Stub API response with file metadata
      cy.intercept("GET", "**/api/files", {
        statusCode: 200,
        fixture: "uploadedFiles.json",
      }).as("getFiles");

      cy.visit("/");
      cy.wait("@getFiles");

      // Verify file metadata is displayed
      cy.get('[data-testid="file-list"]').within(() => {
        cy.contains("test.csv");
        cy.contains((1024 / (1024 * 1024)).toFixed(2));
        cy.get('[data-testid="upload-date"]').should("exist");
      });
    });
  });

  describe("5- File Preview and Download", () => {
    beforeEach(() => {
      // Stub files API to load files
      cy.intercept("GET", "**/api/files", {
        statusCode: 200,
        fixture: "uploadedFiles.json",
      }).as("getFiles");

      // Stub preview API with dynamic URL parameter
      cy.intercept("GET", "**/api/preview**", {
        statusCode: 200,
        fixture: "previewData.json",
      }).as("getPreview");

      // Stub download API with dynamic URL parameter
      cy.intercept("GET", "**/api/download**", {
        statusCode: 200,
        body: "test,data",
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": "attachment; filename=test.csv",
        },
      }).as("downloadFile");

      // Visit page and wait for files to load
      cy.visit("/");
      cy.wait("@getFiles");
    });

    it("should preview CSV file content", () => {
      // Find preview button in the first row and click
      cy.get('[data-testid="file-list"]')
        .find('[data-testid="preview-button"]')
        .first()
        .click();

      cy.wait("@getPreview").then((interception) => {
        // Verify preview API call parameters
        expect(interception.request.url).to.include("/api/preview");
        expect(interception.request.query).to.have.property("url");
        expect(interception.request.query).to.have.property("skip", "0");
        expect(interception.request.query).to.have.property("limit", "100");
      });

      // Verify preview dialog
      cy.get('[data-testid="file-preview-dialog"]')
        .should("be.visible")
        .and("contain", "Preview");
    });

    it("should download files", () => {
      // Find download button in the first row and click
      cy.get('[data-testid="file-list"]')
        .find('[data-testid="download-button"]')
        .first()
        .click()
        .wait(3000);

      cy.wait("@downloadFile").then((interception: any) => {
        // Verify download API call parameters
        expect(interception.request.url).to.include("/api/download");
        expect(interception.request.query).to.have.property("url");

        // Verify response
        expect(interception.response.statusCode).to.eq(200);
        expect(interception.response.headers["Content-Type"]).to.eq(
          "application/octet-stream"
        );
        expect(interception.response.headers["Content-Disposition"]).to.include(
          "attachment"
        );
      });
    });
  });
});
