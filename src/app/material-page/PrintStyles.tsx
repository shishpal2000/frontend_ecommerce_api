export const injectPrintStyles = () => {
  // Remove existing print styles if any
  const existingStyles = document.getElementById("print-styles");
  if (existingStyles) {
    existingStyles.remove();
  }

  // Create new print styles
  const style = document.createElement("style");
  style.id = "print-styles";
  style.textContent = `
    /* Print-specific styles */
    @media print {
      /* Hide screen elements */
      .print-hide {
        display: none !important;
      }

      /* Show print elements */
      .print-show {
        display: block !important;
      }

      /* Page setup */
      @page {
        size: A4 landscape;
        margin: 15mm;
      }

      body {
        font-family: Arial, sans-serif;
        font-size: 11px;
        line-height: 1.3;
        color: #000;
        background: white;
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }

      /* Print header */
      .print-header {
        text-align: center;
        margin-bottom: 20px;
        border-bottom: 2px solid #333;
        padding-bottom: 10px;
      }

      .print-title {
        font-size: 18px;
        font-weight: bold;
        margin: 0 0 5px 0;
      }

      .print-subtitle {
        font-size: 12px;
        color: #666;
        margin: 0;
      }

      /* Main container for landscape layout */
      .print-container {
        display: flex !important;
        gap: 20px;
        height: 100%;
      }

      /* Two column layout for landscape */
      .print-column {
        flex: 1;
        min-width: 0;
      }

      /* Column headers */
      .print-column-header {
        background-color: #f5f5f5 !important;
        padding: 8px 12px;
        font-weight: bold;
        font-size: 14px;
        border: 2px solid #333;
        text-align: center;
        margin-bottom: 15px;
        page-break-after: avoid;
      }

      /* Previous proto column styling */
      .print-column.previous-proto .print-column-header {
        background-color: #fff3e0 !important;
        color: #e65100;
        border-color: #ff9800;
      }

      /* Main proto column styling */
      .print-column.main-proto .print-column-header {
        background-color: #e8f5e8 !important;
        color: #2e7d32;
        border-color: #4caf50;
      }

      /* Material blocks */
      .material-block {
        page-break-inside: avoid;
        margin-bottom: 15px;
        border: 1px solid #ddd;
        border-radius: 6px;
        padding: 12px;
        background: white;
      }

      /* Material header */
      .material-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        padding-bottom: 5px;
        border-bottom: 1px solid #eee;
        page-break-after: avoid;
      }

      .material-title {
        font-weight: bold;
        font-size: 12px;
      }

      .material-badge {
        font-size: 9px;
        padding: 2px 6px;
        border-radius: 3px;
        background: #f0f0f0;
      }

      .material-badge.previous {
        background: #fff3e0 !important;
        color: #e65100;
      }

      .material-badge.main {
        background: #e8f5e8 !important;
        color: #2e7d32;
      }

      /* Material info grid */
      .material-info {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-bottom: 12px;
        font-size: 10px;
      }

      .material-info-item {
        display: flex;
      }

      .material-info-label {
        font-weight: bold;
        min-width: 50px;
        margin-right: 8px;
      }

      .material-info-value {
        flex: 1;
        padding: 2px 6px;
        border: 1px solid #ddd;
        border-radius: 3px;
        background: #fafafa;
      }

      /* Process blocks */
      .process-block {
        page-break-inside: avoid;
        margin-bottom: 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 8px;
        background: #f9f9f9;
      }

      .process-title {
        font-weight: bold;
        font-size: 11px;
        margin-bottom: 8px;
        color: #333;
        padding: 4px 0;
        border-bottom: 1px solid #ddd;
      }

      /* Process fields */
      .process-fields {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
      }

      .field-item {
        font-size: 9px;
      }

      .field-label {
        font-weight: bold;
        margin-bottom: 2px;
      }

      .field-input {
        width: 100%;
        padding: 3px 6px;
        border: 1px solid #ccc;
        border-radius: 2px;
        background: white;
        font-size: 9px;
      }

      /* Empty states */
      .empty-state {
        text-align: center;
        padding: 30px 20px;
        border: 2px dashed #ddd;
        border-radius: 6px;
        color: #666;
        font-size: 11px;
        background: #f9f9f9;
      }

      /* Ensure proper page breaks */
      h1, h2, h3 {
        page-break-after: avoid;
      }

      /* Force landscape grid layout */
      .grid {
        display: flex !important;
        gap: 20px;
      }

      .grid > div {
        flex: 1;
      }

      /* Remove rounded corners for cleaner print */
      * {
        border-radius: 0 !important;
      }

      .material-block,
      .process-block,
      .print-column-header {
        border-radius: 3px !important;
      }
    }

    /* Screen styles - hide print elements */
    @media screen {
      .print-show {
        display: none !important;
      }
      
      .print-container {
        display: none !important;
      }
    }
  `;

  document.head.appendChild(style);
};
