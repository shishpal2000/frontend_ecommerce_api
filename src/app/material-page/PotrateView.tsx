export const printStyles = `
  @media print {
    /* Hide screen-only elements */
    .print-hide, .no-print {
      display: none !important;
    }
    
    /* Show print-only elements */
    .print-show {
      display: block !important;
    }
    
    /* General print settings */
    * {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      background: white !important;
      color: black !important;
    }
    
    /* Page settings */
    @page {
      size: A4;
      margin: 15mm;
    }
    
    @page portrait {
      size: A4 portrait;
      margin: 5mm;
    }
    
    /* Page break controls */
    .page-break-before {
      page-break-before: always !important;
    }
    
    .page-break-after {
      page-break-after: always !important;
    }
    
    .page-break-avoid {
      page-break-inside: avoid !important;
    }
    
    /* Material block - avoid breaking inside */
    .material-block {
      page-break-inside: avoid !important;
      margin-bottom: 20px !important;
    }
    
    /* Process block - avoid breaking inside */
    .process-block {
      page-break-inside: avoid !important;
      margin-bottom: 15px !important;
    }
    
    /* Field block - avoid breaking inside */
    .field-block {
      page-break-inside: avoid !important;
      margin-bottom: 8px !important;
    }
    
    /* Print header - centered */
    .print-header {
      text-align: center !important;
      margin-bottom: 20px !important;
      padding-bottom: 15px !important;
      border-bottom: 2px solid #333 !important;
    }
    
    .print-title {
      font-size: 18px !important;
      font-weight: bold !important;
      margin-bottom: 10px !important;
    }
    
    .print-subtitle {
      font-size: 14px !important;
      color: #666 !important;
    }
    
    /* Material cards */
    .print-material-card {
      border: 1px solid #333 !important;
      padding: 15px !important;
      margin-bottom: 20px !important;
      background: #f9f9f9 !important;
      page-break-inside: avoid !important;
    }
    
    .print-material-header {
      font-size: 14px !important;
      font-weight: bold !important;
      margin-bottom: 10px !important;
      padding-bottom: 5px !important;
      border-bottom: 1px solid #666 !important;
    }
    
    /* Process sections */
    .print-process {
      border: 1px solid #666 !important;
      margin-bottom: 12px !important;
      page-break-inside: avoid !important;
    }
    
    .print-process-header {
      background: #e0e0e0 !important;
      padding: 8px 12px !important;
      font-weight: bold !important;
      font-size: 12px !important;
    }
    
    .print-process-content {
      padding: 10px 12px !important;
    }
    
    /* Field styling */
    .print-field {
      margin-bottom: 8px !important;
      page-break-inside: avoid !important;
    }
    
    .print-field-label {
      font-weight: bold !important;
      font-size: 11px !important;
      margin-bottom: 3px !important;
    }
    
    .print-field-input {
      border: none !important;
      border-bottom: 1px solid #333 !important;
      padding: 2px 0 !important;
      min-height: 16px !important;
      background: transparent !important;
    }
    
    /* Grid layouts for print */
    .print-grid-2 {
      display: grid !important;
      grid-template-columns: 1fr 1fr !important;
      gap: 15px !important;
    }
    
    .print-grid-3 {
      display: grid !important;
      grid-template-columns: 1fr 1fr 1fr !important;
      gap: 10px !important;
    }
    
    /* Material info grid */
    .print-material-info {
      display: grid !important;
      grid-template-columns: 1fr 1fr 1fr !important;
      gap: 15px !important;
      margin-bottom: 15px !important;
    }
    
    .print-info-item {
      border: 1px solid #ccc !important;
      padding: 8px !important;
      background: white !important;
    }
    
    .print-info-label {
      font-size: 10px !important;
      font-weight: bold !important;
      color: #666 !important;
      margin-bottom: 3px !important;
    }
    
    .print-info-value {
      font-size: 12px !important;
      color: #333 !important;
    }
    
    /* Landscape specific */
    .print-landscape {
      page: landscape !important;
    }
    
    .print-landscape .print-grid-2 {
      grid-template-columns: 1fr 1fr !important;
      gap: 20px !important;
    }
    
    /* Portrait specific */
    .print-portrait {
      page: portrait !important;
    }
    
    .print-portrait .material-block {
      margin-bottom: 25px !important;
    }
    
    /* Color coding for different material types */
    .material-current {
      background: #e3f2fd !important;
      border-color: #1976d2 !important;
    }
    
    .material-previous {
      background: #fff3e0 !important;
      border-color: #f57c00 !important;
    }
    
    /* Footer */
    .print-footer {
      position: fixed !important;
      bottom: 0 !important;
      width: 100% !important;
      text-align: center !important;
      font-size: 10px !important;
      color: #666 !important;
      border-top: 1px solid #ccc !important;
      padding-top: 5px !important;
    }
    
    /* Ensure proper text rendering */
    h1, h2, h3, h4, h5, h6 {
      color: black !important;
    }
    
    /* Required field indicator */
    .required {
      color: #d32f2f !important;
    }
  }
`;

// Function to inject print styles
export const injectPrintStyles = () => {
  if (typeof window !== "undefined") {
    const styleElement = document.createElement("style");
    styleElement.type = "text/css";
    styleElement.innerHTML = printStyles;
    document.head.appendChild(styleElement);
  }
};

export default { printStyles, injectPrintStyles };
