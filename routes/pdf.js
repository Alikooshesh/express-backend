const express = require("express");
const router = express.Router();
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const Record = require("../models/Record");

function getImageBase64Url(filePath) {
  if (!filePath) return "";
  try {
    const absPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(absPath)) return "";
    const data = fs.readFileSync(absPath).toString("base64");
    return `data:image/png;base64,${data}`;
  } catch (e) {
    return "";
  }
}

function generateHtmlTable(data) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bill of Lading</title>
  <style>
    body { padding: 16px; color: #000; font-family: Arial, sans-serif; font-size: 14px; }
    table { border-collapse: collapse; width: 100%; }
    .table-fixed { table-layout: fixed; }
    .font-bold { font-weight: bold; }
    .text-gray { color: #7C7C7C; }
    .text-blue { color: #2996E8; }
    .p-8 { padding: 8px; }
    .border { border: 1px solid #000; }
    .bg-gray { background-color: #D9D9D9; }
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .mt-4 { margin-top: 4px; }
    .mt-8 { margin-top: 8px; }
    .mt-10 { margin-top: 10px; }
    .mt-14 { margin-top: 14px; }
    .mt-16 { margin-top: 16px; }
    .h-50 { height: 50px; }
    .h-280 { height: 280px; }
    .logo { width: 101px; margin-right: 8px; }
    .flex { display: flex; }
    .flex-col { display: flex; flex-direction: column; line-height: 1.2; }
    .items-center { align-items: center; }
    .w-45 { width: 45%; }
    .w-65 { width: 65%; }
    .pr-8 { padding-right: 8px; }
    .px-12 { padding-left: 12px; padding-right: 12px; }
    .font-500 { font-weight: 500; }
    .font-600 { font-weight: 600; }
    .font-700 { font-weight: 700; }
    .font-800 { font-weight: 800; }
    .text-12 { font-size: 12px; }
    .text-16 { font-size: 16px; }
    .text-24 { font-size: 24px; }
  </style>
</head>
<body>
  <!-- HEADER -->
  <table class="table-fixed">
    <tr>
      <td class="font-bold text-24">Bill of Lading</td>
      <td>
        <div class="flex items-center">
          <img src="${data.logoUrl}" class="logo" />
          <div class="flex-col">
            <span class="text-blue font-bold text-16">KHAREEF MARITIME</span>
            <span class="font-500 text-blue">EXPRESS SHIPPING</span>
          </div>
        </div>
      </td>
    </tr>
  </table>

  <!-- MAIN CONTENT (LEFT + RIGHT) -->
  <table class="mt-8">
    <tr>
      <!-- LEFT SIDE -->
      <td class="pr-8 w-45" valign="bottom">
        <div class="border p-8 bg-gray">
          <span class="pr-8">Bill of Lading no .</span>
          <span class="font-bold">${data.blNumber}</span>
        </div>

        <!-- Shipper -->
        <table class="mt-4 border">
          <tr class="bg-gray border">
            <th class="border font-500 p-8 text-left">Shipper (Complete Name and Address)</th>
          </tr>
          <tr class="border">
            <td class="border p-8">${data.consignor}</td>
          </tr>
        </table>

        <!-- Consignee -->
        <table class="mt-4 border">
          <tr class="bg-gray border">
            <th class="border font-500 p-8 text-left">Consignee (Complete Name and Address)</th>
          </tr>
          <tr class="border">
            <td class="border p-8">${data.consignee}</td>
          </tr>
        </table>

        <!-- Notify Party -->
        <table class="mt-4 border">
          <tr class="bg-gray border">
            <th class="border font-500 p-8 text-left">Notify Party (Complete name and Address)</th>
          </tr>
          <tr class="border">
            <td class="border p-8">${data.notify ?? data.consignee}</td>
          </tr>
        </table>
      </td>

      <!-- RIGHT SIDE -->
      <td class="w-65" valign="top">
        <p class="text-gray font-500">
          GLOBAL OCEAN BILL OF LADING FOR COMBINED TRANSPORT SHIPMENT OR PORT TO PORT SHIPMENT
        </p>
        <p class="text-center mt-16 text-12 font-800">WWW.EXAMPLE.COM</p>

        <table class="mt-14 table-fixed">
          <tr>
            <td>
              <!-- Place of Receipt -->
              <table class="mt-4 border">
                <tr class="bg-gray border">
                  <th class="border font-500 p-8 text-left">Place of Receipt:</th>
                </tr>
                <tr class="border">
                  <td class="border p-8 font-700">${data.origin}</td>
                </tr>
              </table>

              <!-- Place of Delivery -->
              <table class="mt-4 border">
                <tr class="bg-gray border">
                  <th class="border font-500 p-8 text-left">Place of Delivery:</th>
                </tr>
                <tr class="border">
                  <td class="border p-8 font-700">${data.destination}</td>
                </tr>
              </table>

              <!-- Vessel/Voyage -->
              <table class="mt-4 border">
                <tr class="bg-gray border">
                  <th class="border font-500 p-8 text-left">Vessel/Voyage no :</th>
                </tr>
                <tr class="border">
                  <td class="border p-8 font-700">${data.vesselName} - ${
    data.vesselNumber
  }</td>
                </tr>
              </table>
            </td>

            <td>
              <!-- Port of Receipt -->
              <table class="mt-4 border">
                <tr class="bg-gray border">
                  <th class="border font-500 p-8 text-left">Port of Receipt:</th>
                </tr>
                <tr class="border">
                  <td class="border p-8 font-700">${data.origin}</td>
                </tr>
              </table>

              <!-- Port of Discharge -->
              <table class="mt-4 border">
                <tr class="bg-gray border">
                  <th class="border font-500 p-8 text-left">Port of Discharge:</th>
                </tr>
                <tr class="border">
                  <td class="border p-8 font-700">${data.destination}</td>
                </tr>
              </table>

              <!-- Invoice number -->
              <table class="mt-4 border">
                <tr class="bg-gray border">
                  <th class="border font-500 p-8 text-left">Invoice number:</th>
                </tr>
                <tr class="border">
                  <td class="border p-8 font-700">${data.invoiceNo ?? "-"}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Container Table -->
  <table class="mt-8 border">
    <tr class="bg-gray border">
      <th class="border font-500 p-8">Container no</th>
      <th class="border font-500 p-8">Description of the Packages and Goods</th>
      <th class="border font-500 p-8">No. of PKGS</th>
      <th class="border font-500 p-8">Gross weight</th>
      <th class="border font-500 p-8">Measurement</th>
    </tr>
    ${data.products
      .map(
        (item,index) => `
    <tr class="border h-50 text-center">
      <td class="border p-8">${index+1}</td>
      <td class="border p-8"><p class="font-600 mt-10 text-gray">${
        item.productName
      } <br> ${item.description}</p></td>
      <td class="border p-8">${item.productQuantity || ""}</td>
      <td class="border p-8">${item.weight || ""} ${item.unit || ""}</td>
      <td class="border p-8">${item.measurement || ""}</td>
    </tr>`
      )
      .join("")}
    <tr class="border">
      <td class="text-center font-700 border">Total</td>
      <td></td>
    </tr>
  </table>

  <!-- Freight Payable -->
  <table class="mt-4 border">
    <tr>
      <th class="font-700 text-left px-12 border">Freight Payable at</th>
      <th class="font-700 text-left px-12 border">Place of issue</th>
      <th class="font-700 text-left px-12 border">Date of issue</th>
      <th class="font-700 text-left px-12 border">Shipped in Board</th>
    </tr>
    <tr>
      <td class="font-700 text-gray px-12 border">${data.destination}</td>
      <td class="font-700 text-gray px-12 border">${data.origin}</td>
      <td class="font-700 text-gray px-12 border">${data.dateOfIssue}</td>
      <td class="font-700 text-gray px-12 border">${data.shippedOnBoard}</td>
    </tr>
  </table>

  <!-- Release + Agents Stamp -->
  <table class="mt-10 table-fixed">
    <tr>
      <td>
        <table class="mt-4 border">
          <tr class="bg-gray border">
            <th class="border font-500 p-8 text-left">For Release of Shipment</th>
          </tr>
          <tr class="border">
            <td class="border p-8 h-280 text-center">
              <p class="font-700">KHAREEF MARITIME GLOBAL SHIPPING COMPANY</p>
              <p class="font-600 mt-10 text-gray">WWW.EXAMPLE.COM</p>
            </td>
          </tr>
        </table>
      </td>
      <td>
        <table class="mt-4 border">
          <tr class="bg-gray border">
            <th class="border font-500 p-8 text-left">Agents Stamp and Signature</th>
          </tr>
          <tr class="border">
            <td class="border p-8 h-280 text-center">
              <img src="${
                data.signatureUrl
              }" style="max-height:80px; transform: scale(${
    data.signScale
  });"/><br/>
              <img src="${
                data.stampUrl
              }" style="max-height:80px; transform: rotate(${
    data.stampAngle
  }deg);"/>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Notice of Claim -->
  <table class="mt-10">
    <tr>
      <td>
        <table class="mt-4 border">
          <tr class="bg-gray border">
            <th class="border font-500 p-8 text-left">Notice of Claim</th>
          </tr>
          <tr class="border">
            <td class="border p-8 h-280 text-center">
              <p class="font-700">KHAREEF MARITIME GLOBAL SHIPPING COMPANY</p>
              <p class="font-600 mt-10 text-gray">WWW.EXAMPLE.COM</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
      const logoPath = path.join(__dirname, "../assets/logo/logo.png");
      const logoData = fs.readFileSync(logoPath).toString("base64");
      const logoUrl = `data:image/png;base64,${logoData}`;

      const signatureUrl = getImageBase64Url(bl.signature);
      const stampUrl = getImageBase64Url(bl.stamp);

      const data = {
        ...bl,
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
        goods: bl.products.map(
          (item) => `${item.weight} ${item.unit} ${item.productName}`
        ),
        shippedOnBoard: bl.shipmentDate,
        dateOfIssue: bl.registerDate,
        signatureUrl: signatureUrl,
        stampUrl: stampUrl,
        signScale: bl.signScale ?? 1,
        stampAngle: bl.stampAngle ?? 0,
      };

      const htmlContent = generateHtmlTable(data);

      const browser = await puppeteer.launch({
        headless: true, // or false if you want to see the browser
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
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
