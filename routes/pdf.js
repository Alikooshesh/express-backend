const express = require("express");
const router = express.Router();
const puppeteer = require("puppeteer");
const fs = require('fs');
const path = require('path');
const Record = require("../models/Record");

function getImageBase64Url(filePath) {
  if (!filePath) return '';
  try {
    const absPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(absPath)) return '';
    const data = fs.readFileSync(absPath).toString('base64');
    return `data:image/png;base64,${data}`;
  } catch (e) {
    return '';
  }
}

function generateHtmlTable(data) {
  // Inline CSS for table and overlay
  return `
    <html>
      <head>
        <title>Bill of Lading PDF</title>
        <style>
          table { border-collapse: collapse; width: 100%; }
          td, th { border: 1px solid #333; padding: 8px; }
          .logo-cell {
            position: relative;
            height: 180px;
            vertical-align: middle;
            text-align: center;
            background: #fff;
            overflow: hidden;
          }
          .logo-wrapper {
            position: relative;
            width: 100%;
            height: 100%;
          }
          .logo-img {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 120px;
            height: 120px;
            object-fit: contain;
            opacity: 0.15; /* faded watermark effect */
            transform: translate(-50%, -50%);
            z-index: 1;
          }
          .goods-list {
            position: relative;
            z-index: 2;
            display: inline-block;
            margin-top: 20px;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 15px;
          }
          .sign-stamp-cell {
            position: relative;
            height: 200px;
            overflow: hidden;
          }
          .sign-img, .stamp-img {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1;
            pointer-events: none;
            object-fit: contain;
            max-width: 90%;
            max-height: 90%;
          }
            .sign-img {
            max-width: 65%;
            max-height: 65%;
            }
        </style>
      </head>
      <body>
        <h2>Bill of Lading</h2>
        <table>
          <tr>
            <td>Consignor</td>
            <td>${data.consignor.replace(/\r\n|\n|\r/g, '<br>')}</td>
          </tr>
          <tr>
            <td>Consignee</td>
            <td>${data.consignee.replace(/\r\n|\n|\r/g, '<br>')}</td>
          </tr>
          <tr>
            <td colspan="2">Occean Vessel: ${data.occeanVessel}</td>
          </tr>
          <tr>
            <td colspan="2">Port of Loading: ${data.portOfLoading}</td>
          </tr>
          <tr>
            <td colspan="2">Port of Discharge: ${data.portOfDischarge}</td>
          </tr>
          <tr>
            <td colspan="2">Place of Delivery: ${data.placeOfDelivery}</td>
          </tr>
          <tr>
            <td colspan="2" class="logo-cell">
              <div class="logo-wrapper">
                <img src="${data.logoUrl}" class="logo-img" />
                <div class="goods-list">
                  <b>Goods Carried:</b>
                  <ul>
                    ${data.goods.map(good => `<li>${good}</li>`).join('')}
                  </ul>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td>Shipped on Board</td>
            <td>${data.shippedOnBoard}</td>
          </tr>
          <tr>
            <td>Date of Issue</td>
            <td>${data.dateOfIssue}</td>
          </tr>
          <tr>
            <td colspan="2" class="sign-stamp-cell">
                <b>Stamp and Signature</b>
              <img src="${data.signatureUrl}" class="sign-img"
                style="transform: translate(-50%, -50%) scale(${data.signScale});" />
              <img src="${data.stampUrl}" class="stamp-img"
                style="transform: translate(-50%, -50%) rotate(${data.stampAngle}deg);" />
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

router.get("/bl/:api_key/:id", async (req, res) => {
  const apiKey = req.params.api_key;
  if (!apiKey) {
    return res.status(401).json({ message: "API key is required" });
  }
  try {
    const category = "bl";
    const record = await Record.findOne({
      data_id: Number(req.params.id),
      application_key: apiKey,
      user_custom_category: category,
    });

    if (record) {
      const bl = record.toObject();

      // For demo, use hardcoded data. Replace with req.body or req.query as needed.
    const logoPath = path.join(__dirname, '../assets/logo/logo.png');
    const logoData = fs.readFileSync(logoPath).toString('base64');
    const logoUrl = `data:image/png;base64,${logoData}`;

    const signatureUrl = getImageBase64Url(bl.signature);
    const stampUrl = getImageBase64Url(bl.stamp);

    const signScale = (Math.random() * 1.0 + 0.5).toFixed(2); // 0.5 to 1.5
    const stampAngle = (Math.random() * 60 - 30).toFixed(2);  // -30 to +30 degrees

    const data = {
      consignor: `
        ${bl.shipper}\n
        ${bl.shipperAddress}
      `,
      consignee: `
        ${bl.consignee}\n
        ${bl.consigneeAddress}
      `,
      occeanVessel: bl.vesselName,
      portOfLoading: bl.origin,
      portOfDischarge: bl.destination,
      placeOfDelivery: bl.destination,
      logoUrl: logoUrl,
      goods: bl.products.map(item => `${item.weight} ${item.unit} ${item.productName}`),
      shippedOnBoard: bl.shipmentDate,
      dateOfIssue: bl.registerDate,
      signatureUrl: signatureUrl,
      stampUrl: stampUrl,
      signScale,
      stampAngle
    };

    const htmlContent = generateHtmlTable(data);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({ format: "A4" });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="sample.pdf"');
    res.setHeader("Content-Length", pdfBuffer.length);
    res.end(pdfBuffer);

    } else {
      res.status(404).json({ message: "Record not found or unauthorized" });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
