exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json"
  };

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        valid: false,
        error: "Method Not Allowed"
      })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const licenseKey = String(body.licenseKey || "").trim();
    const productId = String(
      process.env.GUMROAD_PRODUCT_ID || ""
    ).trim();

    if (!licenseKey || !productId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          valid: false,
          error: "License key or Product ID is missing"
        })
      };
    }

    const formData = new URLSearchParams();

    formData.append("product_id", productId);
    formData.append("license_key", licenseKey);
    formData.append("increment_uses_count", "false");

    const response = await fetch(
      "https://api.gumroad.com/v2/licenses/verify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formData.toString()
      }
    );

    const gumroadData = await response.json();

    console.log("Gumroad result:", {
      status: response.status,
      success: gumroadData.success
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        valid: gumroadData.success === true,
        error:
          gumroadData.success === true
            ? undefined
            : "Invalid or inactive Gumroad license key"
      })
    };
  } catch (error) {
    console.error("Verification error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        valid: false,
        error: "Unable to verify the license right now"
      })
    };
  }
};