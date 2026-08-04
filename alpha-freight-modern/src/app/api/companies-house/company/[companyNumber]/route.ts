import { NextRequest, NextResponse } from "next/server";

const COMPANIES_HOUSE_API_BASE = "https://api.company-information.service.gov.uk";

type CompaniesHouseAddress = {
  address_line_1?: string;
  address_line_2?: string;
  locality?: string;
  region?: string;
  postal_code?: string;
  country?: string;
};

const mapAddress = (address?: CompaniesHouseAddress | null) => ({
  addressLine1: address?.address_line_1 ?? null,
  addressLine2: address?.address_line_2 ?? null,
  locality: address?.locality ?? null,
  region: address?.region ?? null,
  postalCode: address?.postal_code ?? null,
  country: address?.country ?? null,
});

const getAuthHeader = () => {
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY;

  if (!apiKey) {
    return null;
  }

  return `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ companyNumber: string }> }
) {
  const { companyNumber } = await context.params;
  const trimmedCompanyNumber = companyNumber.trim();

  if (!trimmedCompanyNumber) {
    return NextResponse.json(
      { error: "Company number is required." },
      { status: 400 }
    );
  }

  const authorization = getAuthHeader();

  if (!authorization) {
    return NextResponse.json(
      { error: "Companies House API key is not configured." },
      { status: 503 }
    );
  }

  try {
    const response = await fetch(
      `${COMPANIES_HOUSE_API_BASE}/company/${encodeURIComponent(trimmedCompanyNumber)}`,
      {
        headers: {
          Authorization: authorization,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch company details." },
        { status: response.status }
      );
    }

    const payload = (await response.json()) as {
      company_name?: string;
      company_number?: string;
      company_status?: string;
      registered_office_address?: CompaniesHouseAddress;
    };

    return NextResponse.json({
      companyName: payload.company_name ?? "",
      companyNumber: payload.company_number ?? trimmedCompanyNumber,
      companyStatus: payload.company_status ?? null,
      address: mapAddress(payload.registered_office_address),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to reach Companies House right now." },
      { status: 502 }
    );
  }
}
